# weather

An **ad-free** reproduction of the only two Weather Underground features worth
keeping: a clean **10-day forecast** and an **interactive radar weather map**.
No ads, no trackers, no account. Part of [Evan Appel's portfolio](https://evanappel.me).

- **Live:** https://weather.evanappel.me _(after first deploy)_
- **Spec:** [PRD.md](./PRD.md)
- **Task board:** [TASKS.md](./TASKS.md)

## Stack

- Next.js (App Router) + TypeScript + Tailwind, deployed on Vercel.
- Data: [Open-Meteo](https://open-meteo.com/) (forecast + geocoding),
  [RainViewer](https://www.rainviewer.com/api.html) (radar tiles),
  [MapLibre GL](https://maplibre.org/) + OpenStreetMap (base map).
- All data sources are **keyless** — no secrets to configure.

## Develop

```sh
npm install
npm run dev      # dev server
npm run test     # tests
npm run lint     # lint / typecheck
```

## Status

Scaffold — see [TASKS.md](./TASKS.md) for the build order (start at `SETUP-01`).

## Attribution

Weather data by Open-Meteo. Radar imagery by RainViewer. Map data ©
OpenStreetMap contributors.
