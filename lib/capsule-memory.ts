import type { WeatherSnapshot } from "@/lib/weather";

export const CAPSULE_SHAPES = [
  "sun",
  "rain",
  "cloud",
  "snow",
  "wind",
  "storm",
  "clear",
] as const;

export const CAPSULE_FORMS = [
  "classic",
  "stout",
  "slender",
  "ribbed",
  "faceted",
  "twin",
] as const;

export const CAPSULE_FINISHES = ["gold", "silver", "copper", "obsidian"] as const;

export type CapsuleShape = (typeof CAPSULE_SHAPES)[number];
export type CapsuleForm = (typeof CAPSULE_FORMS)[number];
export type CapsuleFinish = (typeof CAPSULE_FINISHES)[number];

export type CapsuleLook = {
  shape: CapsuleShape;
  form: CapsuleForm;
  finish: CapsuleFinish;
  from: string;
  to: string;
  accent: string;
};

export type CapsuleMemory = {
  line: string;
  keywords: string[];
  look: CapsuleLook;
};

const HEX = /^#([0-9a-fA-F]{6})$/;

export const LOOK_PALETTES: Record<CapsuleShape, { from: string; to: string; accent: string }> = {
  snow: { from: "#f4fbff", to: "#8fb8dc", accent: "#4d7eab" },
  rain: { from: "#d5e7fb", to: "#3d5f8a", accent: "#234368" },
  storm: { from: "#ddd6f3", to: "#4b4568", accent: "#2f2a45" },
  cloud: { from: "#eef1f5", to: "#7b8899", accent: "#4e5b6c" },
  wind: { from: "#e4eef8", to: "#6b91b8", accent: "#3f678f" },
  sun: { from: "#ffe7b0", to: "#f08a24", accent: "#c2410c" },
  clear: { from: "#fff6d4", to: "#e8b84a", accent: "#b45309" },
};

const LETTER_STOPWORDS = new Set([
  "나는",
  "내가",
  "너는",
  "네가",
  "우리",
  "오늘",
  "내일",
  "어제",
  "지금",
  "여기",
  "거기",
  "그리고",
  "하지만",
  "그래서",
  "그냥",
  "너무",
  "정말",
  "진짜",
  "아주",
  "조금",
  "많이",
  "있어",
  "없어",
  "해요",
  "했어",
  "했어요",
  "싶어",
  "싶다",
  "거야",
  "하는",
  "있는",
  "없는",
  "같은",
  "이런",
  "저런",
  "어떤",
  "무슨",
  "언제",
  "어디",
  "편지",
  "캡슐",
]);

const SHAPE_FORMS: Record<CapsuleShape, CapsuleForm[]> = {
  sun: ["stout", "twin", "classic"],
  rain: ["slender", "ribbed", "classic"],
  cloud: ["twin", "stout", "classic"],
  snow: ["classic", "stout", "ribbed"],
  wind: ["slender", "faceted", "classic"],
  storm: ["faceted", "ribbed", "slender"],
  clear: ["classic", "twin", "stout"],
};

const SHAPE_FINISHES: Record<CapsuleShape, CapsuleFinish[]> = {
  sun: ["copper", "gold"],
  rain: ["silver", "obsidian"],
  cloud: ["silver", "gold"],
  snow: ["silver", "gold"],
  wind: ["silver", "copper"],
  storm: ["obsidian", "copper"],
  clear: ["gold", "copper"],
};

const LETTER_TINTS = [
  { from: "#ffd6e8", to: "#d45d8b", accent: "#9d2460" },
  { from: "#d8fff0", to: "#2f9e7a", accent: "#146b52" },
  { from: "#efe0ff", to: "#7c5cbf", accent: "#4c2f8a" },
  { from: "#ffe4c4", to: "#e07a3d", accent: "#9a3f12" },
  { from: "#d7ecff", to: "#3f7ec7", accent: "#1e4f8a" },
];

export function lookFromWeather(weather: WeatherSnapshot | null): CapsuleLook {
  return lookFromContents({ weather });
}

export function lookFromContents(input: {
  weather: WeatherSnapshot | null;
  letter?: string;
  recipient?: string;
  seed?: string;
}): CapsuleLook {
  const shape = shapeFromWeather(input.weather);
  const seed = hashString(
    `${input.seed ?? ""}\n${input.recipient ?? ""}\n${input.letter ?? ""}\n${shape}`,
  );
  const palette = LOOK_PALETTES[shape];
  const tint = LETTER_TINTS[seed % LETTER_TINTS.length];
  const mix = (seed % 10) / 18;
  const hue = (seed % 21) - 10;

  return {
    shape,
    form: pick(SHAPE_FORMS[shape], seed),
    finish: pick(SHAPE_FINISHES[shape], seed >> 2),
    from: shiftHex(mixHex(palette.from, tint.from, mix), hue),
    to: shiftHex(mixHex(palette.to, tint.to, mix * 0.7), hue),
    accent: shiftHex(mixHex(palette.accent, tint.accent, mix * 0.5), hue),
  };
}

export function shapeFromWeather(weather: WeatherSnapshot | null): CapsuleShape {
  const pty = weather?.precipitationType ?? 0;
  const sky = weather?.sky;
  const temp = weather?.temperature;
  const humidity = weather?.humidity ?? 0;
  const wind = weather?.windSpeed ?? 0;

  if (pty === 3 || pty === 7) return "snow";
  if (pty === 2 || pty === 6) return "storm";
  if (pty === 1 || pty === 4 || pty === 5) return "rain";
  if (wind >= 8) return "wind";
  if (sky === 4 || humidity >= 85) return "cloud";
  if (sky === 3) return "wind";
  if (typeof temp === "number" && temp >= 28) return "sun";
  return "clear";
}

export function fallbackMemory(input: {
  letter?: string;
  recipient?: string;
  seed?: string;
  weather: WeatherSnapshot | null;
}): CapsuleMemory {
  const look = lookFromContents(input);
  return {
    line: weatherLine(input.weather),
    keywords: hintKeywords(input.letter ?? "", input.weather),
    look,
  };
}

function weatherLine(weather: WeatherSnapshot | null) {
  if (!weather) return "오늘을 조용히 묻어 두었어요";
  const temp =
    typeof weather.temperature === "number" ? `${weather.temperature}℃` : "";
  const humidity =
    typeof weather.humidity === "number" ? `습도 ${weather.humidity}%` : "";
  const mood = [weather.label, temp, humidity].filter(Boolean).join(" · ");
  return `${mood} 속에 묻어 둔 오늘`;
}

function hintKeywords(letter: string, weather: WeatherSnapshot | null) {
  const fromLetter = extractHintWords(letter);
  const fromWeather = weatherKeywords(weather);
  const merged = [...fromLetter];
  for (const word of fromWeather) {
    if (merged.length >= 5) break;
    if (!merged.includes(word)) merged.push(word);
  }
  return merged.slice(0, 5);
}

function weatherKeywords(weather: WeatherSnapshot | null) {
  if (!weather) return ["오늘"];
  const words = [weather.label];
  if (typeof weather.temperature === "number") {
    if (weather.temperature >= 30) words.push("더위");
    else if (weather.temperature >= 23) words.push("포근");
    else if (weather.temperature <= 5) words.push("추위");
    else if (weather.temperature <= 14) words.push("쌀쌀");
  }
  if (typeof weather.humidity === "number") {
    if (weather.humidity >= 80) words.push("후덥지근");
    else if (weather.humidity <= 35) words.push("건조");
  }
  return words;
}

function extractHintWords(letter: string) {
  const tokens = letter
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2 && word.length <= 8)
    .filter((word) => !LETTER_STOPWORDS.has(word));

  const unique: string[] = [];
  for (const word of tokens) {
    if (!unique.includes(word)) unique.push(word);
    if (unique.length >= 3) break;
  }
  return unique;
}

export function memoryFromUnknown(
  value: unknown,
  weather?: WeatherSnapshot | null,
): CapsuleMemory | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Partial<CapsuleMemory> & {
    look?: Partial<CapsuleLook>;
  };
  const line = typeof data.line === "string" ? data.line.trim() : "";
  const keywords = Array.isArray(data.keywords)
    ? data.keywords
        .filter((word): word is string => typeof word === "string")
        .map((word) => word.trim())
        .filter(Boolean)
        .slice(0, 5)
    : [];
  if (!line && keywords.length === 0 && !data.look) return null;

  return {
    line,
    keywords,
    look: sanitizeLook(data.look, lookFromWeather(weather ?? null)),
  };
}

export function sanitizeLook(
  value: Partial<CapsuleLook> | undefined,
  fallback?: CapsuleLook,
): CapsuleLook {
  const shape = CAPSULE_SHAPES.includes(value?.shape as CapsuleShape)
    ? (value?.shape as CapsuleShape)
    : (fallback?.shape ?? "clear");
  const palette = fallback ?? lookFromContents({ weather: null, seed: shape });
  const form = CAPSULE_FORMS.includes(value?.form as CapsuleForm)
    ? (value?.form as CapsuleForm)
    : (palette.form ?? pick(SHAPE_FORMS[shape], hashString(shape)));
  const finish = CAPSULE_FINISHES.includes(value?.finish as CapsuleFinish)
    ? (value?.finish as CapsuleFinish)
    : (palette.finish ?? pick(SHAPE_FINISHES[shape], hashString(shape)));

  return {
    shape,
    form,
    finish,
    from: HEX.test(value?.from ?? "") ? (value?.from as string) : palette.from,
    to: HEX.test(value?.to ?? "") ? (value?.to as string) : palette.to,
    accent: HEX.test(value?.accent ?? "") ? (value?.accent as string) : palette.accent,
  };
}

export function isDarkLook(look: CapsuleLook) {
  return (
    look.shape === "rain" ||
    look.shape === "storm" ||
    look.shape === "cloud" ||
    luminance(look.to) < 90
  );
}

function pick<T>(items: readonly T[], seed: number) {
  return items[seed % items.length];
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mixHex(a: string, b: string, amount: number) {
  const left = hexToRgb(a);
  const right = hexToRgb(b);
  if (!left || !right) return a;
  const t = Math.min(1, Math.max(0, amount));
  return rgbToHex({
    r: Math.round(left.r + (right.r - left.r) * t),
    g: Math.round(left.g + (right.g - left.g) * t),
    b: Math.round(left.b + (right.b - left.b) * t),
  });
}

function shiftHex(hex: string, hueShift: number) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const hsl = rgbToHsl(rgb);
  hsl.h = (hsl.h + hueShift + 360) % 360;
  return rgbToHex(hslToRgb(hsl));
}

function luminance(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 140;
  return 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
}

function hexToRgb(value: string) {
  const match = HEX.exec(value);
  if (!match) return null;
  const n = Number.parseInt(match[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(rgb: { r: number; g: number; b: number }) {
  const to = (channel: number) =>
    Math.max(0, Math.min(255, channel)).toString(16).padStart(2, "0");
  return `#${to(rgb.r)}${to(rgb.g)}${to(rgb.b)}`;
}

function rgbToHsl({ r, g, b }: { r: number; g: number; b: number }) {
  const nr = r / 255;
  const ng = g / 255;
  const nb = b / 255;
  const max = Math.max(nr, ng, nb);
  const min = Math.min(nr, ng, nb);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === nr) h = ((ng - nb) / delta) % 6;
    else if (max === ng) h = (nb - nr) / delta + 2;
    else h = (nr - ng) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  return { h, s, l };
}

function hslToRgb({ h, s, l }: { h: number; s: number; l: number }) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}
