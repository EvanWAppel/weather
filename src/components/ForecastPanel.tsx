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
import WeatherIcon from "./WeatherIcon";
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
  if (inches == null) return "—";
  if (inches === 0) return "0 in";
  return `${inches.toFixed(2)} in`;
}

export default function ForecastPanel({ location, unit }: ForecastPanelProps) {
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

  const day = forecast?.days[selected];
  const condition = day ? describeWeatherCode(day.weatherCode).label : "Reading the sky…";
  const symbol = unitSymbol(unit);

  return (
    <>
      <section className="outlook" aria-label="Daily outlook" aria-busy={loading}>
        <div className="outlook-copy">
          <p className="eyebrow"><span className="status-dot" /> {selected === 0 ? "TODAY’S OUTLOOK" : "YOUR DAILY OUTLOOK"} <span className="outlook-date">{!loading && day ? new Date(`${day.date}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }).toUpperCase() : "FORECAST / 10 DAYS"}</span></p>
          <h2 className="city-name">{location.name}<span>.</span></h2>
          <p className="location-detail">{[location.admin1, location.country].filter(Boolean).join(", ") || "Your selected location"}<span>{Math.abs(latitude).toFixed(2)}° {latitude >= 0 ? "N" : "S"} / {Math.abs(longitude).toFixed(2)}° {longitude >= 0 ? "E" : "W"}</span></p>
          <div className="temperature-line"><span className="hero-temperature">{!loading && !error && day ? Math.round(day.tempMax) : "—"}<sup>°</sup></span><div className="hero-condition"><p>{error ? "Outlook unavailable" : condition}</p><span>DAYTIME HIGH · {symbol}</span>{!loading && !error && day && <p className="low-temperature">↓ {Math.round(day.tempMin)}° overnight</p>}</div></div>
          <div className="outlook-bottom"><span>{!loading && day && !error ? `Precipitation ${day.precipitationProbabilityMax == null ? "—" : `${day.precipitationProbabilityMax}%`} · ${formatPrecip(day.precipitationSum)}` : "A fresh perspective, whatever’s ahead."}</span><a href="#forecast">Explore the forecast ↘</a></div>
        </div>
        <div className="sky-art" aria-hidden="true"><span className="art-label">THE SKY, SIMPLIFIED.</span><div className={`sun-disc ${day && day.weatherCode > 2 ? "sun-muted" : ""}`} /><div className="art-orbit" /><span className="art-cross">+</span><span className="art-caption">A daily observation<br />of an ever-changing world.</span><span className="art-index">01 — 10</span></div>
      </section>
      {error ? <section role="alert" className="error-message">{error}<button onClick={() => setRetry((n) => n + 1)}>Try again ↗</button></section> : loading ? <section aria-busy="true" aria-label="Loading 10-day forecast" className="forecast-loading"><p className="eyebrow">GATHERING YOUR 10-DAY FORECAST</p><div className="loading-grid">{Array.from({ length: FORECAST_DAYS }, (_, i) => <div className="loading-day" key={i} />)}</div></section> : forecast && (
        <>
          <section id="forecast" aria-label="10-day forecast" className="forecast-section">
            <div className="section-heading"><h2><span className="section-number">01 /</span> 10-Day Forecast</h2><span className="eyebrow">A LOOK AHEAD <span className="desktop-hint">· SELECT A DAY TO EXPLORE</span></span></div>
            <ul className="day-grid">{forecast.days.map((item, index) => <ForecastDay key={item.date} day={item} label={dayLabel(item.date)} unit={unit} active={selected === index} onSelect={() => setSelected(index)} first={index === 0} />)}</ul>
            <div className="forecast-footnote"><span>Daily highs & lows in {symbol}</span><span>Good days start with a little perspective.</span></div>
          </section>
          <section className="trends-section" aria-label="Forecast trends"><div className="section-heading"><h2><span className="section-number">02 /</span> Between the lines</h2><span className="eyebrow">THE NEXT 10 DAYS, IN DETAIL</span></div><ForecastCharts hourly={forecast.hourly} unit={unit} /></section>
        </>
      )}
    </>
  );
}

function ForecastDay({ day, label, unit, active, onSelect, first }: { day: DailyForecast; label: string; unit: TemperatureUnit; active: boolean; onSelect: () => void; first: boolean }) {
  const condition = describeWeatherCode(day.weatherCode).label;
  return (
    <li className={active ? "day-card selected" : "day-card"}>
      <button onClick={onSelect} aria-pressed={active} aria-label={`${label}: ${condition}, high ${Math.round(day.tempMax)}${unitSymbol(unit)}, low ${Math.round(day.tempMin)}${unitSymbol(unit)}`}>
        <span className="day-name">{first ? "Today" : label.split(" ")[0]}<span className="day-date">{label.split(" ")[1]}</span></span>
        <WeatherIcon code={day.weatherCode} />
        <span className="day-temperatures"><strong>{Math.round(day.tempMax)}°</strong><span>{Math.round(day.tempMin)}°</span></span>
        <span className="day-condition">{condition}</span>
        <span className="day-rain"><svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true" fill="none" stroke="currentColor"><path d="M8 2S3.5 7 3.5 10a4.5 4.5 0 0 0 9 0C12.5 7 8 2 8 2Z" /></svg> {day.precipitationProbabilityMax == null ? "—" : `${day.precipitationProbabilityMax}%`}</span>
      </button>
    </li>
  );
}
