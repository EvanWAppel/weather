import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import LocationSearch from "./LocationSearch";
import type { Location } from "@/lib/types";

const searchLocations = vi.hoisted(() => vi.fn());
vi.mock("@/lib/geocoding", () => ({ searchLocations }));

const BERLIN: Location = {
  id: 1,
  name: "Berlin",
  latitude: 52.52,
  longitude: 13.41,
  country: "Germany",
  admin1: "Land Berlin",
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("LocationSearch", () => {
  it("shows results and calls onSelect with the chosen location", async () => {
    searchLocations.mockResolvedValue([BERLIN]);
    const onSelect = vi.fn();
    render(<LocationSearch onSelect={onSelect} />);

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Berlin" },
    });

    const option = await screen.findByRole("option", {
      name: /Berlin, Land Berlin, Germany/,
    });
    fireEvent.click(option);

    expect(onSelect).toHaveBeenCalledWith(BERLIN);
  });

  it("surfaces a search error instead of failing silently", async () => {
    searchLocations.mockRejectedValue(new Error("Geocoding request failed"));
    render(<LocationSearch onSelect={vi.fn()} />);

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Berlin" },
    });

    await waitFor(() =>
      expect(screen.getByText(/Geocoding request failed/)).toBeInTheDocument(),
    );
  });
});
