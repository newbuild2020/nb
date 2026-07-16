'use client';

/**
 * 簡易ログイン(端末内保存)。
 * 注意: クライアント側のみの判定のため、本格的な機密保護が必要に
 * なったら Supabase Auth などのサーバー認証に置き換えること。
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const USER = "newbuild";
const PASS = "newbuild";
const KEY = "nbLoggedIn";

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY) === "1";
}

export function login(user: string, pass: string): boolean {
  if (user === USER && pass === PASS) {
    localStorage.setItem(KEY, "1");
    return true;
  }
  return false;
}

export function logout(): void {
  localStorage.removeItem(KEY);
}

/**
 * ページ守衛。未ログインならホームへリダイレクトする。
 * 戻り値: true=ログイン確認済み / false=確認中または未ログイン
 */
export function useRequireLogin(): boolean {
  const router = useRouter();
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (isLoggedIn()) {
      setOk(true);
    } else {
      router.replace("/");
    }
  }, [router]);
  return ok;
}
