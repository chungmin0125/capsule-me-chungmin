import { formatWeatherLine, type WeatherSnapshot } from "@/lib/weather";

export function WeatherSummary({
  weather,
  title = "묻은 날 날씨",
}: {
  weather: WeatherSnapshot;
  title?: string;
}) {
  return (
    <div className="rounded-2xl bg-sky-50 px-4 py-3 text-left ring-1 ring-sky-100">
      <p className="text-xs font-medium tracking-wide text-sky-800">{title}</p>
      <p className="mt-1 break-keep text-sm font-medium text-stone-800">
        {formatWeatherLine(weather)}
      </p>
      {weather.rainfall !== null && weather.rainfall > 0 ? (
        <p className="mt-1 text-xs text-stone-500">강수량 {weather.rainfall}mm</p>
      ) : null}
      {weather.windSpeed !== null ? (
        <p className="mt-1 text-xs text-stone-500">바람 {weather.windSpeed}m/s</p>
      ) : null}
    </div>
  );
}
