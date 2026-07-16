'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { isLoggedIn, login, logout } from "./lib/auth";

const COMPANY_NAME = "株式会社ニュービルド";

// 定义按钮类型
interface NavButton {
  id: string;
  zh: string;
  ja: string;
  path: string;
  disabled?: boolean;
}

export default function Home() {
  // 语言: zh(中文) 或 ja(日语)
  const [lang, setLang] = useState<'zh' | 'ja'>("zh");
  // null=判定中, false=未登录, true=已登录
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [loginError, setLoginError] = useState("");

  // 文案
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

  // 导航按钮配置
  const navButtons: NavButton[] = [
    {
      id: "namebook",
      zh: "名簿管理",
      ja: "名簿管理",
      path: "/namebook"
    },
    {
      id: "people",
      zh: "人员登记",
      ja: "人員登録",
      path: "/people"
    },
    {
      id: "salary",
      zh: "明细制作",
      ja: "明細作成",
      path: "/salary"
    },
    {
      id: "records",
      zh: "明细查看",
      ja: "明細一覧",
      path: "/salary/records"
    },
    {
      id: "feature4",
      zh: "功能4（开发中）",
      ja: "機能4（開発中）",
      path: "#",
      disabled: true
    },
    {
      id: "feature5",
      zh: "功能5（开发中）",
      ja: "機能5（開発中）",
      path: "#",
      disabled: true
    },
    {
      id: "feature6",
      zh: "功能6（开发中）",
      ja: "機能6（開発中）",
      path: "#",
      disabled: true
    },
    {
      id: "feature7",
      zh: "功能7（开发中）",
      ja: "機能7（開発中）",
      path: "#",
      disabled: true
    },
    {
      id: "feature8",
      zh: "功能8（开发中）",
      ja: "機能8（開発中）",
      path: "#",
      disabled: true
    },
    {
      id: "feature9",
      zh: "功能9（开发中）",
      ja: "機能9（開発中）",
      path: "#",
      disabled: true
    },
    {
      id: "feature10",
      zh: "功能10（开发中）",
      ja: "機能10（開発中）",
      path: "#",
      disabled: true
    }
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black text-black dark:text-white relative">
      {/* 左上角管理入口图标按钮（黑色圆形底，白色图标，极简风格，带动态效果） */}
      <button
        className="fixed top-4 left-4 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-black text-white shadow hover:shadow-lg hover:-translate-y-1 hover:scale-110 active:translate-y-1 transition-all duration-200 group"
        title="管理入口"
        onClick={() => router.push('/admin/login')}
        aria-label="管理入口"
      >
        {/* 建筑/房屋SVG图标（白色，浮动+旋转+发光动画） */}
        <span className="admin-anim-icon">
          <svg
            width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"
            style={{ display: 'block' }}
          >
            <rect x="6" y="13" width="16" height="9" rx="2" fill="#fff" fillOpacity="0.13"/>
            <path d="M4 13L14 5L24 13" stroke="#fff" strokeWidth="2" strokeLinejoin="round"/>
            <rect x="10" y="17" width="4" height="5" rx="1" fill="#fff" fillOpacity="0.35"/>
            <rect x="16" y="17" width="2" height="3" rx="1" fill="#fff" fillOpacity="0.18"/>
          </svg>
        </span>
        <style jsx global>{`
          .admin-anim-icon {
            display: inline-block;
            animation: floatY 2.2s ease-in-out infinite, rotateZ 6s linear infinite;
            filter: drop-shadow(0 0 8px #3b82f6) drop-shadow(0 0 2px #fff);
            will-change: transform, filter;
          }
          @keyframes floatY {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-7px); }
          }
          @keyframes rotateZ {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </button>

      {/* 语言切换 + 退出登录 */}
      <div className="absolute top-4 right-4 flex gap-2 items-center">
        <button
          className={`px-3 py-1.5 rounded-full text-sm border border-gray-300 hover:bg-gray-100 dark:border-[#424245] dark:hover:bg-[#1d1d1f] transition-colors ${
            lang === "zh" ? "bg-gray-100 dark:bg-[#1d1d1f]" : ""
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
            lang === "ja" ? "bg-gray-100 dark:bg-[#1d1d1f]" : ""
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
            className="px-3 py-1.5 rounded-full text-sm border border-gray-300 text-gray-500 hover:bg-gray-100 dark:border-[#424245] dark:hover:bg-[#1d1d1f] transition-colors"
            onClick={handleLogout}
          >
            {t.logout}
          </button>
        )}
      </div>

      {/* 公司名 */}
      <div className="flex flex-col items-center gap-3 mb-12">
        <Image src="/icon-64.png" alt="logo" width={64} height={64} className="rounded-xl" />
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-black dark:text-white text-center px-4">{COMPANY_NAME}</h1>
      </div>

      {authed === null ? null : authed ? (
        /* ==== 已登录: 功能按钮网格 ==== */
        <div className="grid grid-cols-2 gap-4 w-full max-w-2xl px-4">
          {navButtons.map((button) => (
            <button
              key={button.id}
              className={`px-6 py-4 rounded-2xl text-lg font-bold transition-all shadow-md ${
                button.disabled
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-[#1d1d1f] dark:text-[#424245]"
                  : "bg-gradient-to-b from-[#bfc9d1] via-[#e6e8ea] to-[#7a7e83] text-black border border-[#bfc9d1] hover:from-[#e6e8ea] hover:to-[#bfc9d1] active:from-[#7a7e83] active:to-[#bfc9d1]"
              }`}
              style={!button.disabled ? { boxShadow: '0 4px 16px 0 #bfc9d1, 0 1.5px 0 #fff inset' } : {}}
              onClick={() => !button.disabled && router.push(button.path)}
              disabled={button.disabled}
            >
              {lang === "zh" ? button.zh : button.ja}
            </button>
          ))}
        </div>
      ) : (
        /* ==== 未登录: 登录框 ==== */
        <div className="w-full max-w-sm px-4">
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

      {/* 版权信息 */}
      <footer className="w-full mt-20 mb-4 flex justify-center">
        <span className="text-sm text-gray-500">© 2024 株式会社ニュービルド All Rights Reserved.</span>
      </footer>
    </div>
  );
}
