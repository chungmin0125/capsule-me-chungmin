import { placeFromLatLng } from "@/lib/kma-places";
import { fetchWeatherSnapshot } from "@/lib/kma-weather";

const SEOUL = { lat: 37.5665, lng: 126.978 };
const headers = { "Cache-Control": "no-store" };

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat") ?? SEOUL.lat);
  const lng = Number(searchParams.get("lng") ?? SEOUL.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Response.json({ error: "위치 값이 올바르지 않아요." }, { status: 400, headers });
  }

  try {
    const weather = await fetchWeatherSnapshot(lat, lng);
    return Response.json(
      {
        ...weather,
        place: placeFromLatLng(lat, lng),
        lat,
        lng,
      },
      { headers },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "날씨를 불러오지 못했어요.";
    return Response.json({ error: message }, { status: 502, headers });
  }
}
