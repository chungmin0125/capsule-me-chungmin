import { weatherFromUnknown, type WeatherSnapshot } from "@/lib/weather";

export const SEOUL = { lat: 37.5665, lng: 126.978 };

export type LiveWeather = WeatherSnapshot & {
  place: string;
  lat: number;
  lng: number;
};

export async function currentCoords() {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return { ...SEOUL, fallback: true };
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 4000,
        maximumAge: 10 * 60 * 1000,
      });
    });
    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      fallback: false,
    };
  } catch {
    return { ...SEOUL, fallback: true };
  }
}

export async function fetchLiveWeather(): Promise<{
  weather: LiveWeather;
  fallback: boolean;
}> {
  const { lat, lng, fallback } = await currentCoords();
  const response = await fetch(`/api/weather?lat=${lat}&lng=${lng}`, {
    cache: "no-store",
  });
  const payload = (await response.json()) as WeatherSnapshot & {
    place?: string;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(payload.error || "날씨를 불러오지 못했어요.");
  }

  const weather = weatherFromUnknown(payload);
  if (!weather) {
    throw new Error("날씨를 불러오지 못했어요.");
  }

  return {
    fallback,
    weather: {
      ...weather,
      place: typeof payload.place === "string" && payload.place ? payload.place : "내 위치",
      lat,
      lng,
    },
  };
}

export async function fetchWeatherSnapshot(): Promise<WeatherSnapshot | null> {
  try {
    const { weather } = await fetchLiveWeather();
    return snapshotForStorage(weather);
  } catch {
    return null;
  }
}

export function snapshotForStorage(weather: LiveWeather): WeatherSnapshot {
  return {
    label: weather.label,
    temperature: weather.temperature,
    humidity: weather.humidity,
    rainfall: weather.rainfall,
    windSpeed: weather.windSpeed,
    precipitationType: weather.precipitationType,
    sky: weather.sky,
    baseDate: weather.baseDate,
    baseTime: weather.baseTime,
    nx: weather.nx,
    ny: weather.ny,
    place: weather.place,
    lat: weather.lat,
    lng: weather.lng,
  };
}
