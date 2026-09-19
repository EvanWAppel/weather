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


// Lazy-load the map so the forecast is interactive before the heavier
// MapLibre bundle loads (NFR-3).
const RadarMap = dynamic(() => import("./RadarMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] w-full animate-pulse rounded-lg border border-black/[.08] bg-black/[.03] dark:border-white/[.12] dark:bg-white/[.03]" />
  ),
});

export default function WeatherApp() {
  const [location, setLocation] = useActiveLocation();
  const [unit, setUnit] = useUnit();
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

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
    <main className="weather-shell" id="top">
      <header className="masthead">
        <a href="#top" className="wordmark" aria-label="Ad-Free Weather home"><span className="brand-sun" aria-hidden="true">✳</span> atmosphere<span className="brand-period">.</span></a>
        <p className="masthead-note">A little clarity.<br />Whatever the weather.</p>
        <span className="independent-label"><span className="status-dot" /> ALWAYS AD-FREE</span>
      </header>
      <div className="edition-line"><h1>Ad-Free Weather</h1><span>YOUR DAILY PERSPECTIVE ON THE SKY</span><span>EST. 2026 ↗</span></div>
      <div className="location-toolbar">
        <div className="search-wrap"><span aria-hidden="true" className="search-symbol">⌕</span><LocationSearch onSelect={setLocation} /></div>
        <button type="button" onClick={handleUseMyLocation} disabled={locating} className="location-button"><span aria-hidden="true">⌖</span> {locating ? "Locating…" : "Use my location"}</button>
        <UnitToggle unit={unit} onChange={setUnit} />
      </div>
      {geoError && <p role="alert" className="error-message">{geoError}</p>}
      <ForecastPanel location={location} unit={unit} />
      <section id="radar" aria-label="Radar map" className="radar-section">
        <div className="section-heading"><h2><span className="section-number">03 /</span> The bigger picture</h2><span className="eyebrow">INTERACTIVE PRECIPITATION RADAR</span></div>
        <div className="radar-caption"><p>Weather moves. See where it’s headed.</p><span>Pan, zoom & explore ↗</span></div>
        <DeferUntilVisible minHeight={480}><RadarMap location={location} /></DeferUntilVisible>
      </section>
      <div className="closing-note"><span className="brand-sun" aria-hidden="true">✳</span><p>Less noise. <span>More sky.</span></p><a href="#top">BACK TO TOP ↑</a></div>
    </main>
  );
}
