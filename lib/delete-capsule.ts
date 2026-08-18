import { deleteDoc, doc } from "firebase/firestore";
import { deleteObject, listAll, ref } from "firebase/storage";
import { bumpCapsuleCount } from "@/lib/capsule-stats";
import { db, storage } from "@/lib/firebase";
import type { Capsule } from "@/lib/capsules";

export async function deleteCapsule(capsule: Capsule) {
  await deleteCapsulePhotos(capsule);
  await deleteDoc(doc(db, "capsules", capsule.id));
  await bumpCapsuleCount(-1);
}

async function deleteCapsulePhotos(capsule: Capsule) {
  const deleted = new Set<string>();

  try {
    const listed = await listAll(ref(storage, `capsules/${capsule.ownerUid}`));
    for (const item of listed.items) {
      if (!shouldDeleteStorageItem(capsule, item.name, item.fullPath)) continue;
      await deleteObject(item);
      deleted.add(item.fullPath);
    }
  } catch {
    // list 권한이 없으면 URL로 직접 삭제합니다.
  }

  await Promise.all(
    capsule.photoUrls.map(async (url) => {
      try {
        const fileRef = ref(storage, url);
        if (deleted.has(fileRef.fullPath)) return;
        await deleteObject(fileRef);
      } catch {
        // 이미 없거나 URL 파싱에 실패한 파일은 건너뜁니다.
      }
    }),
  );
}

function shouldDeleteStorageItem(
  capsule: Capsule,
  fileName: string,
  fullPath: string,
) {
  if (capsule.storageKey && fileName.startsWith(`${capsule.storageKey}_`)) {
    return true;
  }

  return capsule.photoUrls.some((url) => {
    try {
      return decodeURIComponent(url).includes(fullPath) || url.includes(fileName);
    } catch {
      return url.includes(fileName);
    }
  });
}
