const SOURCES = [
  { label: "Open-Meteo", href: "https://open-meteo.com/" },
  { label: "RainViewer", href: "https://www.rainviewer.com/" },
  {
    label: "OpenStreetMap",
    href: "https://www.openstreetmap.org/copyright",
  },
] as const;

export default function Footer() {
  return (
    <footer className="border-t border-black/[.08] px-6 py-4 text-center text-sm text-zinc-500 dark:border-white/[.12] dark:text-zinc-400">
      <p>
        Data from{" "}
        {SOURCES.map((source, i) => (
          <span key={source.href}>
            <a
              href={source.href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              {source.label}
            </a>
            {i < SOURCES.length - 2 ? ", " : ""}
            {i === SOURCES.length - 2 ? " and " : ""}
          </span>
        ))}
        . Ad-free and tracker-free.
      </p>
    </footer>
  );
}
