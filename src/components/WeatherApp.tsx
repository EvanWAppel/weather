"use client";

import { useState } from "react";
import LocationSearch from "./LocationSearch";
import { locationLabel, type Location } from "@/lib/types";

export default function WeatherApp() {
  const [location, setLocation] = useState<Location | null>(null);

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

      <LocationSearch onSelect={setLocation} />

      {location ? (
        <section className="rounded-lg border border-black/[.08] px-4 py-3 dark:border-white/[.12]">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Active location
          </p>
          <p className="text-lg font-medium">{locationLabel(location)}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </p>
        </section>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Search for a city to get started.
        </p>
      )}
    </main>
  );
}
