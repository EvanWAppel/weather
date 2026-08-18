"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface DeferUntilVisibleProps {
  children: ReactNode;
  /** Reserved height (px) before the content mounts, to avoid layout shift. */
  minHeight: number;
}

/**
 * Render children only once the placeholder scrolls near the viewport. Used to
 * defer the heavy MapLibre bundle so it doesn't parse on initial load (NFR-3).
 */
export default function DeferUntilVisible({
  children,
  minHeight,
}: DeferUntilVisibleProps) {
  const ref = useRef<HTMLDivElement>(null);
  // If IntersectionObserver is unavailable, render immediately (no deferral).
  const [visible, setVisible] = useState(
    () =>
      typeof window !== "undefined" && typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={visible ? undefined : { minHeight }}>
      {visible ? children : null}
    </div>
  );
}
