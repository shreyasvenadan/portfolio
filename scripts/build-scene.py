"""Turn the generated island artwork into the layers Surface.tsx draws.

    python3 -m pip install pillow numpy opencv-python-headless "rembg[cpu]"
    python3 scripts/build-scene.py --plate DAY --sky SKY --mountain MOUNTAIN \\
        --palm PALM --sign SIGN --ball BALL --camera CAMERA \\
        --sun SUN --moon MOON --ship SHIP --plane PLANE \\
        --clouds CLOUD... [--sea FRAME...]

The scene is built from parts. PLATE is the original full render of the
island: only its sea and sand are used (below the horizon), with its own
palms, signpost, ball and camera painted out, since the separate PALM, SIGN,
BALL and CAMERA images stand in the same places on top. SKY replaces
everything above the horizon, with MOUNTAIN on it. Each --sea FRAME is a copy
of PLATE in which only the water changed; the page crossfades between them.

Objects with real transparency are used as they are; ones on a plain white
background are cut out. Writes public/scene/*.webp and prints the numbers
Surface.tsx needs (sizes, base points, coconuts).

Positions are pixels in the 1672x941 plate unless they say otherwise.
"""

import argparse
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from rembg import new_session, remove

OUT = Path(__file__).resolve().parent.parent / 'public' / 'scene'
OUT.mkdir(parents=True, exist_ok=True)

# The plate's horizon; the sea layer starts SEA_FADE rows above it, fading in.
HORIZON = 625
SEA_FADE = 12
SEA_TOP = HORIZON - SEA_FADE

# The plate's own props below the horizon, painted out of the sea layer. Boxes
# are painted out whole where the new prop covers them; in the camera's box
# only its dark pixels go (the tripod is spindly, the sand shows between its
# legs); the ball is a circle. Grass tufts stay.
PAINT_OUT_BOXES = [
    (448, SEA_TOP, 505, 735),  # left palm trunk
    (1172, SEA_TOP, 1226, 730),  # right palm trunk
    (576, SEA_TOP, 604, 722),  # signpost
    (536, SEA_TOP, 656, 662),  # the "jakarta" board
]
CAMERA_BOX = (1028, SEA_TOP, 1136, 722)
BALL = (1000, 688, 31)

# The palm's coconuts, in the palm image's own pixels: centre and radius.
PALM_NUTS = [(650, 378, 44), (590, 432, 51), (689, 468, 50)]
NUT_TILE = 96
PALM_HEIGHT = 820

parser = argparse.ArgumentParser()
for name in ('plate', 'sky', 'mountain', 'palm', 'sign', 'ball', 'camera', 'sun', 'moon', 'ship', 'plane'):
    parser.add_argument(f'--{name}', required=True)
parser.add_argument('--clouds', nargs='+', required=True)
parser.add_argument('--sea', nargs='*', default=[])
args = parser.parse_args()

session = None


def save(img: Image.Image, name: str, quality: int = 86) -> None:
    path = OUT / f'{name}.webp'
    img.save(path, quality=quality, method=6)
    print(f'{name}.webp: {img.size[0]}x{img.size[1]}, {path.stat().st_size // 1024} KB')


def cutout(path: str) -> Image.Image:
    """The object with a transparent background: its own if it has one."""
    global session
    img = Image.open(path)
    if img.mode == 'RGBA' and img.getchannel('A').getextrema()[0] < 8:
        return img
    session = session or new_session('isnet-general-use')
    return remove(img.convert('RGB'), session=session)


def trimmed(img: Image.Image) -> tuple[Image.Image, tuple[int, int, int, int]]:
    box = img.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    return img.crop(box), box


def fit(img: Image.Image, width: int | None = None, height: int | None = None) -> Image.Image:
    w, h = img.size
    scale = min((width or w) / w, (height or h) / h, 1)
    return img.resize((round(w * scale), round(h * scale)), Image.LANCZOS) if scale < 1 else img


def base(img: Image.Image) -> float:
    """Centre column of an object's bottom few rows: where it stands."""
    a = np.array(img.getchannel('A')) > 128
    rows = np.where(a.any(1))[0]
    cols = np.where(a[rows[-1] - 20 : rows[-1] - 4].any(0))[0]
    return (cols.min() + cols.max()) / 2


# --- sky and sea ----------------------------------------------------------------
save(fit(Image.open(args.sky).convert('RGB'), 1672), 'sky', 80)

plate = np.array(Image.open(args.plate).convert('RGB'))
hole = np.zeros(plate.shape[:2], np.uint8)
for x0, y0, x1, y1 in PAINT_OUT_BOXES:
    hole[y0:y1, x0:x1] = 255
x0, y0, x1, y1 = CAMERA_BOX
hole[y0:y1, x0:x1] = (plate[y0:y1, x0:x1].mean(-1) < 85) * 255
cv2.circle(hole, BALL[:2], BALL[2], 255, -1)
hole = cv2.dilate(hole, np.ones((5, 5), np.uint8))


def sea_layer(frame: np.ndarray) -> Image.Image:
    strip = cv2.inpaint(frame, hole, 7, cv2.INPAINT_TELEA)[SEA_TOP:]
    alpha = np.full(strip.shape[:2], 255, np.uint8)
    alpha[:SEA_FADE] = np.linspace(0, 255, SEA_FADE)[:, None]
    return Image.fromarray(np.dstack([strip, alpha]), 'RGBA')


save(sea_layer(plate), 'sea', 84)
for i, path in enumerate(args.sea):
    frame = np.array(Image.open(path).convert('RGB'))
    # Anything that moved above the water would jump as the frames crossfade.
    drift = np.abs(frame[:SEA_TOP].astype(int) - plate[:SEA_TOP]).mean()
    if frame.shape != plate.shape or drift > 8:
        raise SystemExit(f'{path}: the scene above the water changed (mean difference {drift:.1f}); it needs to match PLATE exactly')
    save(sea_layer(frame), f'sea-{i + 1}', 82)

# --- props ----------------------------------------------------------------------
# The palm's coconuts are lifted out as tiles (so the knocked-down ones match)
# and painted out of the palm.
palm, (px0, py0, _, _) = trimmed(cutout(args.palm))
rgba = np.array(palm)
tiles = Image.new('RGBA', (NUT_TILE * len(PALM_NUTS), NUT_TILE))
nut_hole = np.zeros(rgba.shape[:2], np.uint8)
nuts = []
for i, (cx, cy, r) in enumerate(PALM_NUTS):
    cx, cy = cx - px0, cy - py0
    crop = palm.crop((cx - r, cy - r, cx + r, cy + r)).resize((NUT_TILE, NUT_TILE), Image.LANCZOS)
    yy, xx = np.mgrid[0:NUT_TILE, 0:NUT_TILE]
    inside = np.hypot(xx - NUT_TILE / 2 + 0.5, yy - NUT_TILE / 2 + 0.5) <= NUT_TILE / 2
    crop.putalpha(Image.fromarray((np.array(crop.getchannel('A')) * inside).astype(np.uint8)))
    tiles.paste(crop, (i * NUT_TILE, 0))
    cv2.circle(nut_hole, (cx, cy), r + 3, 255, -1)
    nuts.append((cx, cy, r))
# Fill the transparency the same way, so where a coconut hung over open sky
# the gap is see-through rather than a smear.
rgba[..., :3] = cv2.inpaint(rgba[..., :3], nut_hole, 9, cv2.INPAINT_TELEA)
rgba[..., 3] = cv2.inpaint(rgba[..., 3], nut_hole, 9, cv2.INPAINT_TELEA)
palm = fit(Image.fromarray(rgba, 'RGBA'), height=PALM_HEIGHT)
k = palm.height / rgba.shape[0]
save(palm, 'palm', 88)
save(tiles, 'nuts', 90)
print(f'  palm base x {base(palm):.1f}, coconuts {[(round(x * k, 1), round(y * k, 1), round(r * k, 1)) for x, y, r in nuts]}')

for name, path, height in [('sign', args.sign, 420), ('camera', args.camera, 380), ('ball', args.ball, 128)]:
    img = fit(trimmed(cutout(path))[0], height=height)
    save(img, name, 88)
    print(f'  {name} base x {base(img):.0f}')
mountain = fit(trimmed(cutout(args.mountain))[0], 1280)
save(mountain, 'mountain', 86)

# --- sky objects ----------------------------------------------------------------
# The sun is plain yellow on white, so key it on colour (a cutout model drops
# its thin rays), pulling the white fringe out of the edge pixels as well.
sun_src = Image.open(args.sun)
if sun_src.mode == 'RGBA' and sun_src.getchannel('A').getextrema()[0] < 8:
    sun_img = sun_src
else:
    sun = np.array(sun_src.convert('RGB')).astype(float)
    a = np.clip((248 - sun[..., 2]) / 70, 0, 1)
    colour = np.where(a[..., None] > 0.01, (sun - (1 - a[..., None]) * 255) / np.maximum(a[..., None], 0.01), 0)
    sun_img = Image.fromarray(np.dstack([colour.clip(0, 255), a * 255]).astype(np.uint8), 'RGBA')
save(fit(trimmed(sun_img)[0], 520), 'sun', 90)

for name, path, width in [('moon', args.moon, 320), ('ship', args.ship, 640), ('plane', args.plane, 560)] + [
    (f'cloud-{i + 1}', p, 900) for i, p in enumerate(args.clouds)
]:
    save(fit(trimmed(cutout(path))[0], width), name, 88)
