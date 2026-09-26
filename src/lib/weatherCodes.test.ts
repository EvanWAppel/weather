import { describe, expect, it } from "vitest";
import { describeWeatherCode, weatherSky } from "./weatherCodes";

describe("describeWeatherCode", () => {
  it("maps known codes to a label and icon", () => {
    expect(describeWeatherCode(0).label).toBe("Clear sky");
    expect(describeWeatherCode(95).label).toBe("Thunderstorm");
    expect(describeWeatherCode(3).icon).toBeTruthy();
  });

  it("falls back to Unknown for unmapped codes", () => {
    expect(describeWeatherCode(1234)).toEqual({ label: "Unknown", icon: "❓" });
  });
});

describe("weatherSky", () => {
  it("distinguishes clear day from clear night", () => {
    expect(weatherSky(0, true)).toBe("clear-day");
    expect(weatherSky(1, false)).toBe("clear-night");
  });

  it("distinguishes cloudy day from cloudy night", () => {
    expect(weatherSky(3, true)).toBe("cloudy-day");
    expect(weatherSky(3, false)).toBe("cloudy-night");
  });

  it("categorizes precipitation regardless of daylight", () => {
    expect(weatherSky(45, true)).toBe("fog");
    expect(weatherSky(63, true)).toBe("rain");
    expect(weatherSky(80, false)).toBe("rain");
    expect(weatherSky(73, true)).toBe("snow");
    expect(weatherSky(86, false)).toBe("snow");
    expect(weatherSky(95, true)).toBe("storm");
  });
});
