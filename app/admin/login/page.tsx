"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (username === "admin" && password === "admin") {
      setError("");
      // Save admin info to localStorage
      const adminInfo = {
        username: "admin",
        type: "super",
        companyName: "株式会社ニュービルド",
        registerTime: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        permissions: ["名簿查看", "名簿上传", "名簿删除", "名簿下载", "名簿修改", "名簿分组管理", "更改密码", "更改公司信息"],
        langs: ["zh", "ja"]
      };
      localStorage.setItem("currentAdmin", JSON.stringify(adminInfo));
      router.push("/admin/home");
    } else {
      setError("账号或密码错误，仅允许admin账号登录");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl px-8 py-10 w-[350px] shadow-xl flex flex-col gap-6 border border-neutral-200 dark:border-neutral-700">
        <h2 className="text-2xl font-bold text-center mb-2">株式会社ニュービルド</h2>
        <form className="flex flex-col gap-4" onSubmit={handleLogin}>
          <input
            className="border rounded px-3 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
            placeholder="账号"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoFocus
          />
          <input
            className="border rounded px-3 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
            placeholder="密码"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <button
            type="submit"
            className="w-full py-2 rounded font-bold bg-neutral-800 text-white hover:bg-neutral-700 transition-all"
          >
            登录
          </button>
        </form>
        <button
          className="mt-2 text-sm text-neutral-500 hover:underline self-center"
          onClick={() => router.push("/")}
        >
          返回首页
        </button>
      </div>
    </div>
  );
} 