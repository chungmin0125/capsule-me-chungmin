"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "@/lib/firebase";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auth.languageCode = "ko";
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithPopup(auth, provider);
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signInWithGoogle, signOut }),
    [user, loading, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function getSignInErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/popup-closed-by-user":
      case "auth/cancelled-popup-request":
        return null;
      case "auth/popup-blocked":
        return "팝업이 차단되었어요. 브라우저에서 팝업을 허용해 주세요.";
      case "auth/unauthorized-domain":
        return "이 도메인은 Firebase에서 허용되지 않았어요.";
      case "auth/operation-not-allowed":
        return "Google 로그인이 Firebase에서 아직 켜져 있지 않아요.";
      default:
        return "로그인에 실패했어요. 잠시 후 다시 시도해 주세요.";
    }
  }

  return "로그인에 실패했어요. 잠시 후 다시 시도해 주세요.";
}
