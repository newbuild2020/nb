"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import OutlineButton from "../manager/OutlineButton";

export default function AdminHome() {
  const router = useRouter();

  // 语言切换
  const [lang, setLang] = useState<'zh' | 'ja'>("zh");
  const langSwitch = (
    <div className="absolute top-4 right-4 flex gap-2 z-50">
      <button
        className={`px-3 py-1.5 rounded-full text-sm border border-[#d2d2d7] hover:bg-[#f5f5f7] dark:border-[#424245] dark:hover:bg-[#1d1d1f] transition-colors ${lang === "zh" ? "bg-[#f5f5f7] dark:bg-[#1d1d1f]" : ""}`}
        onClick={() => setLang("zh")}
      >
        中文
      </button>
      <button
        className={`px-3 py-1.5 rounded-full text-sm border border-[#d2d2d7] hover:bg-[#f5f5f7] dark:border-[#424245] dark:hover:bg-[#1d1d1f] transition-colors ${lang === "ja" ? "bg-[#f5f5f7] dark:bg-[#1d1d1f]" : ""}`}
        onClick={() => setLang("ja")}
      >
        日本語
      </button>
    </div>
  );

  // 返回首页按钮
  const goHomeBtn = (
    <OutlineButton className="absolute top-4 left-4 z-50 text-lg font-bold shadow-none" onClick={() => router.push("/")}>返回首页</OutlineButton>
  );

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center">
      {goHomeBtn}
      {langSwitch}
      <div className="flex flex-col gap-4 mt-24">
        <OutlineButton className="text-lg font-bold" onClick={() => router.push("/admin/accounts")}>员工账号信息管理</OutlineButton>
        <OutlineButton className="text-lg font-bold" onClick={() => router.push("/admin/admins")}>管理员账号管理</OutlineButton>
        <OutlineButton className="text-lg font-bold" onClick={() => router.push("/admin/home/gongdi")}>工地管理</OutlineButton>
      </div>
    </div>
  );
} 