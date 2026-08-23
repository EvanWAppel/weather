"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  fetchForecast,
  FORECAST_DAYS,
  type DailyForecast,
  type Forecast,
  type TemperatureUnit,
} from "@/lib/forecast";
import { describeWeatherCode } from "@/lib/weatherCodes";
import type { Location } from "@/lib/types";

// Lazy-load the trend charts so uPlot stays out of the initial bundle and the
// day cards are interactive first (NFR-3).
const ForecastCharts = dynamic(() => import("./ForecastCharts"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col gap-4">
      <div className="h-[196px] animate-pulse rounded-lg border border-black/[.08] bg-black/[.03] dark:border-white/[.12] dark:bg-white/[.03]" />
      <div className="h-[216px] animate-pulse rounded-lg border border-black/[.08] bg-black/[.03] dark:border-white/[.12] dark:bg-white/[.03]" />
    </div>
  ),
});

interface ForecastPanelProps {
  location: Location;
  unit: TemperatureUnit;
}

/** "2026-08-22" → "Sat 8/22" (weekday + month/day), matching the WU columns. */
function dayLabel(isoDate: string): string {
  // Parse as local midnight so the weekday doesn't shift across timezones.
  const date = new Date(`${isoDate}T00:00:00`);
  const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
  return `${weekday} ${date.getMonth() + 1}/${date.getDate()}`;
}

function unitSymbol(unit: TemperatureUnit): string {
  return unit === "celsius" ? "°C" : "°F";
}

function formatPrecip(inches: number | null): string {
  if (inches == null || inches === 0) return "0 in";
  return `${inches.toFixed(2)} in`;
}

export default function ForecastPanel({ location, unit }: ForecastPanelProps) {
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { latitude, longitude } = location;

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchForecast(
          { latitude, longitude },
          { unit, signal: controller.signal },
        );
        setForecast(result);
      } catch (err) {
        if (controller.signal.aborted) return;
        // Surface the failure — no silent blank cards (FR-6).
        setError(err instanceof Error ? err.message : "Couldn't load forecast.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [latitude, longitude, unit]);

  if (loading) {
    // Skeleton reserves the loaded layout so there's no shift (low CLS).
    return (
      <section aria-busy="true" aria-label="Loading 10-day forecast">
        <h2 className="mb-3 text-lg font-semibold">10-Day Forecast</h2>
        <ul className="flex gap-2 overflow-x-auto pb-2">
          {Array.from({ length: FORECAST_DAYS }, (_, i) => (
            <li
              key={i}
              className="h-[150px] w-[108px] shrink-0 animate-pulse rounded-lg border border-black/[.08] bg-black/[.03] dark:border-white/[.12] dark:bg-white/[.03]"
            />
          ))}
        </ul>
      </section>
    );
  }

  if (error) {
    return (
      <section
        role="alert"
        className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
      >
        {error}
      </section>
    );
  }

  if (!forecast) return null;

  return (
    <section aria-label="10-day forecast" className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">10-Day Forecast</h2>
      <ul className="flex gap-2 overflow-x-auto pb-2">
        {forecast.days.map((day) => (
          <ForecastDay
            key={day.date}
            day={day}
            label={dayLabel(day.date)}
            unit={unit}
          />
        ))}
      </ul>
      <ForecastCharts hourly={forecast.hourly} unit={unit} />
    </section>
  );
}

function ForecastDay({
  day,
  label,
  unit,
}: {
  day: DailyForecast;
  label: string;
  unit: TemperatureUnit;
}) {
  const { label: condition, icon } = describeWeatherCode(day.weatherCode);
  const symbol = unitSymbol(unit);

  return (
    <li className="flex min-w-[108px] shrink-0 flex-col items-center gap-1 rounded-lg border border-black/[.08] px-3 py-3 text-center dark:border-white/[.12]">
      <span className="text-xs font-medium">{label}</span>
      <span className="text-sm">
        <span className="font-semibold text-red-600 dark:text-red-400">
          {Math.round(day.tempMax)}°
        </span>{" "}
        <span className="text-blue-600 dark:text-blue-400">
          {Math.round(day.tempMin)}
          {symbol}
        </span>
      </span>
      <span className="text-3xl" role="img" aria-label={condition}>
        {icon}
      </span>
      <span className="text-xs text-zinc-600 dark:text-zinc-300">{condition}</span>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">
        💧 {formatPrecip(day.precipitationSum)}
      </span>
    </li>
  );
}
