"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  capsuleFromDoc,
  formatCountdown,
  formatDateTime,
  isOpenable,
  remainingMs,
  type Capsule,
} from "@/lib/capsules";
import { recoverOrphanedCapsules } from "@/lib/recover-capsules";
import { useNow } from "@/lib/use-now";
import { useAuth } from "@/components/auth-provider";
import { DeleteCapsuleButton } from "@/components/delete-capsule-button";
import { useDevMode } from "@/components/dev-mode";

export function CapsuleDashboard() {
  const { user } = useAuth();
  const { devMode } = useDevMode();
  const now = useNow() ?? Date.now();
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

  if (loading) {
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
    <section className="mt-8 text-left">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-stone-800">내 캡슐</h2>
          <p className="mt-1 text-sm text-stone-400">
            {capsules.length}개 중 {readyCount}개를 열 수 있어요
            {devMode ? " · 개발자 모드에서는 잠긴 캡슐도 바로 열 수 있어요" : ""}
          </p>
        </div>
      </div>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {capsules.map((capsule) => (
          <li key={capsule.id}>
            <CapsuleCard capsule={capsule} now={now} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function CapsuleCard({ capsule, now }: { capsule: Capsule; now: number }) {
  const ready = isOpenable(capsule, now);
  const cover = capsule.photoUrls[0];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white/90 shadow-sm ring-1 ring-amber-100/80 transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/capsule/${capsule.id}`} className="block">
        <div className="relative h-36 bg-linear-to-br from-amber-100 via-rose-50 to-stone-200">
          {ready && cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <SealedMark />
          )}
          <span
            className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-medium ${
              ready
                ? "bg-amber-800 text-amber-50"
                : "bg-white/90 text-stone-600 ring-1 ring-stone-200"
            }`}
          >
            {ready ? "열 수 있어요" : "잠김"}
          </span>
        </div>

        <div className="px-4 py-4 pr-20">
          <p className="truncate text-base font-medium text-stone-800">
            To. {capsule.recipient || "이름 없음"}
          </p>
          <p className="mt-1 break-keep text-sm leading-6 text-stone-500">
            {ready
              ? `열람일 ${formatDateTime(capsule.openAt)}`
              : `${formatCountdown(remainingMs(capsule, now))} 남음`}
          </p>
        </div>
      </Link>
      <div className="absolute top-3 right-3">
        <DeleteCapsuleButton capsule={capsule} now={now} compact />
      </div>
    </div>
  );
}

function SealedMark() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex h-16 w-10 items-center justify-center rounded-full bg-amber-800/90 shadow-inner ring-2 ring-amber-200">
        <span className="h-8 w-1.5 rounded-full bg-amber-100/80" />
      </div>
    </div>
  );
}
