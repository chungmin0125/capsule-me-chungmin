"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { getSignInErrorMessage, useAuth } from "@/components/auth-provider";

export function LoginDialog({
  open,
  title,
  description,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
}) {
  const { signInWithGoogle } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open || typeof document === "undefined") return null;

  async function handleSignIn() {
    setError(null);
    setPending(true);
    try {
      await signInWithGoogle();
    } catch (caught) {
      const message = getSignInErrorMessage(caught);
      if (message) setError(message);
      setPending(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 px-5"
      onClick={() => {
        if (!pending) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-dialog-title"
        className="w-full max-w-[22rem] rounded-3xl bg-white px-6 py-7 text-left shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-xs font-medium text-amber-800">로그인</p>
        <h2
          id="login-dialog-title"
          className="mt-2 break-keep text-xl font-semibold leading-snug text-stone-800"
        >
          {title}
        </h2>
        <p className="mt-3 break-keep text-sm leading-6 text-stone-500">
          {description}
        </p>

        <button
          type="button"
          onClick={handleSignIn}
          disabled={pending}
          className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-medium text-stone-700 shadow-sm ring-1 ring-stone-200 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <GoogleMark />
          {pending ? "로그인 중..." : "Google로 계속하기"}
        </button>

        {error ? (
          <p className="mt-3 break-keep text-sm leading-6 text-rose-600">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          disabled={pending}
          onClick={onClose}
          className="mt-3 w-full rounded-full px-4 py-2.5 text-sm font-medium text-stone-400 transition hover:text-stone-600 disabled:opacity-60"
        >
          나중에
        </button>
      </div>
    </div>,
    document.body,
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
