"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import LocationSearch from "./LocationSearch";
import ForecastPanel from "./ForecastPanel";
import UnitToggle from "./UnitToggle";
import DeferUntilVisible from "./DeferUntilVisible";
import { getCurrentLocation } from "@/lib/geolocation";
import { useActiveLocation } from "@/lib/locationStore";
import { useUnit } from "@/lib/unitStore";
import { type Sky } from "@/lib/weatherCodes";

// Lazy-load the map so the forecast is interactive before the heavier
// MapLibre bundle loads (NFR-3).
const RadarMap = dynamic(() => import("./RadarMap"), {
  ssr: false,
  loading: () => <div className="skeleton h-[420px] w-full" />,
});

export default function WeatherApp() {
  const [location, setLocation] = useActiveLocation();
  const [unit, setUnit] = useUnit();
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  // Present-conditions category driving the sky-reactive backdrop. Defaults to
  // a neutral gradient until the first forecast loads.
  const [sky, setSky] = useState<Sky | null>(null);

  async function handleUseMyLocation() {
    setLocating(true);
    setGeoError(null);
    try {
      setLocation(await getCurrentLocation());
    } catch (err) {
      // Degrade gracefully — surface the reason, keep the app usable (FR-2).
      setGeoError(err instanceof Error ? err.message : "Couldn't locate you.");
    } finally {
      setLocating(false);
    }
  }

  return (
    <>
      <div className="sky-layer" data-sky={sky ?? undefined} aria-hidden="true" />
      <main className="shell" id="top">
        <header className="topbar">
          <a href="#top" className="brand" aria-label="atmosphere home">
            <span className="brand-mark" aria-hidden="true">☀</span> atmosphere
          </a>
          <div className="controls">
            <div className="search-wrap">
              <span aria-hidden="true" className="search-icon">⌕</span>
              <LocationSearch onSelect={setLocation} />
            </div>
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={locating}
              className="ghost-btn"
            >
              <span aria-hidden="true">◎</span>{" "}
              {locating ? "Locating…" : "Use my location"}
            </button>
            <UnitToggle unit={unit} onChange={setUnit} />
          </div>
        </header>

        {geoError && (
          <p role="alert" className="banner-error">
            {geoError}
          </p>
        )}

        <ForecastPanel location={location} unit={unit} onSky={setSky} />

        <section className="radar-section" aria-label="Radar map">
          <div className="section-head">
            <h2>Live radar</h2>
            <span className="eyebrow">Precipitation · past &amp; near-term</span>
          </div>
          <div className="glass radar-card">
            <DeferUntilVisible minHeight={480}>
              <RadarMap location={location} />
            </DeferUntilVisible>
          </div>
        </section>
      </main>
    </>
  );
}
