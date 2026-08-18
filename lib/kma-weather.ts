import { latLngToGrid } from "@/lib/kma-grid";
import { weatherLabel, type WeatherSnapshot } from "@/lib/weather";

const KMA_BASE =
  "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0";

type KmaItem = {
  category?: string;
  obsrValue?: string;
  fcstValue?: string;
  fcstDate?: string;
  fcstTime?: string;
  baseDate?: string;
  baseTime?: string;
};

export async function fetchWeatherSnapshot(
  lat: number,
  lng: number,
): Promise<WeatherSnapshot> {
  const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;
  if (!serviceKey) {
    throw new Error("날씨 API 키가 설정되어 있지 않아요.");
  }

  const { nx, ny } = latLngToGrid(lat, lng);
  const kst = kstParts();
  const ncst = ncstBase(kst);
  const fcst = fcstBase(kst);

  const [ncstItems, fcstItems] = await Promise.all([
    fetchKmaItems("getUltraSrtNcst", serviceKey, nx, ny, ncst.date, ncst.time),
    fetchKmaItems("getUltraSrtFcst", serviceKey, nx, ny, fcst.date, fcst.time),
  ]);

  const values = new Map<string, string>();
  for (const item of ncstItems) {
    if (item.category && item.obsrValue !== undefined) {
      values.set(item.category, item.obsrValue);
    }
  }

  const sky = pickCurrentSky(fcstItems, kst);
  const precipitationType = toInt(values.get("PTY"), 0);
  const snapshot: WeatherSnapshot = {
    label: weatherLabel(precipitationType, sky),
    temperature: toFloat(values.get("T1H")),
    humidity: toFloat(values.get("REH")),
    rainfall: toFloat(values.get("RN1")),
    windSpeed: toFloat(values.get("WSD")),
    precipitationType,
    sky,
    baseDate: ncst.date,
    baseTime: ncst.time,
    nx,
    ny,
  };

  if (
    snapshot.temperature === null &&
    snapshot.humidity === null &&
    ncstItems.length === 0
  ) {
    throw new Error("날씨 실황을 불러오지 못했어요.");
  }

  return snapshot;
}

async function fetchKmaItems(
  path: "getUltraSrtNcst" | "getUltraSrtFcst",
  serviceKey: string,
  nx: number,
  ny: number,
  baseDate: string,
  baseTime: string,
) {
  const params = new URLSearchParams({
    pageNo: "1",
    numOfRows: "1000",
    dataType: "JSON",
    base_date: baseDate,
    base_time: baseTime,
    nx: String(nx),
    ny: String(ny),
  });

  const url = `${KMA_BASE}/${path}?serviceKey=${encodeURIComponent(serviceKey)}&${params.toString()}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("기상청 API 요청에 실패했어요.");
  }

  const payload = (await response.json()) as {
    response?: {
      header?: { resultCode?: string; resultMsg?: string };
      body?: { items?: { item?: KmaItem | KmaItem[] } };
    };
  };

  const code = payload.response?.header?.resultCode;
  if (code && code !== "00") {
    throw new Error(payload.response?.header?.resultMsg || "날씨 조회에 실패했어요.");
  }

  const item = payload.response?.body?.items?.item;
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

function pickCurrentSky(items: KmaItem[], kst: ReturnType<typeof kstParts>) {
  const skyItems = items.filter((item) => item.category === "SKY" && item.fcstValue);
  if (skyItems.length === 0) return null;

  const nowStamp = `${kst.date}${kst.hour}`;
  const matched =
    skyItems.find((item) => `${item.fcstDate}${item.fcstTime?.slice(0, 2)}` === nowStamp) ??
    skyItems[0];
  return toInt(matched.fcstValue, 0) || null;
}

function kstParts() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    date: `${read("year")}${read("month")}${read("day")}`,
    hour: read("hour"),
    minute: Number(read("minute")),
  };
}

function shiftHour(date: string, hour: string, delta: number) {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(4, 6)) - 1;
  const day = Number(date.slice(6, 8));
  const utc = Date.UTC(year, month, day, Number(hour) - 9 + delta);
  const shifted = new Date(utc);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(shifted);
  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    date: `${read("year")}${read("month")}${read("day")}`,
    timeHour: read("hour"),
  };
}

function ncstBase(kst: ReturnType<typeof kstParts>) {
  if (kst.minute < 10) {
    const previous = shiftHour(kst.date, kst.hour, -1);
    return { date: previous.date, time: `${previous.timeHour}00` };
  }
  return { date: kst.date, time: `${kst.hour}00` };
}

function fcstBase(kst: ReturnType<typeof kstParts>) {
  if (kst.minute < 45) {
    const previous = shiftHour(kst.date, kst.hour, -1);
    return { date: previous.date, time: `${previous.timeHour}30` };
  }
  return { date: kst.date, time: `${kst.hour}30` };
}

function toFloat(value: string | undefined) {
  if (value === undefined || value === "" || value === "강수없음") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
