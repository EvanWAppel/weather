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
      className="inline-flex overflow-hidden rounded-lg border border-black/[.12] text-sm dark:border-white/[.16]"
    >
      {UNITS.map(({ value, label }) => {
        const active = unit === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(value)}
            className={
              active
                ? "bg-zinc-900 px-3 py-1.5 font-medium text-white dark:bg-white dark:text-zinc-900"
                : "px-3 py-1.5 text-zinc-600 hover:bg-black/[.04] dark:text-zinc-300 dark:hover:bg-white/[.06]"
            }
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
