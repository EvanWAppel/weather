const RAINVIEWER_INDEX_URL =
  "https://api.rainviewer.com/public/weather-maps.json";

export type RadarFrameKind = "past" | "nowcast";

export interface RadarFrame {
  /** Unix timestamp (seconds). */
  time: number;
  /** RainViewer tile path, e.g. "/v2/radar/2978b13aa6e6". */
  path: string;
  kind: RadarFrameKind;
}

export interface RadarFrames {
  /** Tile host, e.g. "https://tilecache.rainviewer.com". */
  host: string;
  /** Past frames then nowcast frames, in chronological order. */
  frames: RadarFrame[];
  /** When RainViewer generated the index (unix seconds). */
  generated: number;
}

interface RainViewerFrame {
  time: number;
  path: string;
}

interface RainViewerIndex {
  generated?: number;
  host?: string;
  radar?: {
    past?: RainViewerFrame[];
    nowcast?: RainViewerFrame[];
  };
}

/**
 * Fetch the RainViewer radar frame index (past + nowcast). HTTP/network
 * errors and malformed payloads are surfaced, never swallowed (FR-6).
 */
export async function fetchRadarFrames({
  signal,
}: { signal?: AbortSignal } = {}): Promise<RadarFrames> {
  const res = await fetch(RAINVIEWER_INDEX_URL, { signal });
  if (!res.ok) {
    throw new Error(
      `Radar frame index request failed (${res.status} ${res.statusText}).`,
    );
  }

  const data = (await res.json()) as RainViewerIndex;
  if (!data.host || !data.radar) {
    throw new Error("Radar frame index was missing host/radar data.");
  }

  const past: RadarFrame[] = (data.radar.past ?? []).map((f) => ({
    time: f.time,
    path: f.path,
    kind: "past",
  }));
  const nowcast: RadarFrame[] = (data.radar.nowcast ?? []).map((f) => ({
    time: f.time,
    path: f.path,
    kind: "nowcast",
  }));

  return {
    host: data.host,
    frames: [...past, ...nowcast],
    generated: data.generated ?? 0,
  };
}

export interface RadarTileOptions {
  /** Tile size in px (256 or 512). */
  size?: 256 | 512;
  /** RainViewer color scheme id (2 = universal blue). */
  color?: number;
  /** Smooth the radar data. */
  smooth?: boolean;
  /** Show snow in a separate color. */
  snow?: boolean;
}

/**
 * Build a MapLibre raster tile-URL template (`{z}/{x}/{y}`) for a radar frame.
 */
export function radarTileUrl(
  host: string,
  frame: RadarFrame,
  { size = 256, color = 2, smooth = true, snow = true }: RadarTileOptions = {},
): string {
  const flags = `${smooth ? 1 : 0}_${snow ? 1 : 0}`;
  return `${host}${frame.path}/${size}/{z}/{x}/{y}/${color}/${flags}.png`;
}
