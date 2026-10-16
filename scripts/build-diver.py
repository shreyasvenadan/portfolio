"""Cut the diver render into layers so Sealife.tsx can make him kick.

    python3 -m pip install pillow numpy opencv-python-headless "rembg[cpu]"
    python3 scripts/build-diver.py DIVER

DIVER is the 1254x1254 render of a diver swimming right, on a plain
background. Writes public/sealife/diver-{body,leg-far,leg-near}.webp, all the
same size so they stack exactly. Each leg pivots at its hip (HIPS, in the
output's pixels, which Sealife.tsx uses too); the body keeps a stub of both
thighs, drawn over the legs, to hide the joint as they swing.
"""

import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from rembg import new_session, remove

OUT = Path(__file__).resolve().parent.parent / 'public' / 'sealife'
OUT.mkdir(parents=True, exist_ok=True)

# All in the source render's pixels.
CANVAS = (20, 300, 1235, 950)  # the diver plus room for the fins to swing
WIDTH = 600  # output width
# The legs are everything left of LEGS_END, and the body everything right of
# BODY_START, fading in over BODY_FEATHER px so the swinging thighs blend into
# its stub of them instead of showing a step.
LEGS_END = 500
BODY_START = 420
BODY_FEATHER = 50
# The seam between the legs (far leg above, near leg below) runs roughly along
# SEAM_GUIDE, from the fin tips to the hip; it's traced within SEAM_SLACK rows
# of it, through the gap between the fins, then the crease between the thighs.
SEAM_GUIDE = [(0, 515), (250, 565), (350, 592), (450, 607), (500, 612)]
SEAM_SLACK = 16
SEAM_BAND = (480, 660)

src = Image.open(sys.argv[1]).convert('RGB')
cut = np.array(remove(src, session=new_session('isnet-general-use')))

# Keep only the diver: drop the bubbles painted beside his head (the page draws
# its own) and any specks.
solid = (cut[..., 3] > 20).astype(np.uint8)
n, labels, stats, _ = cv2.connectedComponentsWithStats(solid)
diver = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
cut[..., 3] = cut[..., 3] * cv2.dilate((labels == diver).astype(np.uint8), np.ones((5, 5), np.uint8))

# Trace the seam left to right as the cheapest path through the band, moving
# at most one row per column: see-through and dark pixels are cheap.
y0, y1 = SEAM_BAND
band = cut[y0:y1, :LEGS_END].astype(float)
cost = band[..., 3] / 255 * (0.25 + band[..., :3].mean(-1) / 255)
guide = np.interp(np.arange(LEGS_END), [p[0] for p in SEAM_GUIDE], [p[1] for p in SEAM_GUIDE])
cost[np.abs(np.arange(y0, y1)[:, None] - guide[None, :]) > SEAM_SLACK] = 1e6
total = cost.copy()
step = np.zeros(cost.shape, int)
for x in range(1, LEGS_END):
    prev = total[:, x - 1]
    options = np.stack([np.roll(prev, 1), prev, np.roll(prev, -1)])
    options[0, 0] = options[2, -1] = np.inf
    step[:, x] = options.argmin(0) - 1
    total[:, x] += options.min(0)
seam = np.zeros(LEGS_END, int)
seam[-1] = total[:, -1].argmin()
for x in range(LEGS_END - 1, 0, -1):
    seam[x - 1] = seam[x] + step[seam[x], x]
seam += y0

ys, xs = np.mgrid[0 : cut.shape[0], 0 : cut.shape[1]]
below = ys >= np.concatenate([seam, np.full(cut.shape[1] - LEGS_END, seam[-1])])[None, :]
masks = {
    'body': np.clip((xs - BODY_START) / BODY_FEATHER, 0, 1),
    'leg-far': (xs < LEGS_END) & ~below,
    'leg-near': (xs < LEGS_END) & below,
}

scale = WIDTH / (CANVAS[2] - CANVAS[0])
size = (WIDTH, round((CANVAS[3] - CANVAS[1]) * scale))
for name, mask in masks.items():
    layer = cut.copy()
    layer[..., 3] = (layer[..., 3] * mask).astype(np.uint8)
    img = Image.fromarray(layer, 'RGBA').crop(CANVAS).resize(size, Image.LANCZOS)
    path = OUT / f'diver-{name}.webp'
    img.save(path, quality=88, method=6)
    print(f'{path.name}: {size[0]}x{size[1]}, {path.stat().st_size // 1024} KB')
print(f'scale {scale:.4f}: a source point (x, y) is ((x - {CANVAS[0]}) * scale, (y - {CANVAS[1]}) * scale)')
