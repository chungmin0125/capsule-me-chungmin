"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import {
  formatCountdown,
  isOpenable,
  remainingMs,
  type Capsule,
} from "@/lib/capsules";
import { deleteCapsule } from "@/lib/delete-capsule";

export function DeleteCapsuleButton({
  capsule,
  now,
  onDeleted,
  compact = false,
}: {
  capsule: Capsule;
  now: number;
  onDeleted?: () => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locked = !isOpenable(capsule, now);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await deleteCapsule(capsule);
      setOpen(false);
      onDeleted?.();
    } catch {
      setError("캡슐을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setDeleting(false);
    }
  }

  const dialog =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 px-5"
            onClick={() => {
              if (!deleting) setOpen(false);
            }}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby={`delete-capsule-${capsule.id}`}
              className="w-full max-w-[22rem] rounded-3xl bg-white px-6 py-7 text-left shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="text-xs font-medium text-rose-700">
                {locked ? "열람 전에 삭제" : "캡슐 삭제"}
              </p>
              <h2
                id={`delete-capsule-${capsule.id}`}
                className="mt-2 break-keep text-xl font-semibold leading-snug text-stone-800"
              >
                캡슐을 삭제할까요?
              </h2>
              {capsule.recipient ? (
                <p className="mt-1 break-keep text-sm leading-6 text-stone-500">
                  To. {capsule.recipient}
                </p>
              ) : null}

              {locked ? (
                <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3.5 text-sm leading-6 text-rose-800 ring-1 ring-rose-100">
                  <p className="break-keep">아직 열람일이 남았어요.</p>
                  <p className="mt-1 break-keep font-medium">
                    {formatCountdown(remainingMs(capsule, now))}
                  </p>
                  <p className="mt-2 break-keep">
                    삭제하면 편지와 사진을 되돌릴 수 없어요.
                  </p>
                </div>
              ) : (
                <p className="mt-4 break-keep text-sm leading-6 text-stone-500">
                  편지와 사진이 함께 사라지고, 되돌릴 수 없어요.
                </p>
              )}

              {error ? (
                <p className="mt-3 break-keep text-sm leading-6 text-rose-600">
                  {error}
                </p>
              ) : null}

              <div className="mt-6 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setOpen(false)}
                  className="whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium text-stone-500 ring-1 ring-stone-200 transition hover:bg-stone-50 disabled:opacity-60"
                >
                  취소
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="whitespace-nowrap rounded-full bg-rose-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-800 disabled:opacity-60"
                >
                  {deleting ? "삭제 중..." : locked ? "그래도 삭제" : "삭제"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setError(null);
          setOpen(true);
        }}
        className={
          compact
            ? "rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-stone-600 ring-1 ring-stone-200 transition hover:bg-rose-50 hover:text-rose-700"
            : "w-full rounded-full px-7 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-50"
        }
      >
        삭제
      </button>
      {dialog}
    </>
  );
}
