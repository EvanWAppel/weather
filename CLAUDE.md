# CLAUDE.md — weather

Guidance for AI assistants working in this repo. Read [PRD.md](./PRD.md) and
[TASKS.md](./TASKS.md) first; they are the source of truth for scope.

## What this is

An **ad-free** reproduction of **exactly two** Weather Underground features:
the **10-day forecast** and the **interactive radar weather map**. Nothing else.
When tempted to add a feature, check PRD §3 Non-Goals first — the answer is
almost certainly "no, that's out of scope."

## Stack & conventions

- **Next.js** (App Router) + **TypeScript** + **Tailwind**, app at the repo root.
- Package manager: **npm** (matches the portfolio manifest for this project).
- Scripts: `npm run dev`, `npm run test`, `npm run lint` — keep these working;
  the portfolio `orch` CLI drives the project through them.
- Deploy: **Vercel**, auto-deploy on push to `main`. Do **not** push to `main`
  directly for feature work — branch, open a PR.

## Data sources (all keyless — keep it that way)

- **Forecast:** Open-Meteo — `https://api.open-meteo.com/v1/forecast`
- **Geocoding:** Open-Meteo — `https://geocoding-api.open-meteo.com/v1/search`
- **Radar tiles + frame index:** RainViewer — `https://api.rainviewer.com/`
- **Base map:** MapLibre GL + OpenStreetMap raster tiles.

No API keys or secrets should be required. If you think you need one, stop and
ask — it likely means the wrong provider is being reached for.

## Rules

- Don't do anything you're unclear about — ask.
- **Do not hide or wrap errors.** Surface API failures with readable messages
  (see FR-6); no silent blank states.
- Ad-free and tracker-free is a hard requirement (NFR-1): no third-party
  ad/analytics scripts, ever.
- Attribute data sources in the UI footer (NFR-4).
- Record any change to a locked PRD decision in `DECISIONS.md` with the reason.
