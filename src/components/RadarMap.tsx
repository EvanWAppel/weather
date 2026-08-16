"use client";

import { useEffect, useRef } from "react";
import {
  Map as MapLibreMap,
  NavigationControl,
  type StyleSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Location } from "@/lib/types";

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

interface RadarMapProps {
  location: Location;
}

export default function RadarMap({ location }: RadarMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  // Captured once so the init effect can stay dependency-free; live updates
  // are handled by the recenter effect below.
  const initialCenter = useRef<[number, number]>([
    location.longitude,
    location.latitude,
  ]);

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

  return (
    <div
      ref={containerRef}
      aria-label="Radar map"
      className="h-[420px] w-full overflow-hidden rounded-lg border border-black/[.08] dark:border-white/[.12]"
    />
  );
}
