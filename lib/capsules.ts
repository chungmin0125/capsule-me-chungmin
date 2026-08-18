import type { DocumentData } from "firebase/firestore";

import {
  fallbackMemory,
  lookFromContents,
  memoryFromUnknown,
  sanitizeLook,
  type CapsuleLook,
  type CapsuleMemory,
} from "@/lib/capsule-memory";
import { weatherFromUnknown, type WeatherSnapshot } from "@/lib/weather";

export type Capsule = {
  id: string;
  ownerUid: string;
  recipient: string;
  letter: string;
  photoUrls: string[];
  openAt: number;
  createdAt: number;
  storageKey?: string;
  weather?: WeatherSnapshot | null;
  geminiNote?: string | null;
  memory?: CapsuleMemory | null;
};

export function capsuleFromDoc(id: string, data: DocumentData): Capsule | null {
  const ownerUid =
    (typeof data.ownerUid === "string" && data.ownerUid) ||
    (typeof data.uid === "string" && data.uid) ||
    (typeof data.userId === "string" && data.userId) ||
    "";
  if (!ownerUid) return null;

  const photoSource = data.photoUrls ?? data.photos ?? data.images;
  const photoUrls = Array.isArray(photoSource)
    ? photoSource.filter((url): url is string => typeof url === "string")
    : [];
  const weather = weatherFromUnknown(data.weather);

  return {
    id,
    ownerUid,
    recipient: typeof data.recipient === "string" ? data.recipient : "",
    letter: typeof data.letter === "string" ? data.letter : "",
    photoUrls,
    openAt: toMillis(data.openAt),
    createdAt: toMillis(data.createdAt),
    storageKey: typeof data.storageKey === "string" ? data.storageKey : undefined,
    weather,
    geminiNote: typeof data.geminiNote === "string" ? data.geminiNote : null,
    memory: memoryFromUnknown(data.memory, weather) ?? legacyMemory(id, data),
  };
}

export function isOpenable(capsule: Pick<Capsule, "openAt">, now = Date.now()) {
  return now >= capsule.openAt;
}

export function remainingMs(capsule: Pick<Capsule, "openAt">, now = Date.now()) {
  return Math.max(0, capsule.openAt - now);
}

export function formatTimer(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");

  return {
    days,
    hours,
    minutes,
    seconds,
    clock: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
  };
}

export function formatDateTime(ms: number) {
  if (!ms) return "";
  return new Date(ms).toLocaleString("ko-KR", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export function formatDday(ms: number) {
  if (ms <= 0) return "오늘";
  const days = Math.max(1, Math.ceil(ms / 86400000));
  return `D-${days}`;
}

export function formatCountdown(ms: number) {
  if (ms <= 0) return "지금 열 수 있어요";

  const totalSeconds = Math.ceil(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return hours > 0 ? `${days}일 ${hours}시간` : `${days}일`;
  }
  if (hours > 0) {
    return minutes > 0 ? `${hours}시간 ${minutes}분` : `${hours}시간`;
  }
  if (minutes > 0) {
    return `${minutes}분 ${seconds}초`;
  }
  return `${seconds}초`;
}

export function capsuleLook(capsule: Capsule): CapsuleLook {
  return capsuleMemory(capsule).look;
}

export function capsuleMemory(capsule: Capsule): CapsuleMemory {
  const contentsLook = lookFromContents({
    weather: capsule.weather ?? null,
    letter: capsule.letter,
    recipient: capsule.recipient,
    seed: capsule.id,
  });
  const stored = capsule.memory;
  if (!stored) {
    return fallbackMemory({
      letter: capsule.letter,
      recipient: capsule.recipient,
      seed: capsule.id,
      weather: capsule.weather ?? null,
    });
  }

  return {
    line: stored.line || fallbackMemory({
      letter: capsule.letter,
      weather: capsule.weather ?? null,
    }).line,
    keywords: stored.keywords.length > 0 ? stored.keywords : [],
    look: sanitizeLook(stored.look, contentsLook),
  };
}

function legacyMemory(id: string, data: DocumentData): CapsuleMemory | null {
  const line = typeof data.geminiNote === "string" ? data.geminiNote.trim() : "";
  if (!line) return null;
  return {
    line,
    keywords: [],
    look: lookFromContents({
      weather: weatherFromUnknown(data.weather),
      letter: typeof data.letter === "string" ? data.letter : "",
      recipient: typeof data.recipient === "string" ? data.recipient : "",
      seed: id,
    }),
  };
}

function toMillis(value: unknown) {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === "object") {
    const maybeTimestamp = value as {
      toMillis?: () => number;
      seconds?: number;
    };
    if (typeof maybeTimestamp.toMillis === "function") {
      return maybeTimestamp.toMillis();
    }
    if (typeof maybeTimestamp.seconds === "number") {
      return maybeTimestamp.seconds * 1000;
    }
  }
  return 0;
}
