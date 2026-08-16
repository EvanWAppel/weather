import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import UnitToggle from "./UnitToggle";

describe("UnitToggle", () => {
  it("marks the active unit as pressed", () => {
    render(<UnitToggle unit="fahrenheit" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "°F" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "°C" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("calls onChange with the chosen unit", () => {
    const onChange = vi.fn();
    render(<UnitToggle unit="fahrenheit" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "°C" }));
    expect(onChange).toHaveBeenCalledWith("celsius");
  });
});
