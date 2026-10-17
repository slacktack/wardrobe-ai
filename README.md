# Wardrobe AI

Drop an outfit photo. It breaks the fit into pieces, detects men's or women's wear, and auto-picks the best-matching product for each piece from Indian stores.

## Stack

Next.js 16, React 19, Tailwind 4, Motion. Vision and search run server-side in `src/app/api/*`.

## Develop

```bash
npm install
npm run dev
npm run lint && npx tsc --noEmit && npm run build
```

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `HATKE_API_TOKEN` | optional | Bearer token for the vision endpoint, if it requires one |

## Deploy

`vercel.json` sets the region and function timeouts. Import the repo in Vercel and deploy; no build settings needed.
