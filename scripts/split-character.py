"""Split the rendered Peanuts-style character into animation layers.

    python3 -m pip install pillow numpy
    python3 scripts/split-character.py ~/Downloads/peanuts-character.png

Writes public/character/{body,head,shadow}.webp, all the same size so they
stack exactly. The eyes are painted out of the head layer; Character.tsx
redraws them so they can blink and follow the cursor. Coordinates below are
for the 1920x1080 source render.
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image

CROP = (690, 344, 1160, 1064)  # left, top, right, bottom; feet sit 94.6% down
NECK_CUT = 668  # the head layer is everything above this line
NECK_X = (924, 982)  # body keeps a stub of neck under the head to hide the seam
NECK_OVERLAP = 8
SHADOW_TOP = 975  # the baked floor shadow is the faint pixels below this line
# Eye centres and erase radii. The right eye's is narrow so it stops short of
# the nose beside it.
EYES = [((936.5, 523.4), (9, 11)), ((986.4, 522.4), (6.5, 10))]

src = np.array(Image.open(sys.argv[1]).convert('RGBA')).astype(float)
h, w = src.shape[:2]
ys, xs = np.mgrid[0:h, 0:w]

shadow_mask = (ys >= SHADOW_TOP) & (src[..., 3] <= 120)
head_mask = ys < NECK_CUT
neck_stub = (ys >= NECK_CUT - NECK_OVERLAP) & (xs >= NECK_X[0]) & (xs <= NECK_X[1])
body_mask = (~head_mask | neck_stub) & ~shadow_mask

# Paint out the eyes: fill each one by blending vertically between the skin
# just above and below it (the nose sits right beside the right eye, so a
# horizontal fill would smear it), feathered at the edge.
head = src.copy()
for (cx, cy), (rx, ry) in EYES:
    top, bot = int(cy - ry - 2), int(cy + ry + 2)
    for x in range(int(cx - rx - 1), int(cx + rx + 2)):
        a, b = src[top, x], src[bot, x]
        for y in range(top + 1, bot):
            d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
            if d >= 1.3:
                continue
            fill = a + (b - a) * (y - top) / (bot - top)
            k = 1 if d <= 1 else (1.3 - d) / 0.3
            head[y, x] = head[y, x] * (1 - k) + fill * k


def layer(pixels: np.ndarray, mask: np.ndarray, name: str) -> None:
    out = pixels.copy()
    out[~mask, 3] = 0
    img = Image.fromarray(out.clip(0, 255).astype(np.uint8), 'RGBA').crop(CROP)
    path = Path(__file__).resolve().parent.parent / 'public' / 'character' / f'{name}.webp'
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, quality=92, method=6)
    print(f'{path.name}: {img.size[0]}x{img.size[1]}, {path.stat().st_size // 1024} KB')


layer(src, body_mask, 'body')
layer(head, head_mask, 'head')
layer(src, shadow_mask, 'shadow')
