import { afterEach, describe, expect, it, vi } from "vitest";
import { getCurrentLocation } from "./geolocation";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getCurrentLocation", () => {
  it("resolves a Location from the browser position", async () => {
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: (success: PositionCallback) =>
          success({
            coords: { latitude: 40.71, longitude: -74.01 },
          } as GeolocationPosition),
      },
    });

    const location = await getCurrentLocation();
    expect(location).toMatchObject({
      id: "geolocation",
      latitude: 40.71,
      longitude: -74.01,
    });
  });

  it("rejects with a readable message when permission is denied", async () => {
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: (
          _success: PositionCallback,
          error: PositionErrorCallback,
        ) =>
          error({
            code: 1,
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          } as GeolocationPositionError),
      },
    });

    await expect(getCurrentLocation()).rejects.toThrow(/permission was denied/i);
  });

  it("rejects when geolocation is unavailable", async () => {
    vi.stubGlobal("navigator", {});
    await expect(getCurrentLocation()).rejects.toThrow(/isn't available/i);
  });
});
