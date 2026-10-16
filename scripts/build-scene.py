"""Turn the generated island artwork into the layers Surface.tsx draws.

    python3 -m pip install pillow numpy opencv-python-headless "rembg[cpu]"
    python3 scripts/build-scene.py DAY NIGHT SUN SHIP PLANE CLOUD1 CLOUD2 CLOUD3

DAY and NIGHT are the full scene plates; the rest are single objects on a
plain white background. Writes public/scene/*.webp:

  plate-day, plate-night  the scene, coconuts painted out of the day plate
  front-day, front-night  just the island's props and palms above the
                          horizon, so the pirate ship can sail behind them
  nuts                    the day plate's own coconuts, one per tile, so the
                          ones you knock down are exactly the ones on the tree
  sun, ship, plane, cloud-1..3

Positions below are pixels in the 1672x941 plates; if they're regenerated,
re-measure them (Surface.tsx uses the same numbers, scaled to its 1600 wide
viewBox).
"""

import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from rembg import new_session, remove

OUT = Path(__file__).resolve().parent.parent / 'public' / 'scene'
OUT.mkdir(parents=True, exist_ok=True)

# Coconut centres and radii on the day plate: left palm, then right.
NUTS = [
    (512.7, 456.0, 13.5),
    (497.3, 475.0, 16.0),
    (531.5, 483.5, 15.5),
    (1170.5, 480.5, 12.5),
    (1157.5, 501.5, 15.2),
    (1190.5, 499.5, 14.1),
]
NUT_PAD = 1.5  # crop a touch beyond the shell so its edge isn't clipped
NUT_TILE = 64  # px per tile in nuts.webp (upscaled, so they stay smooth when rolling)
# Where the island's props stick up above the horizon, for the front layers.
FRONT_BOX = (340, 350, 1340, 690)

day_path, night_path, sun_path, ship_path, plane_path, *cloud_paths = sys.argv[1:]


def save(img: Image.Image, name: str, quality: int = 86) -> None:
    path = OUT / f'{name}.webp'
    img.save(path, quality=quality, method=6)
    print(f'{name}.webp: {img.size[0]}x{img.size[1]}, {path.stat().st_size // 1024} KB')


def trim(img: Image.Image, width: int) -> Image.Image:
    box = img.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    img = img.crop(box)
    if img.width > width:
        img = img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)
    return img


# The distant island behind the left palm sits in this band of rows. Its
# greenery never counts as foreground; its pale beach doesn't either, except
# in the columns of the palm trunk and signpost, whose wood is just as pale.
FAR_BAND = (555, 632)
FAR_RIGHT = 720  # the far island ends here
PROPS_X = (440, 660)


def front(plate: np.ndarray, leaf_tolerance: int) -> Image.Image:
    """Everything in FRONT_BOX that isn't sky, sea, cloud or the far island.
    At night the leaves are blue-green, so blue has to win by more to count
    as sky."""
    x0, y0, x1, y1 = FRONT_BOX
    rgb = plate[y0:y1, x0:x1].astype(int)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    bluish = (b > r + 25) & (b > g + leaf_tolerance)
    whitish = rgb.min(-1) > 205
    rows = np.arange(y0, y1)[:, None]
    cols = np.arange(x0, x1)[None, :]
    in_band = (rows >= FAR_BAND[0]) & (rows < FAR_BAND[1]) & (cols < FAR_RIGHT)
    beside_props = (cols < PROPS_X[0]) | (cols >= PROPS_X[1])
    far = in_band & ((g > r) | (beside_props & (rgb.max(-1) > 120)))
    solid = (~bluish & ~whitish & ~far).astype(np.uint8) * 255
    solid = cv2.morphologyEx(solid, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    solid = cv2.morphologyEx(solid, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    alpha = np.zeros(plate.shape[:2], np.uint8)
    alpha[y0:y1, x0:x1] = cv2.GaussianBlur(solid, (3, 3), 0)
    return Image.fromarray(np.dstack([plate, alpha]), 'RGBA')


# --- plates -------------------------------------------------------------------
day = np.array(Image.open(day_path).convert('RGB'))
night = np.array(Image.open(night_path).convert('RGB'))

# Lift the coconuts out as tiles, then paint them out of the plate.
tiles = Image.new('RGBA', (NUT_TILE * len(NUTS), NUT_TILE))
hole = np.zeros(day.shape[:2], np.uint8)
for i, (cx, cy, r) in enumerate(NUTS):
    R = r + NUT_PAD
    crop = Image.fromarray(day).crop((round(cx - R), round(cy - R), round(cx + R), round(cy + R)))
    tiles.paste(crop.resize((NUT_TILE, NUT_TILE), Image.LANCZOS).convert('RGBA'), (i * NUT_TILE, 0))
    cv2.circle(hole, (round(cx), round(cy)), round(r + 2.5), 255, -1)
day = cv2.inpaint(day, hole, 6, cv2.INPAINT_TELEA)

save(Image.fromarray(day), 'plate-day', 84)
save(Image.fromarray(night), 'plate-night', 84)
save(front(day, -5), 'front-day', 88)
save(front(night, 12), 'front-night', 88)
save(tiles, 'nuts', 90)

# --- objects ------------------------------------------------------------------
# The sun is plain yellow on white, so key it on colour: the model drops the
# thin rays. Pull the white fringe out of the edge pixels as well.
sun = np.array(Image.open(sun_path).convert('RGB')).astype(float)
a = np.clip((248 - sun[..., 2]) / 70, 0, 1)
colour = np.where(a[..., None] > 0.01, (sun - (1 - a[..., None]) * 255) / np.maximum(a[..., None], 0.01), 0)
sun_img = Image.fromarray(np.dstack([colour.clip(0, 255), a * 255]).astype(np.uint8), 'RGBA')
save(trim(sun_img, 520), 'sun', 90)

session = new_session('isnet-general-use')
for path, name, width in [(ship_path, 'ship', 640), (plane_path, 'plane', 560)] + [
    (p, f'cloud-{i + 1}', 900) for i, p in enumerate(cloud_paths)
]:
    save(trim(remove(Image.open(path).convert('RGB'), session=session), width), name, 88)
