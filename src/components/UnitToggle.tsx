"use client";

import type { TemperatureUnit } from "@/lib/forecast";

interface UnitToggleProps {
  unit: TemperatureUnit;
  onChange: (unit: TemperatureUnit) => void;
}

const UNITS: { value: TemperatureUnit; label: string }[] = [
  { value: "fahrenheit", label: "°F" },
  { value: "celsius", label: "°C" },
];

export default function UnitToggle({ unit, onChange }: UnitToggleProps) {
  return (
    <div
      role="group"
      aria-label="Temperature unit"
      className="unit-toggle"
    >
      {UNITS.map(({ value, label }) => {
        const active = unit === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(value)}
            className={active ? "unit-active" : "unit-inactive"}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
