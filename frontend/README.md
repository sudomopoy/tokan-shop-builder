This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).


##  create api from swagger.json
npx swagger-typescript-api -p https://tokan-backend.darkube.app/swagger/?format=openapi -o ./api -n api.ts

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Theming (storefront)

The storefront supports **theme-based UI** while keeping core logic shared.

- Theme providers live in `themes/<slug>/provider.tsx`.
- Theme CSS lives in `public/themes/<slug>/theme.css` and is loaded per-store via `<link>`.
- Tailwind uses CSS variables (e.g. `--primary-color`) so themes can override tokens without rebuilding Tailwind.
- The active theme slug is resolved in `app/layout.tsx` from store settings (`theme_slug`) and falls back to `default`.

### Create a new theme

1. Copy `themes/default` into `themes/<new-slug>`.
2. Adjust the theme provider (`provider.tsx`) for your UI library (MUI/AntD/none).
3. Add your CSS variables or overrides in `public/themes/<new-slug>/theme.css`.
4. Register the theme in `themes/registry.ts`.

### UI libraries per theme

If a theme needs MUI or AntD, import and wrap them **inside that theme’s provider** only. This keeps bundles small for stores that don’t use that UI library.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
# ropofront
