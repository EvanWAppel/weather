# PRD — Ad-Free Weather (codename: *weather*)

**Status:** Draft v0.1 (handoff brief)
**Author:** Evan Appel
**Date:** 2026-08-14
**Audience:** Portfolio visitors; anyone who wants a clean weather lookup.

---

## 1. Problem

weatherunderground.com has the two things people actually come for — a good
**10-day forecast** and an interactive **radar/weather map** — buried under
ads, autoplay video, interstitials, and layout that shifts as you read. The
signal is there; the experience is hostile.

**Core insight:** you don't need to rebuild Weather Underground. You need the
two features that matter, rendered fast, ad-free, on any device.

## 2. Vision

A minimal, ad-free web app that reproduces exactly two Weather Underground
features and nothing else:

1. A **10-day forecast** for a searched or geolocated place.
2. An **interactive radar weather map** with an animated precipitation timeline.

No ads, no tracking, no account, no upsell. Fast first paint, works on a phone.

## 3. Goals & Non-Goals

### Goals (MVP)
- Look up a location (search by name, or use browser geolocation) and see a
  clean **10-day daily forecast**: high/low temp, conditions icon, precip
  probability, and enough detail to plan a week.
- Show an **interactive map** with an animated **radar/precipitation overlay**
  (past frames + near-term forecast frames) and a play/scrub timeline.
- Be genuinely **ad-free and tracker-free**, fast, and mobile-friendly.
- Deploy on Vercel at **weather.evanappel.me**, auto-deploying on push to main.

### Non-Goals (for now)
- Reproducing *any* other Weather Underground feature: hourly tables, historical
  data, Weather Stations / PWS network, severe-weather alerts pages, news,
  webcams, air quality, pollen, "Wundermap" layer soup, etc.
- User accounts, saved locations sync, or notifications.
- Native mobile apps (responsive web only).
- A custom backend/database — the app is a thin client over public weather APIs.
- Monetization of any kind.

## 4. Target Users & Personas

- **The Planner** — wants the week ahead at a glance to decide about travel,
  chores, an outdoor event. Cares about the 10-day view.
- **The Radar-Watcher** — a storm is coming; wants to *see* the precipitation
  band move and estimate when it hits. Cares about the animated map.

## 5. Key Product Decisions (locked)

| Dimension | Decision |
|---|---|
| Scope | **Exactly two features**: 10-day forecast + interactive radar map. Nothing else. |
| Forecast data | **Open-Meteo** (`api.open-meteo.com`) — free, no API key, global, up to 16-day daily. We display 10. |
| Geocoding | **Open-Meteo Geocoding API** (`geocoding-api.open-meteo.com`) for name → lat/lon search. |
| Radar tiles | **RainViewer** public tile API — free, no key; past + nowcast frames with timestamps. |
| Base map | **MapLibre GL** (open source) with free OSM raster tiles. No Mapbox token. |
| Location input | **Search box + browser geolocation.** No saved-locations backend in MVP. |
| Tech stack | **Next.js (App Router, TypeScript, Tailwind)** — matches the rest of the portfolio. |
| Backend | **None of our own.** Client (or Next.js route handlers as thin proxies) calls public APIs directly. |
| Secrets | **None required** — all chosen data sources are keyless. Keep it that way. |
| Host | **Vercel**, auto-deploy on push to main. Domain `weather.evanappel.me`. |
| Units | Support **°F/°C toggle** (imperial default for a US-facing portfolio); persist choice in `localStorage`. |

> These are locked for MVP so development can start without re-litigating them.
> If a decision needs to change, record why in `DECISIONS.md`.

## 6. Functional Requirements

### 6.1 Location selection
- **FR-1** Search a place by name; show a small results list; selecting one sets
  the active location (lat/lon + display name) via Open-Meteo geocoding.
- **FR-2** "Use my location" button requests browser geolocation and sets the
  active location. Degrade gracefully if denied/unavailable.
- **FR-3** Active location persists across reloads (`localStorage`), so the app
  reopens where you left off. A sensible default (e.g. a major city) is shown on
  first visit before any selection.

### 6.2 10-day forecast
- **FR-4** For the active location, fetch and render a **10-day** daily forecast
  from Open-Meteo: day label, weather-condition icon (mapped from WMO weather
  code), high/low temperature, and precipitation probability.
- **FR-5** Temperature unit toggle (°F/°C) updates the whole view and persists.
- **FR-6** Loading and error states are explicit (no silent blank cards). Do not
  swallow API errors — surface a readable message.

### 6.3 Interactive radar map
- **FR-7** Render a MapLibre map centered on the active location.
- **FR-8** Overlay RainViewer radar tiles as an animated layer: fetch the frame
  index, show a **timeline with play/pause and scrub**, and label each frame's
  timestamp (past → nowcast).
- **FR-9** Map and forecast stay in sync with the active location — changing the
  location recenters the map and refetches the forecast.

### 6.4 Non-functional
- **NFR-1** Ad-free and tracker-free. No third-party ad/analytics scripts.
- **NFR-2** Mobile-first responsive; usable one-handed on a phone.
- **NFR-3** Fast first contentful paint; lazy-load the map library so the
  forecast is interactive before the (heavier) map bundle loads.
- **NFR-4** Attribute data sources in the UI footer (Open-Meteo, RainViewer,
  OpenStreetMap) per their terms.

## 7. Out of Scope / Later

Hourly forecast detail, severe-weather alerts, saved multi-location dashboard,
shareable permalinks per location, PWA/offline, additional map layers
(satellite, temperature, wind). Capture these in `TASKS.md` under a "Later"
heading rather than building them now.

## 8. Success Criteria

- A visitor can, in under ~10 seconds and with zero ads: find their location,
  read a clean 10-day forecast, and watch the radar animate over their area.
- Lighthouse: no ad/tracker requests; good mobile performance.
- Deployed and reachable at weather.evanappel.me.
