import type { DocumentData } from "firebase/firestore";

export type Capsule = {
  id: string;
  ownerUid: string;
  recipient: string;
  letter: string;
  photoUrls: string[];
  openAt: number;
  createdAt: number;
  storageKey?: string;
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

  return {
    id,
    ownerUid,
    recipient: typeof data.recipient === "string" ? data.recipient : "",
    letter: typeof data.letter === "string" ? data.letter : "",
    photoUrls,
    openAt: toMillis(data.openAt),
    createdAt: toMillis(data.createdAt),
    storageKey: typeof data.storageKey === "string" ? data.storageKey : undefined,
  };
}

export function isOpenable(capsule: Pick<Capsule, "openAt">, now = Date.now()) {
  return now >= capsule.openAt;
}

export function remainingMs(capsule: Pick<Capsule, "openAt">, now = Date.now()) {
  return Math.max(0, capsule.openAt - now);
}

export function formatDateTime(ms: number) {
  if (!ms) return "";
  return new Date(ms).toLocaleString("ko-KR", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export function formatCountdown(ms: number) {
  if (ms <= 0) return "지금 열 수 있어요";

  const totalSeconds = Math.ceil(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}일 ${hours}시간 ${minutes}분`;
  }
  if (hours > 0) {
    return `${hours}시간 ${minutes}분 ${seconds}초`;
  }
  if (minutes > 0) {
    return `${minutes}분 ${seconds}초`;
  }
  return `${seconds}초`;
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
