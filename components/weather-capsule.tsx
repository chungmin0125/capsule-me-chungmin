"use client";

import { useId, type CSSProperties } from "react";
import {
  isDarkLook,
  type CapsuleFinish,
  type CapsuleForm,
  type CapsuleLook,
  type CapsuleShape,
} from "@/lib/capsule-memory";

const FINISHES: Record<
  CapsuleFinish,
  { top: string; mid: string; bottom: string; line: string }
> = {
  gold: { top: "#f3e2b0", mid: "#c9a44a", bottom: "#8a6a24", line: "#5c4514" },
  silver: { top: "#f4f7fb", mid: "#b7c2ce", bottom: "#6d7b89", line: "#3d4853" },
  copper: { top: "#f4c9a8", mid: "#c8723d", bottom: "#8a3f18", line: "#5a2710" },
  obsidian: { top: "#6b7280", mid: "#374151", bottom: "#111827", line: "#030712" },
};

export function WeatherCapsule({
  look,
  size = "md",
  seed,
  glow,
}: {
  look: CapsuleLook;
  size?: "sm" | "md" | "lg";
  seed?: string;
  glow?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const scale =
    size === "lg" ? "h-48 w-24" : size === "sm" ? "h-[4.5rem] w-9" : "h-32 w-16";
  const form = look.form ?? "classic";
  const finish = FINISHES[look.finish ?? "gold"];
  const geo = geometry(form);
  const motion = floatStyle(seed ?? `${look.shape}-${look.from}-${form}`);

  return (
    <div className={`relative ${scale} capsule-float`} style={motion.vars}>
      <BubbleTrail accent={look.accent} seed={motion.seed} compact={size === "sm"} />
      <svg
        viewBox="0 0 100 180"
        className="relative h-full w-full"
        aria-hidden="true"
        style={{ filter: glow ? `drop-shadow(0 10px 16px ${glow})` : undefined }}
      >
        <defs>
          <linearGradient id={`${uid}-cap`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={mixHex(look.from, "#ffffff", 0.28)} />
            <stop offset="55%" stopColor={look.accent} />
            <stop offset="100%" stopColor={mixHex(look.accent, look.to, 0.35)} />
          </linearGradient>
          <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={look.from} />
            <stop offset="100%" stopColor={look.to} />
          </linearGradient>
          <linearGradient id={`${uid}-band`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={finish.top} />
            <stop offset="42%" stopColor={finish.mid} />
            <stop offset="100%" stopColor={finish.bottom} />
          </linearGradient>
          <linearGradient id={`${uid}-shine`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <clipPath id={`${uid}-clip`}>
            <rect x={geo.x} y={geo.y} width={geo.w} height={geo.h} rx={geo.rx} />
          </clipPath>
        </defs>

        <ellipse
          cx="50"
          cy={geo.y + geo.h + 6}
          rx={geo.w * 0.38}
          ry="6"
          fill={look.accent}
          opacity="0.22"
        />

        <g clipPath={`url(#${uid}-clip)`}>
          <rect x="0" y={geo.split} width="100" height="180" fill={`url(#${uid}-body)`} />
          <rect x="0" y="0" width="100" height={geo.split + 4} fill={`url(#${uid}-cap)`} />
          {form === "twin" ? (
            <rect x={geo.x} y={geo.split - 2} width={geo.w} height="5" fill={look.accent} opacity="0.55" />
          ) : (
            <>
              <rect
                x={geo.x - 1}
                y={geo.bandY}
                width={geo.w + 2}
                height={geo.bandH}
                fill={`url(#${uid}-band)`}
              />
              <rect
                x={geo.x}
                y={geo.bandY + 3}
                width={geo.w}
                height="2"
                fill={finish.top}
                opacity="0.55"
              />
              {bandScrews(geo).map((x) => (
                <rect
                  key={x}
                  x={x}
                  y={geo.bandY + 3}
                  width="1.4"
                  height={geo.bandH - 6}
                  rx="0.6"
                  fill={finish.line}
                  opacity="0.28"
                />
              ))}
            </>
          )}
          {form === "ribbed"
            ? [0, 1, 2, 3].map((index) => (
                <rect
                  key={index}
                  x={geo.x + 6}
                  y={geo.split + 18 + index * 14}
                  width={geo.w - 12}
                  height="3"
                  rx="1.5"
                  fill={look.accent}
                  opacity="0.22"
                />
              ))
            : null}
          {form === "faceted" ? (
            <path
              d={`M${geo.x + 8} ${geo.y + 18} L${geo.x + geo.w - 8} ${geo.y + 18} L${geo.x + geo.w - 4} ${geo.split} L${geo.x + 4} ${geo.split} Z`}
              fill="#ffffff"
              opacity="0.08"
            />
          ) : null}
          <path
            d={`M${geo.x + 8} ${geo.y + 16}c8 8 10 26 6 44`}
            fill="none"
            stroke={`url(#${uid}-shine)`}
            strokeWidth="9"
            strokeLinecap="round"
          />
        </g>

        <rect
          x={geo.x}
          y={geo.y}
          width={geo.w}
          height={geo.h}
          rx={geo.rx}
          fill="none"
          stroke={mixHex(look.accent, "#1c1408", 0.45)}
          strokeOpacity="0.35"
          strokeWidth={form === "faceted" ? 2.2 : 1.6}
        />
        <rect
          x={geo.x + 4}
          y={geo.y + 4}
          width={geo.w - 8}
          height={geo.h - 8}
          rx={Math.max(8, geo.rx - 4)}
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.18"
          strokeWidth="1"
        />

        <g transform={`translate(${50 - 22} ${geo.split + 18}) scale(0.68)`}>
          <WeatherMark shape={look.shape} accent={isDarkLook(look) ? look.from : look.accent} />
        </g>
      </svg>
    </div>
  );
}

function BubbleTrail({
  accent,
  seed,
  compact = false,
}: {
  accent: string;
  seed: number;
  compact?: boolean;
}) {
  const bubbles = [
    { left: "18%", delay: "0s", ms: `${2400 + (seed % 700)}ms`, x: "4px" },
    { left: "58%", delay: "0.8s", ms: `${2800 + (seed % 500)}ms`, x: "-6px" },
    { left: "36%", delay: "1.6s", ms: `${3200 + (seed % 400)}ms`, x: "7px" },
  ];

  return (
    <div className="pointer-events-none absolute inset-x-0 -top-3 bottom-6 overflow-hidden">
      {bubbles.map((bubble) => (
        <span
          key={bubble.left}
          className={`capsule-bubble absolute bottom-5 rounded-full ${
            compact ? "h-1 w-1" : "h-1.5 w-1.5"
          }`}
          style={{
            left: bubble.left,
            background: accent,
            animationDuration: bubble.ms,
            animationDelay: bubble.delay,
            ["--bubble-x" as string]: bubble.x,
          }}
        />
      ))}
    </div>
  );
}

function geometry(form: CapsuleForm) {
  switch (form) {
    case "stout":
      return { x: 8, y: 18, w: 84, h: 144, rx: 42, split: 86, bandY: 78, bandH: 16 };
    case "slender":
      return { x: 24, y: 4, w: 52, h: 172, rx: 26, split: 92, bandY: 84, bandH: 14 };
    case "ribbed":
      return { x: 16, y: 8, w: 68, h: 164, rx: 30, split: 88, bandY: 80, bandH: 15 };
    case "faceted":
      return { x: 18, y: 10, w: 64, h: 160, rx: 16, split: 84, bandY: 76, bandH: 14 };
    case "twin":
      return { x: 14, y: 8, w: 72, h: 164, rx: 36, split: 94, bandY: 88, bandH: 8 };
    default:
      return { x: 14, y: 8, w: 72, h: 164, rx: 36, split: 90, bandY: 82, bandH: 16 };
  }
}

function bandScrews(geo: ReturnType<typeof geometry>) {
  const start = geo.x + 8;
  const end = geo.x + geo.w - 8;
  const step = (end - start) / 5;
  return [0, 1, 2, 3, 4, 5].map((index) => start + step * index);
}

function floatStyle(seed: string) {
  const n = hash(seed);
  return {
    seed: n,
    vars: {
      "--float-x": `${8 + (n % 12)}px`,
      "--float-x-neg": `${-6 - ((n >> 2) % 10)}px`,
      "--float-y": `${-14 - (n % 16)}px`,
      "--float-y-mid": `${-5 - ((n >> 4) % 8)}px`,
      "--float-ms": `${3800 + (n % 2400)}ms`,
      "--float-delay": `-${n % 3600}ms`,
      "--float-rot-a": `${-2.2 - (n % 18) / 10}deg`,
      "--float-rot-b": `${2.4 + ((n >> 3) % 18) / 10}deg`,
    } as unknown as CSSProperties,
  };
}

function hash(value: string) {
  let next = 0;
  for (let index = 0; index < value.length; index += 1) {
    next = (next * 31 + value.charCodeAt(index)) >>> 0;
  }
  return next;
}

function WeatherMark({
  shape,
  accent,
}: {
  shape: CapsuleShape;
  accent: string;
}) {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64">
      {shape === "sun" ? (
        <>
          <circle cx="32" cy="32" r="10" fill={accent} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <rect
              key={deg}
              x="31"
              y="6"
              width="2.4"
              height="10"
              rx="1.2"
              fill={accent}
              transform={`rotate(${deg} 32 32)`}
            />
          ))}
        </>
      ) : null}
      {shape === "rain" ? (
        <>
          <path d="M22 18c0 8-6 14-6 20a6 6 0 0 0 12 0c0-6-6-12-6-20z" fill={accent} />
          <path d="M34 14c0 9-7 15-7 22a7 7 0 0 0 14 0c0-7-7-13-7-22z" fill={accent} opacity="0.85" />
          <path d="M46 20c0 7-5 12-5 18a5 5 0 0 0 10 0c0-6-5-11-5-18z" fill={accent} opacity="0.7" />
        </>
      ) : null}
      {shape === "snow" ? (
        <>
          <path
            d="M32 8v48M14 20l36 24M14 44l36-24"
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
      {shape === "clear" ? (
        <>
          <circle cx="32" cy="26" r="7" fill={accent} />
          <path d="M32 36v16" stroke={accent} strokeWidth="3" strokeLinecap="round" />
          <path d="M24 44h16" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        </>
      ) : null}
    </svg>
  );
}

export function KeywordRow({
  keywords,
  onDark = false,
  align = "start",
}: {
  keywords: string[];
  onDark?: boolean;
  align?: "start" | "center";
}) {
  if (keywords.length === 0) return null;

  return (
    <div
      className={`flex flex-wrap gap-1.5 ${align === "center" ? "justify-center" : "justify-start"}`}
    >
      {keywords.map((word) => (
        <span
          key={word}
          className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
            onDark
              ? "bg-white/20 text-white ring-white/30"
              : "bg-white/80 text-stone-600 ring-stone-200"
          }`}
        >
          #{word}
        </span>
      ))}
    </div>
  );
}

export function lookTextClass(look: CapsuleLook) {
  return isDarkLook(look) ? "text-white" : "text-stone-800";
}

function mixHex(a: string, b: string, amount: number) {
  const left = hexToRgb(a);
  const right = hexToRgb(b);
  if (!left || !right) return a;
  const t = Math.min(1, Math.max(0, amount));
  const to = (channel: number, other: number) =>
    Math.round(channel + (other - channel) * t)
      .toString(16)
      .padStart(2, "0");
  return `#${to(left.r, right.r)}${to(left.g, right.g)}${to(left.b, right.b)}`;
}

function hexToRgb(value: string) {
  const match = /^#([0-9a-fA-F]{6})$/.exec(value);
  if (!match) return null;
  const n = Number.parseInt(match[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
