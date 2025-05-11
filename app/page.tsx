"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { useState as UseStateType } from 'react';

const COMPANY_NAME = "株式会社ニュービルド";
const SITE_NAME = "人员管理系统";

// 定义用户信息类型
interface UserInfo {
  firstName: string;
  lastName: string;
  firstNameFurigana: string;
  lastNameFurigana: string;
  firstNameRomaji: string;
  lastNameRomaji: string;
  gender: string;
  birth: string;
  nationality: string;
  jobs?: string[];
  address?: string;
  selectedChome?: string;
  detailAddress?: string;
  phone?: string;
  // 可根据需要继续补充
}

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

  // 文案
  const texts = {
    zh: {
      login: "管理员登录",
      loginTitle: "管理员登录",
      loginBtn: "登录",
      user: "账号",
      pass: "密码",
      namebook: "名簿登陆",
      site: SITE_NAME,
    },
    ja: {
      login: "管理者ログイン",
      loginTitle: "管理者ログイン",
      loginBtn: "ログイン",
      user: "アカウント",
      pass: "パスワード",
      namebook: "新規名簿登録",
      site: "名簿管理システム",
    },
  };

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
      id: "feature2",
      zh: "功能2（开发中）",
      ja: "機能2（開発中）",
      path: "#",
      disabled: true
    },
    {
      id: "feature3",
      zh: "功能3（开发中）",
      ja: "機能3（開発中）",
      path: "#",
      disabled: true
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

  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [adminError, setAdminError] = useState("");

  function handleAdminLogin() {
    if (adminUser === "admin" && adminPass === "admin") {
      setShowAdminLogin(false);
      setAdminUser("");
      setAdminPass("");
      setAdminError("");
      router.push("/admin/dashboard");
    } else {
      setAdminError("账号或密码错误");
    }
  }

  useEffect(() => {
    const savedLang = localStorage.getItem("lang");
    if (savedLang === "zh" || savedLang === "ja") {
      setLang(savedLang);
    }
  }, []);

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

      {/* 语言切换 */}
      <div className="absolute top-4 right-4 flex gap-2">
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
      </div>
      {/* 公司名和网站名 */}
      <div className="flex flex-col items-center gap-2 mb-16">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-2 text-black dark:text-white">{COMPANY_NAME}</h1>
      </div>
      {/* 导航按钮网格 */}
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
      {/* 版权信息 */}
      <footer className="w-full mt-20 mb-4 flex justify-center">
        <span className="text-sm text-gray-500">© 2024 株式会社ニュービルド All Rights Reserved.</span>
      </footer>
    </div>
  );
}
