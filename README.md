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

## Character and scene

The character is a hand-drawn SVG in the style of *Total Drama Island* (`src/components/Character.tsx`). Its eyes follow the cursor, it breathes, blinks, waves, shrugs, laughs and looks around, jumps when clicked, and it zooms and blurs behind the text as you scroll. Colours are constants at the top of the file.

Behind it is an animated cartoon Bali beach (`src/components/Backdrop.tsx`) with props from Shreyas's story: a SeaLens surfboard, jumping fish, a camera on a tripod, a football and a Melbourne / Bali / Jakarta signpost. A grain overlay sits on top of everything.

## Deployment

Pushing to `main` deploys to https://shreyasvenadan.github.io/portfolio/ via `.github/workflows/deploy.yml`.
In the repo settings, set **Pages → Source** to **GitHub Actions**.
