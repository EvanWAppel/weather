import { describe, expect, it } from "vitest";
import { describeWeatherCode } from "./weatherCodes";

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
