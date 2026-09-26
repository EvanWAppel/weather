"use client";

import { useMemo } from "react";
import type { AlignedData, Options, Series } from "uplot";
import type { HourlyForecast, TemperatureUnit } from "@/lib/forecast";
import UPlotChart from "./UPlotChart";

interface ForecastChartsProps {
  hourly: HourlyForecast;
  unit: TemperatureUnit;
}

// Series colors tuned for the dark glass panels.
const COLORS = {
  temperature: "#ff8a5c",
  dewPoint: "#7fd1a6",
  feelsLike: "#ffcf87",
  cloudCover: "#b7c2d0",
  precip: "#5cc6ff",
  snow: "#f48fb3",
  humidity: "#a3e06b",
  pressure: "#e2e8f0",
  grid: "rgba(255,255,255,0.09)",
  axis: "rgba(233,240,250,0.55)",
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
      splits: (chart) => {
        const stride = Math.max(1, Math.ceil(dayTicks.length / Math.max(2, Math.floor(chart.width / 85))));
        return dayTicks.filter((_, index) => index % stride === 0);
      },
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
  const timeSeries = useMemo<Series>(() => ({
    label: "Time",
    value: (_chart, _value, _seriesIndex, index) => {
      const timestamp = index == null ? undefined : hourly.time[index];
      if (!timestamp) return "—";

      // Forecast timestamps are already in the selected location's local time.
      const [hour, minute] = timestamp.split("T")[1].split(":");
      const hours = Number(hour);
      return `${formatDayTick(timestamp)} · ${hours % 12 || 12}:${minute} ${hours < 12 ? "AM" : "PM"}`;
    },
  }), [hourly.time]);

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
        timeSeries,
        { label: `Temp (${symbol})`, scale: "temp", stroke: COLORS.temperature, width: 1.5, points: { show: false } },
        { label: `Dew Pt (${symbol})`, scale: "temp", stroke: COLORS.dewPoint, width: 1.25, points: { show: false } },
        { label: `Feels (${symbol})`, scale: "temp", stroke: COLORS.feelsLike, width: 1.25, points: { show: false } },
      ],
    }),
    [hourly.time, dayTicks, symbol, timeSeries],
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
        timeSeries,
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
    [hourly.time, dayTicks, timeSeries],
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
    <div className="charts">
      <div className="chart-card glass">
        <div className="chart-head"><h3>Temperature</h3><span>Air · dew point · feels like</span></div>
        <UPlotChart options={tempOptions} data={tempData} />
      </div>
      <div className="chart-card glass">
        <div className="chart-head"><h3>Atmosphere</h3><span>Precipitation &amp; more</span></div>
        <UPlotChart options={condOptions} data={condData} />
      </div>
    </div>
  );
}
