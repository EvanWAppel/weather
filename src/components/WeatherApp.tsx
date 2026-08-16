"use client";

import { useState } from "react";
import LocationSearch from "./LocationSearch";
import ForecastPanel from "./ForecastPanel";
import UnitToggle from "./UnitToggle";
import { getCurrentLocation } from "@/lib/geolocation";
import { useActiveLocation } from "@/lib/locationStore";
import { useUnit } from "@/lib/unitStore";
import { locationLabel } from "@/lib/types";

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
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Ad-Free Weather
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          10-day forecast and interactive radar — no ads, no trackers.
        </p>
      </header>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <LocationSearch onSelect={setLocation} />
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={locating}
            className="rounded-lg border border-black/[.12] px-4 py-2.5 text-sm font-medium hover:bg-black/[.04] disabled:opacity-60 dark:border-white/[.16] dark:hover:bg-white/[.06]"
          >
            {locating ? "Locating…" : "Use my location"}
          </button>
        </div>
        {geoError && (
          <p className="text-sm text-red-600 dark:text-red-400">{geoError}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg font-medium">{locationLabel(location)}</p>
        <UnitToggle unit={unit} onChange={setUnit} />
      </div>

      <ForecastPanel location={location} unit={unit} />
    </main>
  );
}
