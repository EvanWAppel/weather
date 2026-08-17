import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ForecastPanel from "./ForecastPanel";
import type { Forecast } from "@/lib/forecast";
import type { Location } from "@/lib/types";

const fetchForecast = vi.hoisted(() => vi.fn());
vi.mock("@/lib/forecast", () => ({ fetchForecast }));

const NYC: Location = {
  id: 1,
  name: "New York",
  latitude: 40.71,
  longitude: -74.01,
};

const FORECAST: Forecast = {
  unit: "fahrenheit",
  days: Array.from({ length: 10 }, (_, i) => ({
    date: `2026-08-${String(16 + i).padStart(2, "0")}`,
    tempMax: 80 + i,
    tempMin: 60 + i,
    precipitationProbabilityMax: i * 5,
    weatherCode: 0,
  })),
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("ForecastPanel", () => {
  it("renders 10 day cards once the forecast loads", async () => {
    fetchForecast.mockResolvedValue(FORECAST);
    render(<ForecastPanel location={NYC} unit="fahrenheit" />);

    await screen.findByText("10-Day Forecast");
    expect(screen.getAllByRole("listitem")).toHaveLength(10);
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("surfaces an error instead of a blank panel", async () => {
    fetchForecast.mockRejectedValue(new Error("Forecast request failed"));
    render(<ForecastPanel location={NYC} unit="fahrenheit" />);

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        /Forecast request failed/,
      ),
    );
  });

  it("refetches when the active location changes (MAP-05)", async () => {
    fetchForecast.mockResolvedValue(FORECAST);
    const { rerender } = render(
      <ForecastPanel location={NYC} unit="fahrenheit" />,
    );
    await screen.findByText("10-Day Forecast");

    const paris: Location = {
      id: 2,
      name: "Paris",
      latitude: 48.85,
      longitude: 2.35,
    };
    rerender(<ForecastPanel location={paris} unit="fahrenheit" />);

    await waitFor(() =>
      expect(fetchForecast).toHaveBeenCalledWith(
        { latitude: 48.85, longitude: 2.35 },
        expect.objectContaining({ unit: "fahrenheit" }),
      ),
    );
  });
});
