import type { Location } from "./types";

/**
 * Resolve the browser's current position as a Location.
 *
 * Rejects with a readable message when geolocation is unavailable, denied, or
 * times out — callers surface it rather than failing silently (FR-2).
 */
export function getCurrentLocation(): Promise<Location> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation isn't available in this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          id: "geolocation",
          name: "My location",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error(geolocationErrorMessage(error)));
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  });
}

function geolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location permission was denied. Search for a city instead.";
    case error.POSITION_UNAVAILABLE:
      return "Your location is currently unavailable.";
    case error.TIMEOUT:
      return "Timed out getting your location.";
    default:
      return "Couldn't get your location.";
  }
}
