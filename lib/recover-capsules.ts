import { addDoc, collection, Timestamp } from "firebase/firestore";
import { getDownloadURL, listAll, ref } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import type { Capsule } from "@/lib/capsules";

const FILE_NAME = /^(\d+)_(\d+)\.[a-z0-9]+$/i;

export async function recoverOrphanedCapsules(
  uid: string,
  existing: Capsule[],
) {
  const listed = await listAll(ref(storage, `capsules/${uid}`));
  const groups = new Map<string, { index: number; fullPath: string }[]>();

  for (const item of listed.items) {
    const match = item.name.match(FILE_NAME);
    if (!match) continue;
    const storageKey = match[1];
    const group = groups.get(storageKey) ?? [];
    group.push({ index: Number(match[2]), fullPath: item.fullPath });
    groups.set(storageKey, group);
  }

  let created = 0;

  for (const [storageKey, files] of groups) {
    if (alreadyTracked(existing, storageKey)) continue;

    files.sort((a, b) => a.index - b.index);
    const photoUrls = await Promise.all(
      files.map((file) => getDownloadURL(ref(storage, file.fullPath))),
    );

    const createdAtMs = Number(storageKey);
    await addDoc(collection(db, "capsules"), {
      ownerUid: uid,
      recipient: "복구한 캡슐",
      letter: "",
      photoUrls,
      storageKey,
      recoveredFromStorage: true,
      openAt: Timestamp.fromMillis(createdAtMs),
      createdAt: Timestamp.fromMillis(createdAtMs),
    });
    created += 1;
  }

  return created;
}

function alreadyTracked(existing: Capsule[], storageKey: string) {
  return existing.some((capsule) => {
    if (capsule.storageKey === storageKey) return true;
    return capsule.photoUrls.some((url) => includesStorageKey(url, storageKey));
  });
}

function includesStorageKey(url: string, storageKey: string) {
  const token = `${storageKey}_`;
  if (url.includes(token)) return true;
  try {
    return decodeURIComponent(url).includes(token);
  } catch {
    return false;
  }
}
