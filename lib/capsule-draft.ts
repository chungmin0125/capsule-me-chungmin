const DRAFT_KEY = "capsule-trial-draft";

export type CapsuleDraft = {
  recipient?: string;
  letter?: string;
};

export function saveCapsuleDraft(draft: CapsuleDraft) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // 저장에 실패해도 체험은 이어갑니다.
  }
}

export function takeCapsuleDraft(): CapsuleDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(DRAFT_KEY);
    const parsed = JSON.parse(raw) as CapsuleDraft;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}
