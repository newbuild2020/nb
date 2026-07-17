'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { isLoggedIn, login, logout } from "./lib/auth";

const COMPANY_NAME = "株式会社ニュービルド";

interface NavButton {
  id: string;
  label: string;
  desc: string;
  path: string;
  icon: string;
}

const NAV_BUTTONS: NavButton[] = [
  {
    id: "people",
    label: "人員登録",
    desc: "氏名・生年月日・住所の登録",
    path: "/people",
    icon: "👤",
  },
  {
    id: "salary",
    label: "明細作成",
    desc: "給与・社会保険・所得税の計算",
    path: "/salary",
    icon: "🧮",
  },
  {
    id: "records",
    label: "明細一覧",
    desc: "保存した明細の確認",
    path: "/salary/records",
    icon: "📋",
  },
];

export default function Home() {
  // null=判定中, false=未ログイン, true=ログイン済み
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [loginError, setLoginError] = useState("");

  const router = useRouter();

  useEffect(() => {
    setAuthed(isLoggedIn());
  }, []);

  function handleLogin() {
    if (login(user.trim(), pass)) {
      setAuthed(true);
      setUser("");
      setPass("");
      setLoginError("");
    } else {
      setLoginError("アカウントまたはパスワードが違います");
    }
  }

  function handleLogout() {
    logout();
    setAuthed(false);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-black">
      {/* ヘッダー */}
      <div className="w-full flex justify-end items-center gap-2 px-4 pt-4 sm:px-6">
        {authed && (
          <button
            className="px-3 py-1.5 rounded-full text-sm border border-gray-300 bg-white text-gray-500 hover:bg-gray-100 transition-colors"
            onClick={handleLogout}
          >
            ログアウト
          </button>
        )}
      </div>

      {/* メイン */}
      <main className="flex-1 w-full flex flex-col items-center justify-center px-4 py-10">
        <div className="flex flex-col items-center gap-3 mb-10 sm:mb-12">
          <Image src="/icon-64.png" alt="logo" width={64} height={64} className="rounded-xl shadow-sm" />
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-center">
            {COMPANY_NAME}
          </h1>
        </div>

        {authed === null ? null : authed ? (
          /* ==== ログイン済み: 機能メニュー(スマホ1列 / タブレット・PC3列) ==== */
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 w-full max-w-sm sm:max-w-3xl lg:max-w-4xl">
            {NAV_BUTTONS.map((button) => (
              <button
                key={button.id}
                className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all p-5 sm:p-6 text-left flex sm:flex-col items-center sm:items-start gap-4 sm:gap-3"
                onClick={() => router.push(button.path)}
              >
                <span className="text-3xl sm:text-4xl" aria-hidden>{button.icon}</span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-lg font-bold">{button.label}</span>
                  <span className="text-sm text-gray-500">{button.desc}</span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          /* ==== 未ログイン: ログインフォーム ==== */
          <div className="w-full max-w-sm">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 flex flex-col gap-4">
              <h2 className="text-xl font-bold text-center">ログイン</h2>
              <p className="text-sm text-gray-500 text-center">ログインすると機能が利用できます</p>
              <div>
                <label className="block text-sm text-gray-600 mb-1">アカウント</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={user}
                  autoComplete="username"
                  onChange={(e) => { setUser(e.target.value); setLoginError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">パスワード</label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={pass}
                  autoComplete="current-password"
                  onChange={(e) => { setPass(e.target.value); setLoginError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>
              {loginError && <p className="text-sm text-red-600 text-center">{loginError}</p>}
              <button
                className="w-full py-3 rounded-xl bg-black text-white font-bold hover:opacity-85 transition-opacity"
                onClick={handleLogin}
              >
                ログイン
              </button>
            </div>
          </div>
        )}
      </main>

      {/* フッター */}
      <footer className="w-full mb-4 flex justify-center">
        <span className="text-xs sm:text-sm text-gray-500 px-4 text-center">
          © 2024 株式会社ニュービルド All Rights Reserved.
        </span>
      </footer>
    </div>
  );
}
