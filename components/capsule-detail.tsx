"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  capsuleFromDoc,
  capsuleLook,
  capsuleMemory,
  formatDateTime,
  formatTimer,
  isOpenable,
  remainingMs,
  type Capsule,
} from "@/lib/capsules";
import { useNow } from "@/lib/use-now";
import { useAuth } from "@/components/auth-provider";
import { DeleteCapsuleButton } from "@/components/delete-capsule-button";
import { DevModeToggle, useDevMode } from "@/components/dev-mode";
import { KeywordRow, WeatherCapsule } from "@/components/weather-capsule";
import { WeatherSummary } from "@/components/weather-summary";
import type { CapsuleLook } from "@/lib/capsule-memory";

export function CapsuleDetail({ id }: { id: string }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { devMode } = useDevMode();
  const now = useNow() ?? Date.now();
  const [capsule, setCapsule] = useState<Capsule | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forcedOpen, setForcedOpen] = useState(false);

  useEffect(() => {
    setForcedOpen(false);
    setMissing(false);
    setError(null);

    return onSnapshot(
      doc(db, "capsules", id),
      (snapshot) => {
        if (!snapshot.exists()) {
          setCapsule(null);
          setMissing(true);
          return;
        }
        setCapsule(capsuleFromDoc(snapshot.id, snapshot.data()));
        setMissing(false);
      },
      () => {
        setError("캡슐을 불러오지 못했어요.");
      },
    );
  }, [id]);

  if (authLoading) {
    return (
      <DetailShell>
        <p className="text-sm text-stone-400">잠시만요...</p>
      </DetailShell>
    );
  }

  if (!user) {
    return (
      <DetailShell>
        <p className="text-sm text-stone-500">로그인해야 캡슐을 볼 수 있어요.</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-amber-800 px-6 py-2.5 text-sm font-medium text-amber-50"
        >
          홈으로 가기
        </Link>
      </DetailShell>
    );
  }

  if (error) {
    return (
      <DetailShell>
        <p className="text-sm text-rose-600">{error}</p>
        <HomeLink />
      </DetailShell>
    );
  }

  if (missing || (capsule && capsule.ownerUid !== user.uid)) {
    return (
      <DetailShell>
        <p className="text-sm text-stone-500">이 캡슐을 찾을 수 없어요.</p>
        <HomeLink />
      </DetailShell>
    );
  }

  if (!capsule) {
    return (
      <DetailShell>
        <p className="text-sm text-stone-400">캡슐을 불러오는 중...</p>
      </DetailShell>
    );
  }

  const ready = isOpenable(capsule, now);
  const opened = ready || forcedOpen;

  if (!opened) {
    const timer = formatTimer(remainingMs(capsule, now));
    const look = capsuleLook(capsule);
    const memory = capsuleMemory(capsule);

    return (
      <DetailShell tone={look}>
        <Header />
        <div className="mt-8 flex justify-center">
          <WeatherCapsule look={look} size="lg" seed={capsule.id} />
        </div>
        <p className="mt-6 text-center text-sm font-medium text-amber-800">
          아직 잠겨 있어요
        </p>
        <h1 className="mt-2 text-center text-3xl font-semibold tracking-tight text-stone-800">
          To. {capsule.recipient}
        </h1>
        {memory.line ? (
          <p className="mt-4 break-keep text-center text-sm leading-relaxed text-stone-600">
            {memory.line}
          </p>
        ) : null}
        <div className="mt-4">
          <KeywordRow keywords={memory.keywords} align="center" />
        </div>
        <p className="mt-3 break-keep text-center text-xs text-stone-400">
          키워드만 보여요. 편지와 사진은 열람일에 열려요.
        </p>
        <div className="mt-8 grid grid-cols-4 gap-2">
          <TimeUnit value={timer.days} label="일" />
          <TimeUnit value={timer.hours} label="시" />
          <TimeUnit value={timer.minutes} label="분" />
          <TimeUnit value={timer.seconds} label="초" />
        </div>
        <p className="mt-6 text-center text-sm text-stone-500">
          열람일 {formatDateTime(capsule.openAt)}
        </p>
        {capsule.weather ? (
          <div className="mt-6">
            <WeatherSummary weather={capsule.weather} />
          </div>
        ) : null}

        {devMode ? (
          <button
            type="button"
            onClick={() => setForcedOpen(true)}
            className="mt-8 w-full rounded-full bg-emerald-700 px-7 py-3 text-sm font-medium text-emerald-50 shadow-sm transition hover:bg-emerald-800"
          >
            개발자 모드로 바로 열기
          </button>
        ) : (
          <p className="mt-8 text-center text-xs text-stone-400">
            개발자 모드를 켜면 기다리지 않고 열어볼 수 있어요
          </p>
        )}
        <div className="mt-4">
          <DeleteCapsuleButton
            capsule={capsule}
            now={now}
            onDeleted={() => router.replace("/")}
          />
        </div>
        <HomeLink />
      </DetailShell>
    );
  }

  const openedMemory = capsuleMemory(capsule);
  const openedLook = capsuleLook(capsule);

  return (
    <div
      className="min-h-full px-6 py-12"
      style={{
        background: `linear-gradient(180deg, ${openedLook.from} 0%, #faf6f1 42%, #f5f0e8 100%)`,
      }}
    >
      <article className="mx-auto w-full max-w-lg">
        <Header />

        {forcedOpen && !ready ? (
          <p className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-100">
            개발자 모드로 미리 열었어요. 실제 열람일은{" "}
            {formatDateTime(capsule.openAt)}예요.
          </p>
        ) : (
          <p className="mt-5 text-sm font-medium text-amber-800">열린 캡슐</p>
        )}

        <div className="mt-6 flex justify-center">
          <WeatherCapsule look={openedLook} size="lg" seed={capsule.id} />
        </div>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-800">
          To. {capsule.recipient}
        </h1>
        <p className="mt-2 text-sm text-stone-400">
          열람일 {formatDateTime(capsule.openAt)}
        </p>
        {capsule.weather ? (
          <div className="mt-6">
            <WeatherSummary weather={capsule.weather} />
          </div>
        ) : null}
        {openedMemory.line ? (
          <p className="mt-6 break-keep rounded-2xl bg-[#fffaf3] px-4 py-3 text-sm leading-relaxed text-stone-700 ring-1 ring-amber-100">
            {openedMemory.line}
          </p>
        ) : null}
        {openedMemory.keywords.length ? (
          <div className="mt-4">
            <KeywordRow keywords={openedMemory.keywords} />
          </div>
        ) : null}

        {capsule.photoUrls.length > 0 ? (
          <div className="mt-8 flex gap-3 overflow-x-auto pb-2">
            {capsule.photoUrls.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt=""
                className="h-56 w-44 shrink-0 rounded-3xl object-cover shadow-md ring-1 ring-amber-100"
              />
            ))}
          </div>
        ) : null}

        {capsule.letter.trim() ? (
          <div className="mt-8 rounded-[2rem] bg-[#fffaf3] px-7 py-8 shadow-xl shadow-amber-900/10 ring-1 ring-amber-100">
            <p className="text-xs font-medium tracking-[0.2em] text-amber-800/80">
              LETTER
            </p>
            <p className="mt-4 whitespace-pre-wrap text-base leading-8 text-stone-700">
              {capsule.letter}
            </p>
          </div>
        ) : (
          <p className="mt-8 text-sm text-stone-400">
            이 캡슐에는 편지가 없고 사진만 남아 있어요.
          </p>
        )}

        <div className="mt-8">
          <DeleteCapsuleButton
            capsule={capsule}
            now={now}
            onDeleted={() => router.replace("/")}
          />
        </div>

        <HomeLink />
      </article>
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-amber-50 px-1 py-3 ring-1 ring-amber-100">
      <p className="font-mono text-2xl font-semibold tabular-nums text-stone-800">
        {String(value).padStart(2, "0")}
      </p>
      <p className="mt-1 text-[11px] text-stone-500">{label}</p>
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center justify-between">
      <Link
        href="/"
        className="text-sm text-stone-400 transition hover:text-stone-600"
      >
        ← 홈
      </Link>
      <DevModeToggle />
    </div>
  );
}

function HomeLink() {
  return (
    <Link
      href="/"
      className="mt-8 block text-center text-sm text-stone-400 transition hover:text-stone-600"
    >
      홈으로 돌아가기
    </Link>
  );
}

function DetailShell({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: CapsuleLook;
}) {
  return (
    <div
      className={`flex min-h-full flex-1 items-center justify-center px-6 py-16 ${
        tone ? "" : "bg-linear-to-b from-amber-50 via-rose-50 to-stone-100"
      }`}
      style={{
        background: tone
          ? `linear-gradient(180deg, ${tone.from} 0%, #faf6f1 55%, #f5f0e8 100%)`
          : undefined,
      }}
    >
      <main className="w-full max-w-md rounded-3xl bg-white/80 px-8 py-10 text-center shadow-xl shadow-amber-900/10 ring-1 ring-amber-100/80 backdrop-blur-sm">
        {children}
      </main>
    </div>
  );
}
