import type { Location } from "./types";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

/** Days of daily forecast to request/display (PRD: exactly 10). */
export const FORECAST_DAYS = 10;

export type TemperatureUnit = "fahrenheit" | "celsius";

/** One day of the daily forecast, normalized from the Open-Meteo payload. */
export interface DailyForecast {
  /** ISO date, e.g. "2026-08-16". */
  date: string;
  tempMax: number;
  tempMin: number;
  /** Max precipitation probability (%), or null when unreported. */
  precipitationProbabilityMax: number | null;
  /** WMO weather interpretation code. */
  weatherCode: number;
}

export interface Forecast {
  unit: TemperatureUnit;
  days: DailyForecast[];
}

interface ForecastResponse {
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: (number | null)[];
    weather_code?: number[];
  };
}

/**
 * Fetch a 10-day daily forecast for a location from Open-Meteo.
 *
 * HTTP/network errors and malformed payloads are surfaced (never swallowed)
 * per FR-6, so the UI can show a readable message instead of a blank card.
 */
export async function fetchForecast(
  location: Pick<Location, "latitude" | "longitude">,
  {
    unit = "fahrenheit",
    signal,
  }: { unit?: TemperatureUnit; signal?: AbortSignal } = {},
): Promise<Forecast> {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("longitude", String(location.longitude));
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code",
  );
  url.searchParams.set("forecast_days", String(FORECAST_DAYS));
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("temperature_unit", unit);

  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(
      `Forecast request failed (${res.status} ${res.statusText}).`,
    );
  }

  const data = (await res.json()) as ForecastResponse;
  const daily = data.daily;
  if (
    !daily?.time ||
    !daily.temperature_2m_max ||
    !daily.temperature_2m_min ||
    !daily.weather_code
  ) {
    throw new Error("Forecast response was missing daily data.");
  }

  const days: DailyForecast[] = daily.time.map((date, i) => ({
    date,
    tempMax: daily.temperature_2m_max![i],
    tempMin: daily.temperature_2m_min![i],
    precipitationProbabilityMax:
      daily.precipitation_probability_max?.[i] ?? null,
    weatherCode: daily.weather_code![i],
  }));

  return { unit, days };
}
