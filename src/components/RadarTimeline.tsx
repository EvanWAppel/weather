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
    return <p className="eyebrow" style={{ padding: "12px 6px" }}>Loading radar frames…</p>;
  }

  const frame = frames[current];
  const isForecast = frame?.kind === "nowcast";

  return (
    <div className="radar-controls">
      <button
        type="button"
        onClick={onTogglePlay}
        aria-label={playing ? "Pause radar" : "Play radar"}
        aria-pressed={playing}
        className="radar-btn"
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
        className="radar-slider"
      />

      <span className="radar-time">
        {frame ? frameTime(frame) : "—"}
        {isForecast && <span className="forecast-tag">forecast</span>}
      </span>
    </div>
  );
}
