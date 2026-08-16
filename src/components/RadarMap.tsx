"use client";

import { useEffect, useRef, useState } from "react";
import {
  Map as MapLibreMap,
  NavigationControl,
  type StyleSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  fetchRadarFrames,
  radarTileUrl,
  type RadarFrame,
} from "@/lib/radar";
import type { Location } from "@/lib/types";
import RadarTimeline from "./RadarTimeline";

// Keyless OSM raster base map (no Mapbox token) — see PRD §5.
const OSM_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

const RADAR_OPACITY = 0.7;
const PLAYBACK_MS = 600;
// RainViewer radar tiles are served up to zoom 7; beyond that the API returns a
// "Zoom Level Not Supported" placeholder. Cap the source so MapLibre overzooms
// (scales) the z7 tiles instead of requesting unavailable ones.
const RADAR_MAX_ZOOM = 7;

interface RadarMapProps {
  location: Location;
}

function layerId(index: number): string {
  return `radar-${index}`;
}

export default function RadarMap({ location }: RadarMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const initialCenter = useRef<[number, number]>([
    location.longitude,
    location.latitude,
  ]);

  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize the base map once.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = new MapLibreMap({
      container,
      style: OSM_STYLE,
      center: initialCenter.current,
      zoom: 7,
    });
    map.addControl(new NavigationControl(), "top-right");
    // Surface MapLibre errors instead of failing silently (FR-6).
    map.on("error", (e) => console.error("[radar-map] maplibre error", e));
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Recenter when the active location changes (MAP-05).
  useEffect(() => {
    mapRef.current?.easeTo({
      center: [location.longitude, location.latitude],
    });
  }, [location.latitude, location.longitude]);

  // Fetch the radar frame index once, then add a transparent raster layer per
  // frame; playback toggles opacity (the standard RainViewer pattern).
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const result = await fetchRadarFrames({ signal: controller.signal });
        setFrames(result.frames);
        // Start on the most recent past frame.
        const lastPast = result.frames.filter((f) => f.kind === "past").length;
        setCurrent(Math.max(0, lastPast - 1));

        const map = mapRef.current;
        if (!map) return;
        const addLayers = () => {
          result.frames.forEach((frame, i) => {
            const id = layerId(i);
            if (map.getSource(id)) return;
            map.addSource(id, {
              type: "raster",
              tiles: [radarTileUrl(result.host, frame)],
              tileSize: 256,
              maxzoom: RADAR_MAX_ZOOM,
            });
            map.addLayer({
              id,
              type: "raster",
              source: id,
              paint: {
                "raster-opacity": 0,
                "raster-opacity-transition": { duration: 0 },
              },
            });
          });
        };
        if (map.isStyleLoaded()) addLayers();
        else map.once("load", addLayers);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error ? err.message : "Couldn't load radar frames.",
        );
      }
    })();
    return () => controller.abort();
  }, []);

  // Show only the current frame's layer.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || frames.length === 0) return;
    const apply = () => {
      frames.forEach((_, i) => {
        if (map.getLayer(layerId(i))) {
          map.setPaintProperty(
            layerId(i),
            "raster-opacity",
            i === current ? RADAR_OPACITY : 0,
          );
        }
      });
    };
    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [current, frames]);

  // Advance frames while playing.
  useEffect(() => {
    if (!playing || frames.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % frames.length);
    }, PLAYBACK_MS);
    return () => clearInterval(timer);
  }, [playing, frames.length]);

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={containerRef}
        aria-label="Radar map"
        className="h-[420px] w-full overflow-hidden rounded-lg border border-black/[.08] dark:border-white/[.12]"
      />
      {error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : (
        <RadarTimeline
          frames={frames}
          current={current}
          playing={playing}
          onScrub={setCurrent}
          onTogglePlay={() => setPlaying((p) => !p)}
        />
      )}
    </div>
  );
}
