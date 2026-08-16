import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RadarTimeline from "./RadarTimeline";
import type { RadarFrame } from "@/lib/radar";

const FRAMES: RadarFrame[] = [
  { time: 1786915800, path: "/v2/radar/a", kind: "past" },
  { time: 1786916400, path: "/v2/radar/b", kind: "past" },
  { time: 1786917000, path: "/v2/radar/c", kind: "nowcast" },
];

describe("RadarTimeline", () => {
  it("shows a loading note when there are no frames", () => {
    render(
      <RadarTimeline
        frames={[]}
        current={0}
        playing={false}
        onScrub={vi.fn()}
        onTogglePlay={vi.fn()}
      />,
    );
    expect(screen.getByText(/loading radar frames/i)).toBeInTheDocument();
  });

  it("toggles play and scrubs frames", () => {
    const onTogglePlay = vi.fn();
    const onScrub = vi.fn();
    render(
      <RadarTimeline
        frames={FRAMES}
        current={0}
        playing={false}
        onScrub={onScrub}
        onTogglePlay={onTogglePlay}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /play radar/i }));
    expect(onTogglePlay).toHaveBeenCalled();

    fireEvent.change(screen.getByRole("slider", { name: /radar timeline/i }), {
      target: { value: "2" },
    });
    expect(onScrub).toHaveBeenCalledWith(2);
  });

  it("labels a nowcast frame as forecast", () => {
    render(
      <RadarTimeline
        frames={FRAMES}
        current={2}
        playing
        onScrub={vi.fn()}
        onTogglePlay={vi.fn()}
      />,
    );
    expect(screen.getByText(/forecast/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /pause radar/i }),
    ).toBeInTheDocument();
  });
});
