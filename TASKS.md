# TASKS — weather

Task board for the ad-free weather app. IDs are stable; check items off as they
land. See [PRD.md](./PRD.md) for the what/why. Work top-to-bottom — later tasks
assume earlier ones.

## SETUP

- [x] **SETUP-01** Scaffold Next.js at the repo root: `create-next-app` with App
  Router, TypeScript, Tailwind, ESLint, `src/`, `@/*` alias. Replace boilerplate
  splash with a minimal placeholder. Lint + production build green.
- [x] **SETUP-02** Wire up the manifest commands so `orch dev/test/lint weather`
  work: `npm run dev`, `npm run test`, `npm run lint`. Add a test runner
  (Vitest) and one smoke test so `npm run test` is real.
- [x] **SETUP-03** Add a footer with data-source attribution placeholders
  (Open-Meteo, RainViewer, OpenStreetMap) — satisfies NFR-4 early.

## LOCATION (FR-1..3)

- [x] **LOC-01** Open-Meteo geocoding client + search box: type a place name,
  show results, select to set active location (lat/lon + label).
- [ ] **LOC-02** "Use my location" via `navigator.geolocation`, with graceful
  fallback when denied/unavailable.
- [ ] **LOC-03** Persist active location + a first-visit default in
  `localStorage`; rehydrate on load.

## FORECAST (FR-4..6)

- [ ] **FC-01** Open-Meteo forecast client: request 10 daily days
  (`forecast_days=10`) with temp max/min, precipitation probability, weather
  code. Typed response, explicit error surfacing (no swallowing).
- [ ] **FC-02** WMO weather-code → icon + label mapping.
- [ ] **FC-03** 10-day forecast UI: one card/row per day (day label, icon,
  high/low, precip %). Responsive.
- [ ] **FC-04** °F/°C unit toggle that updates the view and persists to
  `localStorage`.
- [ ] **FC-05** Loading + error states for the forecast panel.

## RADAR MAP (FR-7..9)

- [ ] **MAP-01** Add MapLibre GL; render a map centered on the active location
  with free OSM raster tiles. Lazy-load the map bundle (NFR-3).
- [ ] **MAP-02** RainViewer frame-index client (past + nowcast frames with
  timestamps).
- [ ] **MAP-03** Radar tile overlay layer driven by the selected frame.
- [ ] **MAP-04** Timeline control: play/pause + scrub, with per-frame timestamp
  labels.
- [ ] **MAP-05** Keep map + forecast in sync with the active location (recenter +
  refetch on change).

## SHIP

- [ ] **SHIP-01** Verify ad-free/tracker-free: no third-party ad/analytics
  requests in the network tab (NFR-1). Basic Lighthouse mobile pass.
- [ ] **SHIP-02** Connect the GitHub repo to Vercel; confirm auto-deploy on push
  to main; attach `weather.evanappel.me`.
- [ ] **SHIP-03** Flip `status = "wip"` (then `"live"`) in the portfolio
  `projects.toml` and add the row to the portfolio README table.

## Later (out of MVP scope — see PRD §7)

- [ ] Hourly forecast detail.
- [ ] Severe-weather alerts.
- [ ] Multi-location saved dashboard + shareable per-location permalinks.
- [ ] Extra map layers (satellite, temperature, wind); PWA/offline.
