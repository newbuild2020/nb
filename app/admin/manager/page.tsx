"use client";
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OutlineButton from "./OutlineButton";

export default function ManagerDashboard() {
  const router = useRouter();
  const [lang, setLang] = useState<'zh' | 'ja'>("zh");
  const [showLangSwitch, setShowLangSwitch] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 文案
  const texts = {
    zh: {
      title: "管理员控制台",
      welcome: "欢迎使用管理系统",
      noPermission: "请先登录",
      backToLogin: "返回登录",
    },
    ja: {
      title: "管理者コンソール",
      welcome: "管理システムへようこそ",
      noPermission: "ログインしてください",
      backToLogin: "ログインに戻る",
    },
  };

  useEffect(() => {
    // 检查登录状态和语言权限
    const adminStr = localStorage.getItem("currentAdmin");
    if (!adminStr) {
      setIsLoggedIn(false);
      return;
    }

    try {
      const admin = JSON.parse(adminStr);
      setIsLoggedIn(true);

      // 设置语言权限
      if (Array.isArray(admin.langs)) {
        if (admin.langs.length === 1) {
          // 如果只有一种语言权限,强制使用该语言
          setLang(admin.langs[0]);
          setShowLangSwitch(false);
        } else {
          // 如果有多种语言权限,显示语言切换按钮
          setShowLangSwitch(true);
          // 默认使用中文(如果可用),否则使用日语
          if (admin.langs.includes("zh")) {
            setLang("zh");
          } else if (admin.langs.includes("ja")) {
            setLang("ja");
          }
        }
      }
    } catch (error) {
      console.error("Failed to parse admin info:", error);
      setIsLoggedIn(false);
    }
  }, []);

  // 处理语言切换
  const handleLangChange = (newLang: 'zh' | 'ja') => {
    setLang(newLang);
    localStorage.setItem("lang", newLang);
  };

  // 如果未登录,显示提示信息
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{texts[lang].noPermission}</h1>
          <button
            className="px-4 py-2 rounded font-medium bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 hover:bg-neutral-300 dark:hover:bg-neutral-600 border border-neutral-300 dark:border-neutral-700"
            onClick={() => router.push("/namebook")}
          >
            {texts[lang].backToLogin}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
      {/* 语言切换（仅多语言时显示） */}
      {showLangSwitch && (
        <div className="absolute top-4 right-4 flex gap-2 z-50">
          <OutlineButton
            className={`px-3 py-1.5 rounded-full text-sm border font-bold ${lang === 'zh' ? 'border-2' : ''}`}
            onClick={() => handleLangChange("zh")}
          >
            中文
          </OutlineButton>
          <OutlineButton
            className={`px-3 py-1.5 rounded-full text-sm border font-bold ${lang === 'ja' ? 'border-2' : ''}`}
            onClick={() => handleLangChange("ja")}
          >
            日本語
          </OutlineButton>
          <OutlineButton
            className="px-3 py-1.5 rounded-full text-sm font-bold border border-red-500 text-red-500 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900"
            onClick={() => {
              localStorage.removeItem('currentAdmin');
              window.location.href = '/namebook';
            }}
          >
            {lang === 'zh' ? '退出' : 'ログアウト'}
          </OutlineButton>
        </div>
      )}

      {/* 返回首页按钮 */}
      <OutlineButton
        className="absolute top-4 left-4 z-50 text-lg"
        onClick={() => router.push("/")}
      >
        {lang === "zh" ? "返回首页" : "トップページへ戻る"}
      </OutlineButton>

      {/* 主要内容 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">{texts[lang].title}</h1>
        <p className="text-lg mb-8">{texts[lang].welcome}</p>
        
        {/* 这里可以添加更多功能按钮 */}
        <div className="flex flex-col gap-4">
          {/* 示例按钮 */}
          <button
            className="px-6 py-3 rounded font-medium bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-lg hover:shadow-xl border border-blue-600 hover:border-blue-500"
            onClick={() => router.push("/admin/list")}
          >
            {lang === "zh" ? "名簿管理" : "名簿管理"}
          </button>
        </div>
      </div>
    </div>
  );
} 