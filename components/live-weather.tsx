"use client";

import { useCallback, useEffect, useState } from "react";
import { lookFromWeather, shapeFromWeather, type CapsuleShape } from "@/lib/capsule-memory";
import { fetchLiveWeather, type LiveWeather } from "@/lib/live-weather";
import { formatObservedClock } from "@/lib/weather";

const REFRESH_MS = 10 * 60 * 1000;

export type LiveWeatherState =
  | { status: "loading" }
  | { status: "ready"; weather: LiveWeather; fallback: boolean; updating: boolean }
  | { status: "error"; message: string };

export function useLiveWeather() {
  const [state, setState] = useState<LiveWeatherState>({ status: "loading" });

  const load = useCallback(async (silent = false) => {
    setState((prev) => {
      if (silent && prev.status === "ready") return { ...prev, updating: true };
      if (prev.status === "ready") return prev;
      return { status: "loading" };
    });

    try {
      const next = await fetchLiveWeather();
      setState({
        status: "ready",
        weather: next.weather,
        fallback: next.fallback,
        updating: false,
      });
    } catch (error) {
      setState((prev) => {
        if (silent && prev.status === "ready") return { ...prev, updating: false };
        return {
          status: "error",
          message: error instanceof Error ? error.message : "날씨를 불러오지 못했어요.",
        };
      });
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => {
      void load(true);
    }, REFRESH_MS);

    function onVisible() {
      if (document.visibilityState === "visible") void load(true);
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  return { state, load };
}

export function LiveWeatherCard() {
  const { state, load } = useLiveWeather();
  return <LiveWeatherPanel state={state} onReload={load} />;
}

export function LiveWeatherPanel({
  state,
  onReload,
}: {
  state: LiveWeatherState;
  onReload: (silent?: boolean) => void;
}) {
  if (state.status === "loading") {
    return (
      <section
        aria-busy="true"
        aria-label="지금 날씨"
        className="mt-6 h-40 animate-pulse rounded-3xl bg-white/80 shadow-sm ring-1 ring-amber-100/80"
      />
    );
  }

  if (state.status === "error") {
    return (
      <section className="mt-6 rounded-3xl bg-white/80 px-5 py-5 text-left shadow-sm ring-1 ring-amber-100/80">
        <p className="text-sm font-medium text-stone-800">지금 날씨</p>
        <p className="mt-2 break-keep text-sm text-stone-500">{state.message}</p>
        <button
          type="button"
          onClick={() => onReload()}
          className="mt-4 inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-medium text-stone-700 ring-1 ring-stone-300 transition hover:bg-stone-50"
        >
          다시 불러오기
        </button>
      </section>
    );
  }

  const { weather, fallback, updating } = state;
  const look = lookFromWeather(weather);
  const shape = shapeFromWeather(weather);
  const observed = formatObservedClock(weather);
  const temperature =
    weather.temperature === null ? "--" : String(Math.round(weather.temperature));

  return (
    <section
      aria-label="지금 날씨"
      className="mt-6 overflow-hidden rounded-3xl bg-white/90 shadow-sm ring-1 ring-amber-100/80"
    >
      <div
        className="px-5 py-5"
        style={{
          background: `linear-gradient(165deg, ${look.from} 0%, ${look.to} 88%)`,
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-wide text-stone-600">지금 날씨</p>
            <p className="mt-1 flex items-center gap-1.5 text-base font-semibold text-stone-800">
              <LocationMark />
              {weather.place}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {observed ? (
              <p className="text-xs text-stone-600">{observed} 기준</p>
            ) : null}
            <button
              type="button"
              onClick={() => onReload(true)}
              disabled={updating}
              className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-stone-600 ring-1 ring-white/70 transition hover:bg-white disabled:opacity-60"
            >
              {updating ? "갱신 중" : "새로고침"}
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-end gap-4">
          <WeatherGlyph shape={shape} accent={look.accent} />
          <div className="min-w-0">
            <p className="text-5xl font-semibold tracking-tight text-stone-800">
              {temperature}
              <span className="ml-0.5 text-2xl font-medium">℃</span>
            </p>
            <p className="mt-1 text-lg font-medium text-stone-700">{weather.label}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-px bg-amber-100/70">
        <Stat label="습도" value={weather.humidity === null ? "-" : `${weather.humidity}%`} />
        <Stat
          label="바람"
          value={weather.windSpeed === null ? "-" : `${weather.windSpeed}m/s`}
        />
        <Stat
          label="강수"
          value={
            weather.rainfall === null || weather.rainfall <= 0
              ? "없음"
              : `${weather.rainfall}mm`
          }
        />
      </div>

      {fallback ? (
        <p className="break-keep px-5 py-3 text-xs leading-5 text-stone-500">
          위치를 찾지 못해 서울 날씨를 보여 줘요. 위치 권한을 허용하면 지금 있는 곳
          날씨로 바뀌어요.
        </p>
      ) : null}
      <p className={`${fallback ? "px-5 pb-3" : "px-5 py-2.5"} text-xs text-stone-400`}>
        기상청 초단기실황 · 공공데이터포털
      </p>
    </section>
  );
}

function WeatherGlyph({ shape, accent }: { shape: CapsuleShape; accent: string }) {
  return (
    <div
      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/70 ring-1 ring-white/80"
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" width="40" height="40">
        {shape === "sun" || shape === "clear" ? (
          <>
            <circle cx="32" cy="32" r="10" fill={accent} />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <rect
                key={deg}
                x="31"
                y="8"
                width="2.4"
                height="8"
                rx="1.2"
                fill={accent}
                transform={`rotate(${deg} 32 32)`}
              />
            ))}
          </>
        ) : null}
        {shape === "rain" ? (
          <>
            <path d="M22 14c0 8-6 14-6 20a6 6 0 0 0 12 0c0-6-6-12-6-20z" fill={accent} />
            <path d="M34 10c0 9-7 15-7 22a7 7 0 0 0 14 0c0-7-7-13-7-22z" fill={accent} opacity="0.85" />
            <path d="M46 16c0 7-5 12-5 18a5 5 0 0 0 10 0c0-6-5-11-5-18z" fill={accent} opacity="0.7" />
          </>
        ) : null}
        {shape === "snow" ? (
          <>
            <path
              d="M32 10v44M16 20l32 24M16 44l32-24"
              stroke={accent}
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="32" cy="32" r="4" fill={accent} />
          </>
        ) : null}
        {shape === "cloud" ? (
          <>
            <circle cx="24" cy="34" r="11" fill={accent} opacity="0.85" />
            <circle cx="38" cy="30" r="13" fill={accent} />
            <circle cx="48" cy="36" r="9" fill={accent} opacity="0.9" />
          </>
        ) : null}
        {shape === "wind" ? (
          <>
            <path d="M10 24h30a8 8 0 1 0-8-8" stroke={accent} strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M10 36h36a7 7 0 1 1-7 7" stroke={accent} strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M10 48h22" stroke={accent} strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        ) : null}
        {shape === "storm" ? (
          <path d="M36 8 18 34h14L22 56l26-30H34z" fill={accent} />
        ) : null}
      </svg>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/90 px-3 py-3 text-center">
      <p className="text-[11px] font-medium tracking-wide text-stone-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-stone-800">{value}</p>
    </div>
  );
}

function LocationMark() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" className="shrink-0">
      <path
        fill="currentColor"
        d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z"
      />
    </svg>
  );
}
