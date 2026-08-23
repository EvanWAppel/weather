# DECISIONS — weather

Record here any change to a locked PRD decision, with the reason (per CLAUDE.md).

## 2026-08-22 — Add hourly trend charts to the 10-day forecast

**Decision:** The 10-day forecast now includes two trend charts under the day
cards, matching Weather Underground's 10-day view:

1. **Temperature / Dew Point / Feels Like** (hourly, over the 10-day window).
2. **Cloud Cover / Chance of Precip / Chance of Snow / Humidity / Pressure**
   (hourly; pressure on a second axis in inHg).

**Why:** Requested feature change — the forecast should look like WU's 10-day
tab (screenshot), which carries these charts.

**PRD tension resolved:** The charts consume **hourly** data, and §3 lists
"hourly tables" as a non-goal and §7 lists "Hourly forecast detail" under Later.
The distinction we're keeping: hourly data rendered as **trend charts inside the
10-day forecast is in scope**; a standalone **hourly table / HOURLY tab remains
out of scope**. FR-4 and §3 updated to say so.

**Data:** All fields come from the existing keyless Open-Meteo `/v1/forecast`
call, now also requesting `hourly=temperature_2m,dew_point_2m,
apparent_temperature,cloud_cover,precipitation_probability,relative_humidity_2m,
pressure_msl,snowfall`. No new provider, no key.

**Notes / approximations:**
- Open-Meteo has **no snow-probability field**; "Chance of Snow" is derived —
  the precip probability on hours where snowfall is expected, else 0.
- Pressure uses `pressure_msl` (sea-level) converted hPa → inHg, to match WU's
  ~29.6–29.9 inHg range rather than station pressure.

**Implementation:** Charts render with **uPlot**, lazy-loaded (dynamic import,
`ssr:false`) so it stays out of the initial bundle (NFR-3).
