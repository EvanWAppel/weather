import { afterEach, describe, expect, it, vi } from "vitest";
import { searchLocations } from "./geocoding";

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

describe("searchLocations", () => {
  it("maps API results to Location objects", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        json: async () => ({
          results: [
            {
              id: 2950159,
              name: "Berlin",
              latitude: 52.52437,
              longitude: 13.41053,
              country: "Germany",
              admin1: "Land Berlin",
              timezone: "Europe/Berlin",
            },
          ],
        }),
      }),
    );

    const results = await searchLocations("Berlin");
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: 2950159,
      name: "Berlin",
      latitude: 52.52437,
      longitude: 13.41053,
      country: "Germany",
    });
  });

  it("returns [] when the API reports no results", async () => {
    vi.stubGlobal("fetch", mockFetch({ json: async () => ({}) }));
    expect(await searchLocations("zzzzzzz")).toEqual([]);
  });

  it("returns [] for a blank query without calling fetch", async () => {
    const fetchSpy = mockFetch({});
    vi.stubGlobal("fetch", fetchSpy);
    expect(await searchLocations("   ")).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("throws on an HTTP error instead of swallowing it", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ ok: false, status: 429, statusText: "Too Many Requests" }),
    );
    await expect(searchLocations("Berlin")).rejects.toThrow(/429/);
  });
});
