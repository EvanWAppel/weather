import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import RadarMap from "./RadarMap";
import type { Location } from "@/lib/types";

const mapInstances = vi.hoisted(() => [] as { options: unknown }[]);
const addControl = vi.hoisted(() => vi.fn());
const remove = vi.hoisted(() => vi.fn());

vi.mock("maplibre-gl", () => {
  class Map {
    options: unknown;
    constructor(options: unknown) {
      this.options = options;
      mapInstances.push(this);
    }
    addControl = addControl;
    on = vi.fn();
    easeTo = vi.fn();
    remove = remove;
  }
  class NavigationControl {}
  return { Map, NavigationControl };
});

const NYC: Location = {
  id: 1,
  name: "New York",
  latitude: 40.71,
  longitude: -74.01,
};

afterEach(() => {
  mapInstances.length = 0;
  vi.clearAllMocks();
});

describe("RadarMap", () => {
  it("initializes a MapLibre map centered on the location (lng, lat)", () => {
    render(<RadarMap location={NYC} />);
    expect(mapInstances).toHaveLength(1);
    const options = mapInstances[0].options as { center: [number, number] };
    expect(options.center).toEqual([-74.01, 40.71]);
  });

  it("removes the map on unmount", () => {
    const { unmount } = render(<RadarMap location={NYC} />);
    unmount();
    expect(remove).toHaveBeenCalled();
  });
});
