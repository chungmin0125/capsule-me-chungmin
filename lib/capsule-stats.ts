"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getCountFromServer,
  increment,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const STATS_REF = doc(db, "stats", "global");

export function useCapsuleTotalCount() {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let unsub = () => {};

    async function load() {
      try {
        const aggregate = await getCountFromServer(collection(db, "capsules"));
        if (cancelled) return;
        setCount(aggregate.data().count);
        setLoading(false);
        return;
      } catch {
        // 전체 목록을 볼 수 없으면 공개 통계 문서를 봅니다.
      }

      unsub = onSnapshot(
        STATS_REF,
        (snapshot) => {
          if (cancelled) return;
          const value = snapshot.data()?.capsuleCount;
          setCount(typeof value === "number" ? Math.max(0, value) : null);
          setLoading(false);
        },
        () => {
          if (cancelled) return;
          setCount(null);
          setLoading(false);
        },
      );
    }

    void load();

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  return { count, loading };
}

export async function bumpCapsuleCount(delta: number) {
  try {
    await setDoc(
      STATS_REF,
      { capsuleCount: increment(delta) },
      { merge: true },
    );
  } catch {
    // 통계를 못 올려도 캡슐 저장은 계속합니다.
  }
}
