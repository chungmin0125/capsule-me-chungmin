"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { CapsuleDashboard } from "@/components/capsule-dashboard";
import { DevModeToggle, useDevMode } from "@/components/dev-mode";
import { LoginDialog } from "@/components/login-dialog";
import { LiveWeatherCard } from "@/components/live-weather";
import { WeatherCapsule } from "@/components/weather-capsule";
import { lookFromWeather } from "@/lib/capsule-memory";
import { useCapsuleTotalCount } from "@/lib/capsule-stats";
import { saveCapsuleDraft } from "@/lib/capsule-draft";

export function HomeScreen({ justBuried = false }: { justBuried?: boolean }) {
  const { user, loading, signOut } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    setError(null);
    setPending(true);
    try {
      await signOut();
    } catch {
      setError("로그아웃에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-linear-to-b from-amber-50 via-rose-50 to-stone-100 px-6 py-16">
        <p className="text-sm text-stone-400">잠시만요...</p>
      </div>
    );
  }

  if (user) {
    return (
      <DashboardHome
        displayName={user.displayName}
        email={user.email}
        photoURL={user.photoURL}
        pending={pending}
        error={error}
        justBuried={justBuried}
        onSignOut={handleSignOut}
      />
    );
  }

  return <GuestHome />;
}

function GuestHome() {
  const router = useRouter();
  const { count, loading: countLoading } = useCapsuleTotalCount();
  const [recipient, setRecipient] = useState("");
  const [letter, setLetter] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const look = lookFromWeather(null);

  function startTrial() {
    saveCapsuleDraft({ recipient, letter });
    router.push("/new");
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-linear-to-b from-amber-50 via-rose-50 to-stone-100 px-6 py-16">
      <main className="w-full max-w-md rounded-3xl bg-white/80 px-8 py-12 text-center shadow-xl shadow-amber-900/10 ring-1 ring-amber-100/80 backdrop-blur-sm">
        <p className="text-sm text-stone-400">타임캡슐</p>
        <h1 className="mt-1 text-5xl font-semibold tracking-tight text-stone-800">
          캡슐 미
        </h1>
        <p className="mt-4 text-base leading-relaxed text-stone-500">
          사진과 편지를 묻고 열람일에 함께 열어요
        </p>

        <div className="mt-8 flex justify-center">
          <WeatherCapsule look={look} seed="home-guest" />
        </div>

        <CapsuleCount count={count} loading={countLoading} />

        <form
          className="mt-8 flex flex-col gap-3 text-left"
          onSubmit={(event) => {
            event.preventDefault();
            startTrial();
          }}
        >
          <label className="flex flex-col gap-2 text-sm font-medium text-stone-600">
            받는 사람
            <input
              type="text"
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              placeholder="누구에게 보낼까요?"
              className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-normal text-stone-800 outline-none ring-amber-200 transition placeholder:text-stone-300 focus:ring-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-stone-600">
            편지
            <textarea
              value={letter}
              onChange={(event) => setLetter(event.target.value)}
              rows={4}
              placeholder="지금 하고 싶은 말을 남겨 주세요"
              className="resize-y rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-normal text-stone-800 outline-none ring-amber-200 transition placeholder:text-stone-300 focus:ring-2"
            />
          </label>
          <button
            type="submit"
            className="mt-2 rounded-full bg-amber-800 px-7 py-3 text-sm font-medium text-amber-50 shadow-sm transition hover:bg-amber-900"
          >
            캡슐 묻어보기
          </button>
        </form>

        <p className="mt-4 break-keep text-xs leading-5 text-stone-400">
          열람일과 사진을 고른 뒤, 묻을 때 로그인하면 돼요
        </p>

        <button
          type="button"
          onClick={() => setLoginOpen(true)}
          className="mt-5 text-sm text-stone-400 underline-offset-2 transition hover:text-stone-600 hover:underline"
        >
          이미 묻은 캡슐이 있다면 로그인
        </button>
      </main>

      <LoginDialog
        open={loginOpen}
        title="내 캡슐을 보려면 로그인해요"
        description="Google 계정으로 들어오면 지금까지 묻어 둔 캡슐을 다시 볼 수 있어요."
        onClose={() => setLoginOpen(false)}
      />
    </div>
  );
}

function CapsuleCount({
  count,
  loading,
}: {
  count: number | null;
  loading: boolean;
}) {
  if (loading) {
    return <p className="mt-6 text-sm text-stone-400">묻힌 캡슐을 세는 중...</p>;
  }

  if (count == null) {
    return (
      <p className="mt-6 break-keep text-sm leading-6 text-stone-500">
        지금 이 순간에도 누군가의 오늘이 묻히고 있어요
      </p>
    );
  }

  if (count === 0) {
    return (
      <p className="mt-6 break-keep text-sm leading-6 text-stone-500">
        아직 묻힌 캡슐이 없어요. 첫 캡슐을 남겨 보세요.
      </p>
    );
  }

  return (
    <div className="mt-6">
      <p className="text-sm text-stone-400">지금까지 묻힌 캡슐</p>
      <p className="mt-1 text-4xl font-semibold tracking-tight text-amber-900">
        {count.toLocaleString("ko-KR")}
      </p>
      <p className="mt-1 text-sm text-stone-500">개의 오늘이 잠들어 있어요</p>
    </div>
  );
}

function DashboardHome({
  displayName,
  email,
  photoURL,
  pending,
  error,
  justBuried,
  onSignOut,
}: {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  pending: boolean;
  error: string | null;
  justBuried: boolean;
  onSignOut: () => void;
}) {
  const { devMode } = useDevMode();
  const name = displayName ?? email ?? "친구";

  return (
    <div className="min-h-full flex-1 bg-linear-to-b from-sky-100 via-amber-50 to-stone-200 px-6 py-10">
      <div className="mx-auto w-full max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-stone-400">타임캡슐</p>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-800">
              캡슐 미
            </h1>
          </div>
          <DevModeToggle />
        </header>

        {devMode ? (
          <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-100">
            개발자 모드예요. 잠긴 캡슐도 상세 화면에서 바로 열 수 있어요.
          </p>
        ) : null}

        {justBuried ? (
          <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-100">
            캡슐을 잘 묻어 두었어요. 아래에서 바로 확인할 수 있어요.
          </p>
        ) : null}

        <section className="mt-6 flex items-center justify-between gap-3 rounded-3xl bg-white/80 px-4 py-2.5 shadow-sm ring-1 ring-amber-100/80">
          <div className="flex min-w-0 items-center gap-3">
            {photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoURL}
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-amber-100"
                referrerPolicy="no-referrer"
              />
            ) : null}
            <p className="truncate text-sm font-medium text-stone-800">
              {name}님
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/new"
              className="inline-flex items-center justify-center rounded-full bg-amber-800 px-4 py-2 text-sm font-medium whitespace-nowrap text-amber-50 shadow-sm transition hover:bg-amber-900"
            >
              캡슐 묻기
            </Link>
            <button
              type="button"
              onClick={onSignOut}
              disabled={pending}
              className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-medium whitespace-nowrap text-stone-700 ring-1 ring-stone-300 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "로그아웃 중..." : "로그아웃"}
            </button>
          </div>
        </section>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

        <LiveWeatherCard />

        <CapsuleDashboard />
      </div>
    </div>
  );
}
