"use client";

import { useEffect, useRef } from "react";
import uPlot, { type AlignedData, type Options } from "uplot";
import "uplot/dist/uPlot.min.css";

interface UPlotChartProps {
  /** uPlot options WITHOUT width — width is managed responsively here. */
  options: Omit<Options, "width">;
  data: AlignedData;
}

/**
 * Thin, responsive wrapper around uPlot. Recreates the plot when options/data
 * change and tracks the container width via ResizeObserver so the chart fills
 * its column on any viewport. Lazy-loaded by the parent so uPlot stays out of
 * the initial bundle (NFR-3).
 */
export default function UPlotChart({ options, data }: UPlotChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const width = el.clientWidth || 600;
    const plot = new uPlot({ ...options, width }, data, el);

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.round(entry.contentRect.width);
        if (w > 0) plot.setSize({ width: w, height: options.height });
      }
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      plot.destroy();
    };
  }, [options, data]);

  return <div ref={containerRef} className="uplot-wrap w-full overflow-hidden" />;
}
