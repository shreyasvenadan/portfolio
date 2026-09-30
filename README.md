# portfolio

My personal portfolio, built with React, TypeScript, Vite, and Tailwind CSS.

## Development

```sh
npm install
npm run dev      # start local dev server
npm run build    # type-check and build to dist/
npm run preview  # serve the production build locally
```

## Editing content

All text, projects, and experience live in [`src/data/content.ts`](src/data/content.ts).
Put a résumé at `public/resume.pdf`.

## 3D avatar

The background is a React Three Fiber scene (`src/scene/`). Until an avatar file exists it shows a simple stand-in figure.

To use your own avatar, export it from [Avaturn](https://avaturn.me) as **GLB** (include ARKit blendshapes if offered, which enables blinking), then run:

```sh
npm run avatar -- ~/Downloads/your-avaturn-export.glb
```

This compresses the model and saves it to `public/models/avatar.glb`, which the site loads automatically. The avatar's arms are lowered from the T-pose, its head follows the cursor, and it floats gently. If the GLB contains an animation (e.g. an idle from Mixamo), that plays instead.

## Deployment

Pushing to `main` deploys to https://shreyasvenadan.github.io/portfolio/ via `.github/workflows/deploy.yml`.
In the repo settings, set **Pages → Source** to **GitHub Actions**.
