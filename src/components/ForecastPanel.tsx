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
import { describeWeatherCode, weatherSky, type Sky } from "@/lib/weatherCodes";
import WeatherIcon from "./WeatherIcon";
import type { Location } from "@/lib/types";

// Lazy-load the trend charts so uPlot stays out of the initial bundle and the
// day cards are interactive first (NFR-3).
const ForecastCharts = dynamic(() => import("./ForecastCharts"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col gap-4">
      <div className="skeleton h-[196px]" />
      <div className="skeleton h-[216px]" />
    </div>
  ),
});

interface ForecastPanelProps {
  location: Location;
  unit: TemperatureUnit;
  /** Report the present-conditions sky category up so the backdrop can react. */
  onSky?: (sky: Sky) => void;
}

/** "2026-08-22" → "Sat 8/22" (weekday + month/day). */
function dayLabel(isoDate: string): string {
  // Parse as local midnight so the weekday doesn't shift across timezones.
  const date = new Date(`${isoDate}T00:00:00`);
  const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
  return `${weekday} ${date.getMonth() + 1}/${date.getDate()}`;
}

function unitSymbol(unit: TemperatureUnit): string {
  return unit === "celsius" ? "°C" : "°F";
}

function windUnit(unit: TemperatureUnit): string {
  return unit === "celsius" ? "km/h" : "mph";
}

export default function ForecastPanel({
  location,
  unit,
  onSky,
}: ForecastPanelProps) {
  const [selected, setSelected] = useState(0);
  const [retry, setRetry] = useState(0);
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
        setSelected(0);
      } catch (err) {
        if (controller.signal.aborted) return;
        // Surface the failure — no silent blank cards (FR-6).
        setError(err instanceof Error ? err.message : "Couldn't load forecast.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [latitude, longitude, unit, retry]);

  // Drive the sky-reactive backdrop from present conditions (falling back to
  // today's summary, assuming daytime, when there's no `current` block).
  useEffect(() => {
    if (!forecast) return;
    const code = forecast.current?.weatherCode ?? forecast.days[0]?.weatherCode;
    if (code == null) return;
    onSky?.(weatherSky(code, forecast.current?.isDay ?? true));
  }, [forecast, onSky]);

  const symbol = unitSymbol(unit);
  const current = forecast?.current ?? null;
  const today = forecast?.days[0];
  const heroCode = current?.weatherCode ?? today?.weatherCode ?? 0;
  const heroTemp = current
    ? Math.round(current.temperature)
    : today
      ? Math.round(today.tempMax)
      : null;

  return (
    <>
      <section className="hero glass" aria-label="Current conditions" aria-busy={loading}>
        <div className="hero-place">
          <h1>{location.name}</h1>
          <p>
            {[location.admin1, location.country].filter(Boolean).join(", ") ||
              "Your selected location"}
          </p>
          <p className="coords">
            {Math.abs(latitude).toFixed(2)}° {latitude >= 0 ? "N" : "S"} ·{" "}
            {Math.abs(longitude).toFixed(2)}° {longitude >= 0 ? "E" : "W"}
          </p>
        </div>

        <div className="hero-now">
          <div className="hero-temp">
            {error || heroTemp == null ? "—" : heroTemp}
            <span>°</span>
          </div>
          <div className="hero-cond">
            <WeatherIcon code={heroCode} />
            <p className="cond-label">
              {error ? "Unavailable" : describeWeatherCode(heroCode).label}
            </p>
            {!error && today && (
              <p className="cond-sub">
                {current ? `Feels ${Math.round(current.feelsLike)}° · ` : ""}
                H {Math.round(today.tempMax)}° · L {Math.round(today.tempMin)}°
              </p>
            )}
          </div>
        </div>

        <ul className="hero-stats">
          <li>
            <span>Humidity</span>
            <strong>{current ? `${Math.round(current.humidity)}%` : "—"}</strong>
          </li>
          <li>
            <span>Wind</span>
            <strong>
              {current
                ? `${Math.round(current.windSpeed)} ${windUnit(unit)}`
                : "—"}
            </strong>
          </li>
          <li>
            <span>Rain today</span>
            <strong>
              {today?.precipitationProbabilityMax == null
                ? "—"
                : `${today.precipitationProbabilityMax}%`}
            </strong>
          </li>
        </ul>
      </section>

      {error ? (
        <section role="alert" className="banner-error">
          {error}
          <button onClick={() => setRetry((n) => n + 1)}>Try again ↗</button>
        </section>
      ) : loading ? (
        <section aria-busy="true" aria-label="Loading 10-day forecast">
          <div className="section-head">
            <h2>10-day forecast</h2>
            <span className="eyebrow">Gathering the week ahead…</span>
          </div>
          <div className="days-skeleton">
            {Array.from({ length: FORECAST_DAYS }, (_, i) => (
              <div className="skeleton" key={i} />
            ))}
          </div>
        </section>
      ) : (
        forecast && (
          <>
            <section aria-label="10-day forecast">
              <div className="section-head">
                <h2>10-day forecast</h2>
                <span className="eyebrow">Tap a day for detail</span>
              </div>
              <ul className="days">
                {forecast.days.map((item, index) => (
                  <ForecastDay
                    key={item.date}
                    day={item}
                    label={dayLabel(item.date)}
                    unit={unit}
                    active={selected === index}
                    onSelect={() => setSelected(index)}
                    first={index === 0}
                  />
                ))}
              </ul>
              {forecast.days[selected] && (
                <p className="day-detail">
                  <strong>
                    {selected === 0
                      ? "Today"
                      : dayLabel(forecast.days[selected].date)}
                  </strong>
                  <span>{describeWeatherCode(forecast.days[selected].weatherCode).label}</span>
                  <span>
                    High {Math.round(forecast.days[selected].tempMax)}
                    {symbol} · Low {Math.round(forecast.days[selected].tempMin)}
                    {symbol}
                  </span>
                  <span>
                    Precip{" "}
                    {forecast.days[selected].precipitationProbabilityMax == null
                      ? "—"
                      : `${forecast.days[selected].precipitationProbabilityMax}%`}
                  </span>
                </p>
              )}
            </section>

            <section aria-label="Forecast trends">
              <div className="section-head">
                <h2>Trends</h2>
                <span className="eyebrow">Hourly, across the 10 days</span>
              </div>
              <ForecastCharts hourly={forecast.hourly} unit={unit} />
            </section>
          </>
        )
      )}
    </>
  );
}

function ForecastDay({
  day,
  label,
  unit,
  active,
  onSelect,
  first,
}: {
  day: DailyForecast;
  label: string;
  unit: TemperatureUnit;
  active: boolean;
  onSelect: () => void;
  first: boolean;
}) {
  const condition = describeWeatherCode(day.weatherCode).label;
  return (
    <li className={active ? "day selected" : "day"}>
      <button
        onClick={onSelect}
        aria-pressed={active}
        aria-label={`${label}: ${condition}, high ${Math.round(day.tempMax)}${unitSymbol(unit)}, low ${Math.round(day.tempMin)}${unitSymbol(unit)}`}
      >
        <span className="day-name">
          {first ? "Today" : label.split(" ")[0]}
          <span className="day-date">{label.split(" ")[1]}</span>
        </span>
        <WeatherIcon code={day.weatherCode} />
        <span className="day-temps">
          <strong>{Math.round(day.tempMax)}°</strong>
          <span>{Math.round(day.tempMin)}°</span>
        </span>
        <span className="day-cond">{condition}</span>
        <span className="day-rain">
          <svg
            viewBox="0 0 16 16"
            width="11"
            height="11"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
          >
            <path d="M8 2S3.5 7 3.5 10a4.5 4.5 0 0 0 9 0C12.5 7 8 2 8 2Z" />
          </svg>{" "}
          {day.precipitationProbabilityMax == null
            ? "—"
            : `${day.precipitationProbabilityMax}%`}
        </span>
      </button>
    </li>
  );
}
