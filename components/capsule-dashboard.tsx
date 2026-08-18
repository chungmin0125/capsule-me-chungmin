"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  capsuleFromDoc,
  capsuleLook,
  capsuleMemory,
  formatDday,
  isOpenable,
  remainingMs,
  type Capsule,
} from "@/lib/capsules";
import { recoverOrphanedCapsules } from "@/lib/recover-capsules";
import { useNow } from "@/lib/use-now";
import { useAuth } from "@/components/auth-provider";
import { DeleteCapsuleButton } from "@/components/delete-capsule-button";
import { useDevMode } from "@/components/dev-mode";
import { KeywordRow, WeatherCapsule } from "@/components/weather-capsule";

export function CapsuleDashboard() {
  const { user } = useAuth();
  const { devMode } = useDevMode();
  const now = useNow();
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const recoveredForUid = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const capsulesQuery = query(
      collection(db, "capsules"),
      where("ownerUid", "==", user.uid),
    );

    return onSnapshot(
      capsulesQuery,
      (snapshot) => {
        const next = snapshot.docs
          .map((doc) => capsuleFromDoc(doc.id, doc.data()))
          .filter((capsule): capsule is Capsule => capsule !== null)
          .sort((a, b) => a.openAt - b.openAt);
        setCapsules(next);
        setLoading(false);
        setError(null);
      },
      () => {
        setError("캡슐 목록을 불러오지 못했어요.");
        setLoading(false);
      },
    );
  }, [user]);

  useEffect(() => {
    if (!user || loading) return;
    if (recoveredForUid.current === user.uid) return;
    recoveredForUid.current = user.uid;

    recoverOrphanedCapsules(user.uid, capsules).catch(() => {
      // Storage list 권한이 없으면 조용히 건너뜁니다.
    });
  }, [user, loading, capsules]);

  if (loading || now == null) {
    return <p className="mt-8 text-sm text-stone-400">캡슐을 불러오는 중...</p>;
  }

  if (error) {
    return (
      <p className="mt-8 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
        {error}
      </p>
    );
  }

  if (capsules.length === 0) {
    return (
      <div className="mt-8 rounded-3xl bg-white/80 px-6 py-10 text-center shadow-sm ring-1 ring-amber-100/80">
        <h2 className="text-lg font-semibold text-stone-800">내 캡슐</h2>
        <p className="mt-2 break-keep text-sm leading-6 text-stone-500">
          아직 묻은 캡슐이 없어요. 위에서 첫 캡슐을 묻어 보세요.
        </p>
      </div>
    );
  }

  const readyCount = capsules.filter((capsule) => isOpenable(capsule, now)).length;

  return (
    <section className="mt-6 text-left">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-stone-800">내 캡슐</h2>
          <p className="mt-1 break-keep text-sm text-stone-400">
            {readyCount > 0
              ? `${capsules.length}개 중 ${readyCount}개가 수면 가까이 떠올랐어요`
              : `묻은 캡슐 ${capsules.length}개 · 열람일이 가까울수록 위로 떠요`}
            {devMode ? " · 개발자 모드에서는 잠긴 캡슐도 바로 열 수 있어요" : ""}
          </p>
        </div>
      </div>

      <CapsuleSea capsules={capsules} now={now} />
    </section>
  );
}

function CapsuleSea({ capsules, now }: { capsules: Capsule[]; now: number }) {
  const hourNow = Math.floor(now / 3_600_000) * 3_600_000;
  const spots = useMemo(
    () => layoutCapsules(capsules, hourNow),
    [capsules, hourNow],
  );

  return (
    <div className="relative mt-4 min-h-[36rem] overflow-hidden rounded-[2rem] ring-1 ring-sky-100/80 sm:min-h-[42rem]">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #c8e7ff 0%, #9fd0f0 16%, #5ea3c9 42%, #2d5f7a 72%, #1b3a4a 100%)",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-[11%] h-px bg-white/50" />
      <span className="pointer-events-none absolute top-[18%] left-[8%] h-2 w-2 rounded-full bg-white/30" />
      <span className="pointer-events-none absolute top-[36%] left-[78%] h-1.5 w-1.5 rounded-full bg-white/25" />
      <span className="pointer-events-none absolute top-[58%] left-[22%] h-2.5 w-2.5 rounded-full bg-white/15" />
      <span className="pointer-events-none absolute top-[74%] left-[62%] h-1 w-1 rounded-full bg-white/20" />
      <p className="pointer-events-none absolute top-3 left-4 text-[11px] tracking-[0.18em] text-sky-950/70">
        수면
      </p>
      <p className="pointer-events-none absolute bottom-3 left-4 text-[11px] tracking-[0.18em] text-sky-100/70">
        깊은 곳
      </p>

      {spots.map((spot) => (
        <FloatingCapsule key={spot.capsule.id} spot={spot} now={now} />
      ))}
    </div>
  );
}

function FloatingCapsule({
  spot,
  now,
}: {
  spot: CapsuleSpot;
  now: number;
}) {
  const { capsule, x, y, rise } = spot;
  const ready = isOpenable(capsule, now);
  const look = capsuleLook(capsule);
  const memory = capsuleMemory(capsule);
  const left = remainingMs(capsule, now);

  return (
    <div
      className="group absolute w-28 -translate-x-1/2 sm:w-32"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        zIndex: ready ? 30 : Math.round(4 + rise * 20),
        filter: ready
          ? `drop-shadow(0 0 16px ${look.accent}aa)`
          : `drop-shadow(0 10px 16px ${look.accent}55)`,
      }}
    >
      <div className="absolute -top-1 -right-1 z-20 opacity-0 transition group-hover:opacity-100">
        <DeleteCapsuleButton capsule={capsule} now={now} compact />
      </div>
      <Link
        href={`/capsule/${capsule.id}`}
        className="flex flex-col items-center text-center"
      >
        <p
          className={`mb-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            ready
              ? "bg-amber-800 text-amber-50"
              : "bg-white/80 text-sky-950/80"
          }`}
        >
          {ready ? "열 수 있어요" : formatDday(left)}
        </p>
        <WeatherCapsule
          look={look}
          size={rise > 0.62 || ready ? "md" : "sm"}
          seed={capsule.id}
        />
        <p className="mt-2 max-w-full truncate text-xs font-medium text-white drop-shadow-sm">
          To. {capsule.recipient || "이름 없음"}
        </p>
        <div className="mt-1 max-w-[9.5rem] scale-90">
          <KeywordRow
            keywords={memory.keywords.slice(0, 2)}
            onDark
            align="center"
          />
        </div>
      </Link>
    </div>
  );
}

type CapsuleSpot = {
  capsule: Capsule;
  x: number;
  y: number;
  rise: number;
};

function layoutCapsules(capsules: Capsule[], now: number): CapsuleSpot[] {
  const placed: CapsuleSpot[] = [];

  for (const capsule of capsules) {
    const rise = riseAmount(remainingMs(capsule, now));
    let x = 12 + hash01(capsule.id) * 76;
    let y = 12 + (1 - rise) * 60;

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const hit = placed.find(
        (spot) => Math.abs(spot.x - x) < 14 && Math.abs(spot.y - y) < 18,
      );
      if (!hit) break;
      x = 12 + ((x + 17) % 76);
      y = Math.min(74, y + 5);
    }

    placed.push({ capsule, x, y, rise });
  }

  return placed;
}

function riseAmount(ms: number) {
  if (ms <= 0) return 1;
  const days = ms / 86400000;
  return 1 / (1 + days / 12);
}

function hash01(id: string) {
  return hashInt(id, 1000) / 1000;
}

function hashInt(id: string, max: number) {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }
  return hash % max;
}
