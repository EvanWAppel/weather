import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchRadarFrames, radarTileUrl } from "./radar";

function mockFetch(response: Partial<Response> & { json?: () => unknown }) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => ({}),
    ...response,
  } as Response);
}

const INDEX = {
  generated: 1786915800,
  host: "https://tilecache.rainviewer.com",
  radar: {
    past: [
      { time: 1786915800, path: "/v2/radar/aaa" },
      { time: 1786916400, path: "/v2/radar/bbb" },
    ],
    nowcast: [{ time: 1786917000, path: "/v2/radar/nowcast_ccc" }],
  },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchRadarFrames", () => {
  it("merges past and nowcast frames in chronological order", async () => {
    vi.stubGlobal("fetch", mockFetch({ json: async () => INDEX }));
    const { host, frames, generated } = await fetchRadarFrames();

    expect(host).toBe("https://tilecache.rainviewer.com");
    expect(generated).toBe(1786915800);
    expect(frames.map((f) => f.kind)).toEqual(["past", "past", "nowcast"]);
    expect(frames.map((f) => f.time)).toEqual([
      1786915800, 1786916400, 1786917000,
    ]);
  });

  it("tolerates a missing nowcast array", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        json: async () => ({ ...INDEX, radar: { past: INDEX.radar.past } }),
      }),
    );
    const { frames } = await fetchRadarFrames();
    expect(frames).toHaveLength(2);
    expect(frames.every((f) => f.kind === "past")).toBe(true);
  });

  it("throws on an HTTP error", async () => {
    vi.stubGlobal("fetch", mockFetch({ ok: false, status: 503 }));
    await expect(fetchRadarFrames()).rejects.toThrow(/503/);
  });

  it("throws when host/radar are missing", async () => {
    vi.stubGlobal("fetch", mockFetch({ json: async () => ({}) }));
    await expect(fetchRadarFrames()).rejects.toThrow(/missing host\/radar/i);
  });
});

describe("radarTileUrl", () => {
  it("builds a MapLibre tile template with defaults", () => {
    const url = radarTileUrl("https://tilecache.rainviewer.com", {
      time: 1,
      path: "/v2/radar/aaa",
      kind: "past",
    });
    expect(url).toBe(
      "https://tilecache.rainviewer.com/v2/radar/aaa/256/{z}/{x}/{y}/2/1_1.png",
    );
  });

  it("honors size, color, smooth, and snow options", () => {
    const url = radarTileUrl(
      "https://h",
      { time: 1, path: "/p", kind: "past" },
      { size: 512, color: 4, smooth: false, snow: false },
    );
    expect(url).toBe("https://h/p/512/{z}/{x}/{y}/4/0_0.png");
  });
});
