export type WeatherSnapshot = {
  label: string;
  temperature: number | null;
  humidity: number | null;
  rainfall: number | null;
  windSpeed: number | null;
  precipitationType: number;
  sky: number | null;
  baseDate: string;
  baseTime: string;
  nx: number;
  ny: number;
  place?: string;
  lat?: number;
  lng?: number;
};

export function weatherLabel(precipitationType: number, sky: number | null) {
  switch (precipitationType) {
    case 1:
      return "비";
    case 2:
      return "비/눈";
    case 3:
      return "눈";
    case 4:
      return "소나기";
    case 5:
      return "빗방울";
    case 6:
      return "비/눈 날림";
    case 7:
      return "눈날림";
    default:
      if (sky === 3) return "구름많음";
      if (sky === 4) return "흐림";
      return "맑음";
  }
}

export function formatWeatherLine(weather: WeatherSnapshot) {
  const parts = weather.place ? [weather.place, weather.label] : [weather.label];
  if (weather.temperature !== null) parts.push(`${weather.temperature}℃`);
  if (weather.humidity !== null) parts.push(`습도 ${weather.humidity}%`);
  return parts.join(" · ");
}

export function formatObservedClock(weather: Pick<WeatherSnapshot, "baseDate" | "baseTime">) {
  if (weather.baseDate.length < 8 || weather.baseTime.length < 4) return "";
  const stamp = `${weather.baseDate.slice(0, 4)}-${weather.baseDate.slice(4, 6)}-${weather.baseDate.slice(6, 8)}T${weather.baseTime.slice(0, 2)}:${weather.baseTime.slice(2, 4)}:00+09:00`;
  const date = new Date(stamp);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function weatherFromUnknown(value: unknown): WeatherSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Partial<WeatherSnapshot>;
  if (typeof data.label !== "string" || !data.label) return null;

  return {
    label: data.label,
    temperature: toNumberOrNull(data.temperature),
    humidity: toNumberOrNull(data.humidity),
    rainfall: toNumberOrNull(data.rainfall),
    windSpeed: toNumberOrNull(data.windSpeed),
    precipitationType:
      typeof data.precipitationType === "number" ? data.precipitationType : 0,
    sky: toNumberOrNull(data.sky),
    baseDate: typeof data.baseDate === "string" ? data.baseDate : "",
    baseTime: typeof data.baseTime === "string" ? data.baseTime : "",
    nx: typeof data.nx === "number" ? data.nx : 0,
    ny: typeof data.ny === "number" ? data.ny : 0,
    place: typeof data.place === "string" && data.place.trim() ? data.place.trim() : undefined,
    lat: toNumberOrNull(data.lat) ?? undefined,
    lng: toNumberOrNull(data.lng) ?? undefined,
  };
}

function toNumberOrNull(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
