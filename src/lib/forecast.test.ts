import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchForecast } from "./forecast";

function dailyPayload(days = 10) {
  const range = Array.from({ length: days }, (_, i) => i);
  return {
    daily: {
      time: range.map((i) => `2026-08-${String(16 + i).padStart(2, "0")}`),
      temperature_2m_max: range.map((i) => 80 + i),
      temperature_2m_min: range.map((i) => 60 + i),
      precipitation_probability_max: range.map((i) => (i === 1 ? null : i * 10)),
      weather_code: range.map(() => 3),
    },
  };
}

function mockFetch(response: Partial<Response> & { json?: () => unknown }) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => ({}),
    ...response,
  } as Response);
}

afterEach(() => {
  vi.restoreAllMocks();
});

const NYC = { latitude: 40.71, longitude: -74.01 };

describe("fetchForecast", () => {
  it("normalizes 10 days from the Open-Meteo payload", async () => {
    vi.stubGlobal("fetch", mockFetch({ json: async () => dailyPayload() }));
    const forecast = await fetchForecast(NYC, { unit: "fahrenheit" });

    expect(forecast.unit).toBe("fahrenheit");
    expect(forecast.days).toHaveLength(10);
    expect(forecast.days[0]).toEqual({
      date: "2026-08-16",
      tempMax: 80,
      tempMin: 60,
      precipitationProbabilityMax: 0,
      weatherCode: 3,
    });
  });

  it("maps a missing precipitation probability to null", async () => {
    vi.stubGlobal("fetch", mockFetch({ json: async () => dailyPayload() }));
    const forecast = await fetchForecast(NYC);
    expect(forecast.days[1].precipitationProbabilityMax).toBeNull();
  });

  it("requests the celsius unit when asked", async () => {
    const spy = mockFetch({ json: async () => dailyPayload() });
    vi.stubGlobal("fetch", spy);
    await fetchForecast(NYC, { unit: "celsius" });
    const requestedUrl = String(spy.mock.calls[0][0]);
    expect(requestedUrl).toContain("temperature_unit=celsius");
    expect(requestedUrl).toContain("forecast_days=10");
  });

  it("throws on an HTTP error instead of swallowing it", async () => {
    vi.stubGlobal("fetch", mockFetch({ ok: false, status: 500 }));
    await expect(fetchForecast(NYC)).rejects.toThrow(/500/);
  });

  it("throws when the daily block is missing", async () => {
    vi.stubGlobal("fetch", mockFetch({ json: async () => ({}) }));
    await expect(fetchForecast(NYC)).rejects.toThrow(/missing daily data/i);
  });
});
