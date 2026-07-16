'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { isLoggedIn, login, logout } from "./lib/auth";

const COMPANY_NAME = "株式会社ニュービルド";

interface NavButton {
  id: string;
  zh: string;
  ja: string;
  descZh: string;
  descJa: string;
  path: string;
  icon: string;
}

export default function Home() {
  // 语言: zh(中文) 或 ja(日语)
  const [lang, setLang] = useState<'zh' | 'ja'>("zh");
  // null=判定中, false=未登录, true=已登录
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [loginError, setLoginError] = useState("");

  const texts = {
    zh: {
      loginTitle: "登录",
      loginBtn: "登录",
      logout: "退出登录",
      user: "账号",
      pass: "密码",
      loginError: "账号或密码错误",
      loginHint: "请登录后使用系统功能",
    },
    ja: {
      loginTitle: "ログイン",
      loginBtn: "ログイン",
      logout: "ログアウト",
      user: "アカウント",
      pass: "パスワード",
      loginError: "アカウントまたはパスワードが違います",
      loginHint: "ログインすると機能が利用できます",
    },
  };
  const t = texts[lang];

  const router = useRouter();

  const navButtons: NavButton[] = [
    {
      id: "people",
      zh: "人员登记",
      ja: "人員登録",
      descZh: "登记姓名・生日・地址",
      descJa: "氏名・生年月日・住所の登録",
      path: "/people",
      icon: "👤",
    },
    {
      id: "salary",
      zh: "明细制作",
      ja: "明細作成",
      descZh: "计算工资・保险・所得税",
      descJa: "給与・社会保険・所得税の計算",
      path: "/salary",
      icon: "🧮",
    },
    {
      id: "records",
      zh: "明细查看",
      ja: "明細一覧",
      descZh: "查看过往保存的明细",
      descJa: "保存した明細の確認",
      path: "/salary/records",
      icon: "📋",
    },
  ];

  useEffect(() => {
    const savedLang = localStorage.getItem("lang");
    if (savedLang === "zh" || savedLang === "ja") {
      setLang(savedLang);
    }
    setAuthed(isLoggedIn());
  }, []);

  function handleLogin() {
    if (login(user.trim(), pass)) {
      setAuthed(true);
      setUser("");
      setPass("");
      setLoginError("");
    } else {
      setLoginError(t.loginError);
    }
  }

  function handleLogout() {
    logout();
    setAuthed(false);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-black text-black dark:text-white">
      {/* ヘッダー: 言語切替 + ログアウト */}
      <div className="w-full flex justify-end items-center gap-2 px-4 pt-4 sm:px-6">
        <button
          className={`px-3 py-1.5 rounded-full text-sm border border-gray-300 hover:bg-gray-100 dark:border-[#424245] dark:hover:bg-[#1d1d1f] transition-colors ${
            lang === "zh" ? "bg-gray-200 dark:bg-[#1d1d1f]" : "bg-white dark:bg-black"
          }`}
          onClick={() => {
            setLang("zh");
            localStorage.setItem("lang", "zh");
          }}
        >
          中文
        </button>
        <button
          className={`px-3 py-1.5 rounded-full text-sm border border-gray-300 hover:bg-gray-100 dark:border-[#424245] dark:hover:bg-[#1d1d1f] transition-colors ${
            lang === "ja" ? "bg-gray-200 dark:bg-[#1d1d1f]" : "bg-white dark:bg-black"
          }`}
          onClick={() => {
            setLang("ja");
            localStorage.setItem("lang", "ja");
          }}
        >
          日本語
        </button>
        {authed && (
          <button
            className="px-3 py-1.5 rounded-full text-sm border border-gray-300 bg-white text-gray-500 hover:bg-gray-100 dark:bg-black dark:border-[#424245] dark:hover:bg-[#1d1d1f] transition-colors"
            onClick={handleLogout}
          >
            {t.logout}
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
          /* ==== 已登录: 功能按钮(手机1列 / iPad・电脑3列) ==== */
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 w-full max-w-sm sm:max-w-3xl lg:max-w-4xl">
            {navButtons.map((button) => (
              <button
                key={button.id}
                className="bg-white dark:bg-[#1d1d1f] border border-gray-200 dark:border-[#424245] rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all p-5 sm:p-6 text-left flex sm:flex-col items-center sm:items-start gap-4 sm:gap-3"
                onClick={() => router.push(button.path)}
              >
                <span className="text-3xl sm:text-4xl" aria-hidden>{button.icon}</span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-lg font-bold">{lang === "zh" ? button.zh : button.ja}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {lang === "zh" ? button.descZh : button.descJa}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          /* ==== 未登录: 登录框 ==== */
          <div className="w-full max-w-sm">
            <div className="bg-white dark:bg-[#1d1d1f] border border-gray-200 dark:border-[#424245] rounded-2xl shadow-lg p-6 flex flex-col gap-4">
              <h2 className="text-xl font-bold text-center">{t.loginTitle}</h2>
              <p className="text-sm text-gray-500 text-center">{t.loginHint}</p>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t.user}</label>
                <input
                  className="w-full border border-gray-300 dark:border-[#424245] rounded-lg px-3 py-2.5 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={user}
                  autoComplete="username"
                  onChange={(e) => { setUser(e.target.value); setLoginError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t.pass}</label>
                <input
                  type="password"
                  className="w-full border border-gray-300 dark:border-[#424245] rounded-lg px-3 py-2.5 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={pass}
                  autoComplete="current-password"
                  onChange={(e) => { setPass(e.target.value); setLoginError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>
              {loginError && <p className="text-sm text-red-600 text-center">{loginError}</p>}
              <button
                className="w-full py-3 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold hover:opacity-85 transition-opacity"
                onClick={handleLogin}
              >
                {t.loginBtn}
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
