"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp, Timestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useAuth } from "@/components/auth-provider";
import { db, storage } from "@/lib/firebase";

const MAX_PHOTOS = 10;
const HOME_DELAY_MS = 2200;

function fileExtension(file: File) {
  const dot = file.name.lastIndexOf(".");
  if (dot !== -1 && dot < file.name.length - 1) {
    const ext = file.name.slice(dot + 1).toLowerCase();
    if (/^[a-z0-9]+$/.test(ext)) return ext;
  }

  const mimeExt = file.type.split("/")[1]?.toLowerCase();
  if (mimeExt && /^[a-z0-9]+$/.test(mimeExt)) {
    return mimeExt === "jpeg" ? "jpg" : mimeExt;
  }

  return "bin";
}

function toLocalInputValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatOpenAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export default function NewCapsulePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [recipient, setRecipient] = useState("");
  const [letter, setLetter] = useState("");
  const [openAt, setOpenAt] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    recipient?: string;
    letter?: string;
    openAt?: string;
  }>({});

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  useEffect(() => {
    if (!done) return;
    const timer = window.setTimeout(() => {
      router.replace("/?buried=1");
    }, HOME_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [done, router]);

  function validate() {
    const next: typeof fieldErrors = {};
    if (!recipient.trim()) next.recipient = "받는 사람을 적어 주세요.";
    if (!letter.trim()) next.letter = "편지를 적어 주세요.";
    if (!openAt) {
      next.openAt = "열람일을 정해 주세요.";
    } else if (new Date(openAt).getTime() <= Date.now()) {
      next.openAt = "열람일은 지금보다 나중이어야 해요.";
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  function addFiles(selected: File[]) {
    const images = selected.filter((file) => file.type.startsWith("image/"));
    setFiles((prev) => {
      const room = MAX_PHOTOS - prev.length;
      if (room <= 0) return prev;
      return [...prev, ...images.slice(0, room)];
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, current) => current !== index));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (loading) return;
    if (!user) {
      alert("로그인 먼저");
      return;
    }
    if (!validate()) return;

    setSubmitting(true);
    setUploadedCount(0);
    try {
      const timestamp = Date.now();
      const urls: string[] = [];

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const path = `capsules/${user.uid}/${timestamp}_${index}.${fileExtension(file)}`;
        const fileRef = ref(storage, path);
        await uploadBytes(fileRef, file, {
          contentType: file.type || undefined,
        });
        urls.push(await getDownloadURL(fileRef));
        setUploadedCount(index + 1);
      }

      await addDoc(collection(db, "capsules"), {
        ownerUid: user.uid,
        recipient: recipient.trim(),
        letter: letter.trim(),
        photoUrls: urls,
        storageKey: String(timestamp),
        openAt: Timestamp.fromDate(new Date(openAt)),
        createdAt: serverTimestamp(),
      });

      console.log(urls);
      setDone(true);
    } catch {
      setError("캡슐을 묻지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <PageShell>
        <p className="text-sm font-medium text-amber-800">묻기 완료</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-800">
          캡슐을 묻었어요
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-stone-500">
          {recipient.trim() || "받는 사람"}에게 보내는 캡슐을 잘 묻어 두었어요.
          {openAt ? (
            <>
              <br />
              열람일은 {formatOpenAt(openAt)}예요.
            </>
          ) : null}
        </p>
        <p className="mt-6 text-sm text-stone-400">
          잠시 후 처음 화면으로 이동해요
        </p>
        <button
          type="button"
          onClick={() => router.replace("/?buried=1")}
          className="mt-8 w-full rounded-full bg-amber-800 px-7 py-3 text-sm font-medium text-amber-50 shadow-sm transition hover:bg-amber-900"
        >
          홈으로 가기
        </button>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="text-sm text-stone-400 transition hover:text-stone-600"
        >
          ← 홈
        </Link>
        {user ? (
          <p className="truncate text-xs text-stone-400">
            {user.displayName ?? user.email}
          </p>
        ) : (
          <p className="text-xs text-rose-500">로그인이 필요해요</p>
        )}
      </div>

      <h1 className="mt-5 text-3xl font-semibold tracking-tight text-stone-800">
        캡슐 묻기
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-stone-500">
        사진과 편지를 넣고 열람일을 정해 주세요
      </p>

      {!loading && !user ? (
        <p className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
          로그인해야 캡슐을 묻을 수 있어요.{" "}
          <Link href="/" className="font-medium underline underline-offset-2">
            홈에서 로그인
          </Link>
        </p>
      ) : null}

      <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-left text-sm font-medium text-stone-600">
          받는 사람
          <input
            type="text"
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
            placeholder="누구에게 보낼까요?"
            disabled={submitting}
            className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-normal text-stone-800 outline-none ring-amber-200 transition placeholder:text-stone-300 focus:ring-2 disabled:opacity-60"
          />
          {fieldErrors.recipient ? (
            <span className="font-normal text-rose-600">
              {fieldErrors.recipient}
            </span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2 text-left text-sm font-medium text-stone-600">
          <span className="flex items-center justify-between">
            편지
            <span className="font-normal text-xs text-stone-400">
              {letter.length}자
            </span>
          </span>
          <textarea
            value={letter}
            onChange={(event) => setLetter(event.target.value)}
            rows={6}
            placeholder="지금 하고 싶은 말을 남겨 주세요"
            disabled={submitting}
            className="resize-y rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-normal text-stone-800 outline-none ring-amber-200 transition placeholder:text-stone-300 focus:ring-2 disabled:opacity-60"
          />
          {fieldErrors.letter ? (
            <span className="font-normal text-rose-600">{fieldErrors.letter}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2 text-left text-sm font-medium text-stone-600">
          열람일
          <input
            type="datetime-local"
            value={openAt}
            min={toLocalInputValue(new Date())}
            onChange={(event) => setOpenAt(event.target.value)}
            disabled={submitting}
            className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-normal text-stone-800 outline-none ring-amber-200 transition focus:ring-2 disabled:opacity-60"
          />
          {fieldErrors.openAt ? (
            <span className="font-normal text-rose-600">{fieldErrors.openAt}</span>
          ) : (
            <span className="font-normal text-xs text-stone-400">
              이 시간이 되어야 캡슐을 열 수 있어요
            </span>
          )}
        </label>

        <div className="flex flex-col gap-2 text-left text-sm font-medium text-stone-600">
          <span className="flex items-center justify-between">
            사진
            <span className="font-normal text-xs text-stone-400">
              {files.length}/{MAX_PHOTOS}
            </span>
          </span>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            disabled={submitting || files.length >= MAX_PHOTOS}
            onChange={(event) =>
              addFiles(Array.from(event.target.files ?? []))
            }
            className="sr-only"
          />

          <button
            type="button"
            disabled={submitting || files.length >= MAX_PHOTOS}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/60 px-4 py-6 text-sm font-normal text-amber-900 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {files.length >= MAX_PHOTOS
              ? "사진은 최대 10장까지 넣을 수 있어요"
              : files.length > 0
                ? "사진 더 넣기"
                : "사진 선택하기"}
          </button>

          {previews.length > 0 ? (
            <div className="flex flex-wrap gap-3 pt-1">
              {previews.map((src, index) => (
                <div key={`${src}-${index}`} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    className="h-20 w-20 rounded-2xl object-cover ring-1 ring-amber-100"
                  />
                  <button
                    type="button"
                    aria-label="사진 삭제"
                    disabled={submitting}
                    onClick={() => removeFile(index)}
                    className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-stone-800 text-xs text-white shadow-sm transition hover:bg-stone-700 disabled:opacity-50"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-normal text-xs text-stone-400">
              고른 사진은 바로 보이고, 원하지 않으면 눌러서 뺄 수 있어요
            </p>
          )}
        </div>

        {error ? (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting || loading}
          className="mt-2 rounded-full bg-amber-800 px-7 py-3 text-sm font-medium text-amber-50 shadow-sm transition hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting
            ? files.length > 0
              ? `묻는 중.. ${uploadedCount}/${files.length}`
              : "묻는 중.."
            : "캡슐 묻기"}
        </button>
      </form>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-linear-to-b from-amber-50 via-rose-50 to-stone-100 px-6 py-16">
      <main className="w-full max-w-md rounded-3xl bg-white/80 px-8 py-10 shadow-xl shadow-amber-900/10 ring-1 ring-amber-100/80 backdrop-blur-sm">
        {children}
      </main>
    </div>
  );
}
