import { describeWeatherCode } from "@/lib/weatherCodes";

export default function WeatherIcon({ code, className = "" }: { code: number; className?: string }) {
  const sun = code <= 2;
  const cloud = code > 0;
  const rain = code >= 51 && code < 71 || code >= 80;
  const snow = code >= 71 && code < 80;
  return (
    <svg viewBox="0 0 48 48" className={`weather-icon ${className}`} role="img" aria-label={describeWeatherCode(code).label} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {sun && <g className="icon-sun"><circle cx={cloud ? 19 : 24} cy={cloud ? 18 : 24} r="8" />{Array.from({ length: 8 }, (_, i) => <path key={i} d={cloud ? "M19 4v3" : "M24 8v4"} transform={`rotate(${i * 45} ${cloud ? '19 18' : '24 24'})`} />)}</g>}
      {cloud && <path d="M13 33a7 7 0 1 1 1-14 10 10 0 0 1 19 3 6 6 0 1 1 2 11Z" fill="var(--icon-cloud-fill)" />}
      {rain && <path d="m17 38-2 4m10-4-2 4m10-4-2 4" />}
      {snow && <path d="M16 39h4m-2-2v4m10-2h4m-2-2v4" />}
      {(code === 45 || code === 48) && <path d="M10 38h28M15 42h20" />}
      {code >= 95 && <path d="m26 30-5 8h6l-4 8" />}
    </svg>
  );
}
