"use client";

import { useEffect, useRef, useState } from "react";
import { searchLocations } from "@/lib/geocoding";
import { locationLabel, type Location } from "@/lib/types";

interface LocationSearchProps {
  onSelect: (location: Location) => void;
}

const DEBOUNCE_MS = 300;

export default function LocationSearch({ onSelect }: LocationSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (!q) {
        setResults([]);
        setError(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const found = await searchLocations(q, { signal: controller.signal });
        setResults(found);
        setOpen(true);
      } catch (err) {
        if (controller.signal.aborted) return;
        // Surface the failure — do not swallow it (FR-6).
        setError(err instanceof Error ? err.message : "Search failed.");
        setResults([]);
        setOpen(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  // Close the dropdown when clicking outside.
  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleSelect(location: Location) {
    onSelect(location);
    setQuery(locationLabel(location));
    setResults([]);
    setOpen(false);
  }

  const showDropdown = open && (loading || error || results.length > 0);

  return (
    <div ref={containerRef} className="location-search">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}
        placeholder="Find your place in the world…"
        aria-label="Search a city"
        autoComplete="off"
        className="search-input"
      />

      {showDropdown && (
        <ul
          role="listbox"
          className="search-results"
        >
          {loading && (
            <li className="px-4 py-2.5 text-sm" style={{ color: "var(--faint)" }}>
              Searching…
            </li>
          )}

          {error && !loading && (
            <li className="px-4 py-2.5 text-sm" style={{ color: "var(--danger)" }}>
              {error}
            </li>
          )}

          {!loading &&
            !error &&
            results.map((location) => (
              <li key={location.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => handleSelect(location)}
                  className="block w-full px-4 py-2.5 text-left text-sm hover:bg-white/[.08]"
                >
                  {locationLabel(location)}
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
