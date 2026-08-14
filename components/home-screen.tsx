"use client";

import { useState } from "react";
import Link from "next/link";
import { getSignInErrorMessage, useAuth } from "@/components/auth-provider";
import { CapsuleDashboard } from "@/components/capsule-dashboard";
import { DevModeToggle, useDevMode } from "@/components/dev-mode";

export function HomeScreen({ justBuried = false }: { justBuried?: boolean }) {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setError(null);
    setPending(true);
    try {
      await signInWithGoogle();
    } catch (caught) {
      setError(getSignInErrorMessage(caught));
    } finally {
      setPending(false);
    }
  }

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

  if (!loading && user) {
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

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-linear-to-b from-amber-50 via-rose-50 to-stone-100 px-6 py-16">
      <main className="w-full max-w-md rounded-3xl bg-white/80 px-10 py-14 text-center shadow-xl shadow-amber-900/10 ring-1 ring-amber-100/80 backdrop-blur-sm">
        <h1 className="text-5xl font-semibold tracking-tight text-stone-800">
          캡슐 미
        </h1>
        <p className="mt-5 text-base leading-relaxed text-stone-500">
          사진과 편지를 묻고 열람일에 함께 열어요
        </p>

        {loading ? (
          <p className="mt-10 text-sm text-stone-400">잠시만요...</p>
        ) : (
          <SignedOutView
            pending={pending}
            error={error}
            onSignIn={handleGoogleSignIn}
          />
        )}
      </main>
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
    <div className="min-h-full flex-1 bg-linear-to-b from-amber-50 via-rose-50 to-stone-100 px-6 py-10">
      <div className="mx-auto w-full max-w-3xl">
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

        <CapsuleDashboard />
      </div>
    </div>
  );
}

function SignedOutView({
  pending,
  error,
  onSignIn,
}: {
  pending: boolean;
  error: string | null;
  onSignIn: () => void;
}) {
  return (
    <div className="mt-10">
      <p className="text-sm text-stone-500">Google 계정으로 시작해 주세요</p>
      <button
        type="button"
        onClick={onSignIn}
        disabled={pending}
        className="mt-5 inline-flex w-full items-center justify-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-medium text-stone-700 shadow-sm ring-1 ring-stone-200 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleMark />
        {pending ? "로그인 중..." : "Google로 계속하기"}
      </button>
      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
