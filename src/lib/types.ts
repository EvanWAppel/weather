/** An active location the app can show a forecast and radar for. */
export interface Location {
  /** Open-Meteo geocoding id when available; synthesized for geolocation. */
  id: number | string;
  /** Primary place name, e.g. "Berlin". */
  name: string;
  latitude: number;
  longitude: number;
  /** Country name, e.g. "Germany". */
  country?: string;
  /** First-level admin region, e.g. "California". */
  admin1?: string;
  /** IANA timezone, e.g. "Europe/Berlin". */
  timezone?: string;
}

/** A human-readable label like "Berlin, Land Berlin, Germany". */
export function locationLabel(location: Location): string {
  return [location.name, location.admin1, location.country]
    .filter(Boolean)
    .join(", ");
}
