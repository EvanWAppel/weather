"use client";

import { useMemo } from "react";
import type { AlignedData, Options } from "uplot";
import type { HourlyForecast, TemperatureUnit } from "@/lib/forecast";
import UPlotChart from "./UPlotChart";

interface ForecastChartsProps {
  hourly: HourlyForecast;
  unit: TemperatureUnit;
}

// WU-inspired series colors.
const COLORS = {
  temperature: "#d81e05",
  dewPoint: "#2e8b57",
  feelsLike: "#9c27b0",
  cloudCover: "#9e9e9e",
  precip: "#29b6f6",
  snow: "#ec407a",
  humidity: "#8bc34a",
  pressure: "#111827",
  grid: "#00000012",
  axis: "#6b7280",
};

/** "2026-08-22T00:00" → "Sat 8/22" for day-boundary ticks. */
function formatDayTick(iso: string): string {
  const [datePart] = iso.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
  return `${weekday} ${m}/${d}`;
}

/** Indices in `time` that fall on local midnight — one tick per day column. */
function midnightIndices(time: string[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < time.length; i++) {
    if (time[i].endsWith("T00:00")) out.push(i);
  }
  return out;
}

function baseAxes(time: string[], dayTicks: number[]): Options["axes"] {
  return [
    {
      scale: "x",
      stroke: COLORS.axis,
      grid: { stroke: COLORS.grid, width: 1 },
      ticks: { stroke: COLORS.grid, width: 1 },
      splits: () => dayTicks,
      values: (_u, splits) => splits.map((i) => formatDayTick(time[i] ?? "")),
      font: "11px system-ui, sans-serif",
    },
  ];
}

const CURSOR = { points: { size: 5 } } as const;

export default function ForecastCharts({ hourly, unit }: ForecastChartsProps) {
  const symbol = unit === "celsius" ? "°C" : "°F";

  const xs = useMemo(
    () => hourly.time.map((_, i) => i),
    [hourly.time],
  );
  const dayTicks = useMemo(() => midnightIndices(hourly.time), [hourly.time]);

  // Chart 1 — Temperature, Dew Point, Feels Like (single temperature scale).
  const tempOptions = useMemo<Omit<Options, "width">>(
    () => ({
      height: 180,
      cursor: CURSOR,
      legend: { show: true },
      scales: { x: { time: false } },
      axes: [
        ...baseAxes(hourly.time, dayTicks)!,
        {
          scale: "temp",
          stroke: COLORS.axis,
          grid: { stroke: COLORS.grid, width: 1 },
          values: (_u, splits) => splits.map((v) => `${v}${symbol}`),
          font: "11px system-ui, sans-serif",
        },
      ],
      series: [
        {},
        { label: `Temp (${symbol})`, scale: "temp", stroke: COLORS.temperature, width: 1.5, points: { show: false } },
        { label: `Dew Pt (${symbol})`, scale: "temp", stroke: COLORS.dewPoint, width: 1.25, points: { show: false } },
        { label: `Feels (${symbol})`, scale: "temp", stroke: COLORS.feelsLike, width: 1.25, points: { show: false } },
      ],
    }),
    [hourly.time, dayTicks, symbol],
  );

  const tempData = useMemo<AlignedData>(
    () => [xs, hourly.temperature, hourly.dewPoint, hourly.feelsLike],
    [xs, hourly.temperature, hourly.dewPoint, hourly.feelsLike],
  );

  // Chart 2 — percent series on the left axis, pressure (inHg) on the right.
  const condOptions = useMemo<Omit<Options, "width">>(
    () => ({
      height: 200,
      cursor: CURSOR,
      legend: { show: true },
      scales: {
        x: { time: false },
        pct: { range: [0, 100] },
        inHg: {},
      },
      axes: [
        ...baseAxes(hourly.time, dayTicks)!,
        {
          scale: "pct",
          stroke: COLORS.axis,
          grid: { stroke: COLORS.grid, width: 1 },
          values: (_u, splits) => splits.map((v) => `${v}%`),
          font: "11px system-ui, sans-serif",
        },
        {
          scale: "inHg",
          side: 1,
          stroke: COLORS.axis,
          grid: { show: false },
          values: (_u, splits) => splits.map((v) => v.toFixed(2)),
          font: "11px system-ui, sans-serif",
        },
      ],
      series: [
        {},
        {
          label: "Cloud (%)",
          scale: "pct",
          stroke: COLORS.cloudCover,
          fill: "rgba(158,158,158,0.35)",
          width: 1,
          points: { show: false },
        },
        { label: "Precip (%)", scale: "pct", stroke: COLORS.precip, width: 1.25, points: { show: false } },
        { label: "Snow (%)", scale: "pct", stroke: COLORS.snow, width: 1.25, points: { show: false } },
        { label: "Humidity (%)", scale: "pct", stroke: COLORS.humidity, width: 1.25, points: { show: false } },
        { label: "Pressure (in)", scale: "inHg", stroke: COLORS.pressure, width: 1.25, points: { show: false } },
      ],
    }),
    [hourly.time, dayTicks],
  );

  const condData = useMemo<AlignedData>(
    () => [
      xs,
      hourly.cloudCover,
      hourly.precipProbability,
      hourly.chanceOfSnow,
      hourly.humidity,
      hourly.pressureInHg,
    ],
    [
      xs,
      hourly.cloudCover,
      hourly.precipProbability,
      hourly.chanceOfSnow,
      hourly.humidity,
      hourly.pressureInHg,
    ],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-black/[.08] bg-white p-2 dark:border-white/[.12]">
        <UPlotChart options={tempOptions} data={tempData} />
      </div>
      <div className="rounded-lg border border-black/[.08] bg-white p-2 dark:border-white/[.12]">
        <UPlotChart options={condOptions} data={condData} />
      </div>
    </div>
  );
}
