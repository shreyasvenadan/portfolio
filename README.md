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

## Deployment

Pushing to `main` deploys to https://shreyasvenadan.github.io/portfolio/ via `.github/workflows/deploy.yml`.
In the repo settings, set **Pages → Source** to **GitHub Actions**.
