"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterComplete() {
  const router = useRouter();
  const [lang, setLang] = useState<"zh" | "ja">("zh");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-8 max-w-md w-full flex flex-col items-center">
        <div className="flex justify-end w-full mb-2">
          <button
            onClick={() => setLang(lang === "zh" ? "ja" : "zh")}
            className="text-blue-600 hover:underline"
          >
            {lang === "zh" ? "日本語" : "中文"}
          </button>
        </div>
        <h2 className="text-2xl font-bold mb-4">
          {lang === "zh" ? "提交成功" : "登録完了"}
        </h2>
        <p className="mb-6 text-lg text-center">
          {lang === "zh"
            ? "您的资料已成功提交，感谢您的注册！"
            : "ご登録ありがとうございます。情報が正常に送信されました。"}
        </p>
        <button
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full mt-4"
          onClick={() => router.push("/")}
        >
          {lang === "zh" ? "返回首页" : "トップページへ戻る"}
        </button>
        <button
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 w-full mt-4"
          onClick={() => router.push("/namebook/register")}
        >
          {lang === "zh" ? "继续登録" : "続けて登録"}
        </button>
      </div>
    </div>
  );
} 