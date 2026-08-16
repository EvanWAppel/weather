import type { Location } from "./types";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

/** Raw result shape from the Open-Meteo geocoding API. */
interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  timezone?: string;
}

interface GeocodingResponse {
  results?: GeocodingResult[];
}

/**
 * Search places by name via the Open-Meteo geocoding API.
 *
 * Returns [] for a blank query or when the API reports no matches. Network
 * and HTTP errors are surfaced (never swallowed) per FR-6.
 */
export async function searchLocations(
  name: string,
  { count = 5, signal }: { count?: number; signal?: AbortSignal } = {},
): Promise<Location[]> {
  const query = name.trim();
  if (!query) return [];

  const url = new URL(GEOCODING_URL);
  url.searchParams.set("name", query);
  url.searchParams.set("count", String(count));
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(
      `Geocoding request failed (${res.status} ${res.statusText}) for "${query}".`,
    );
  }

  const data = (await res.json()) as GeocodingResponse;
  return (data.results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    latitude: r.latitude,
    longitude: r.longitude,
    country: r.country,
    admin1: r.admin1,
    timezone: r.timezone,
  }));
}
