"use client";

import type { RadarFrame } from "@/lib/radar";

interface RadarTimelineProps {
  frames: RadarFrame[];
  current: number;
  playing: boolean;
  onScrub: (index: number) => void;
  onTogglePlay: () => void;
}

function frameTime(frame: RadarFrame): string {
  return new Date(frame.time * 1000).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RadarTimeline({
  frames,
  current,
  playing,
  onScrub,
  onTogglePlay,
}: RadarTimelineProps) {
  if (frames.length === 0) {
    return <p className="text-sm text-zinc-500">Loading radar frames…</p>;
  }

  const frame = frames[current];
  const isForecast = frame?.kind === "nowcast";

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onTogglePlay}
        aria-label={playing ? "Pause radar" : "Play radar"}
        aria-pressed={playing}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/[.12] text-sm hover:bg-black/[.04] dark:border-white/[.16] dark:hover:bg-white/[.06]"
      >
        {playing ? "❚❚" : "▶"}
      </button>

      <input
        type="range"
        min={0}
        max={frames.length - 1}
        value={current}
        aria-label="Radar timeline"
        onChange={(e) => onScrub(Number(e.target.value))}
        className="flex-1 accent-blue-600"
      />

      <span className="w-28 shrink-0 text-right text-sm tabular-nums text-zinc-600 dark:text-zinc-300">
        {frame ? frameTime(frame) : "—"}
        {isForecast && (
          <span className="ml-1 text-blue-600 dark:text-blue-400">
            forecast
          </span>
        )}
      </span>
    </div>
  );
}
