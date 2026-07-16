"use client";
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequireLogin } from "../lib/auth";

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
}

export default function NamebookPage() {
  const [lang, setLang] = useState<'zh' | 'ja'>("zh");
  const router = useRouter();
  const authed = useRequireLogin();

  useEffect(() => {
    const savedLang = localStorage.getItem("lang");
    if (savedLang === "zh" || savedLang === "ja") {
      setLang(savedLang);
    }
  }, []);

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

  // 登录弹窗
  const [showLogin, setShowLogin] = useState(false);
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [adminError, setAdminError] = useState("");

  // 个人登录弹窗状态
  const [showUserLogin, setShowUserLogin] = useState(false);
  const [userLoginUser, setUserLoginUser] = useState("");
  const [userLoginPass, setUserLoginPass] = useState("");
  const [userLoginError, setUserLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 名簿查查看/修改弹窗状态
  const [showUserList, setShowUserList] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  function handleAdminLogin() {
    if (adminUser === "admin") {
      setAdminError(lang === "zh" ? "admin账号请在首页登录" : "adminアカウントはトップページからログインしてください");
      return;
    }
    // 检查本地管理员列表
    const adminList = JSON.parse(localStorage.getItem("adminList") || "[]");
    const found = adminList.find((a: any) => a.username === adminUser && a.password === adminPass);
    if (found) {
      // Save admin info to localStorage
      localStorage.setItem("currentAdmin", JSON.stringify(found));
      alert(lang === "zh" ? "登录成功！" : "ログイン成功！");
      setShowLogin(false);
      setAdminUser("");
      setAdminPass("");
      setAdminError("");
      router.push("/admin/manager");
    } else {
      setAdminError(lang === "zh" ? "账号或密码错误" : "アカウントまたはパスワードが違います");
    }
  }

  function handleUserLogin() {
    const list = JSON.parse(localStorage.getItem('registerList') || '[]');
    const account = userLoginUser.trim().toLowerCase();
    const password = userLoginPass.trim();
    const savedPassword = localStorage.getItem('userPassword_' + account);
    const found = list.find((item: UserInfo) => (item.firstNameRomaji + item.lastNameRomaji).toLowerCase() === account);
    if (!found) {
      setUserLoginError(lang === 'zh' ? '未找到该账号' : 'アカウントが見つかりません');
      return;
    }
    if (!savedPassword) {
      setUserLoginError(lang === 'zh' ? '该账号未设置密码' : 'このアカウントはパスワードが設定されていません');
      return;
    }
    if (password !== savedPassword) {
      setUserLoginError(lang === 'zh' ? '密码错误' : 'パスワードが違います');
      return;
    }
    setUserInfo(found);
    setShowUserList(true);
    setShowUserLogin(false);
    setUserLoginUser("");
    setUserLoginPass("");
    setUserLoginError("");
  }

  if (!authed) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f5f7] dark:bg-black text-[#1d1d1f] dark:text-white relative">
      {/* 语言切换 */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          className={`px-3 py-1.5 rounded-full text-sm border border-[#d2d2d7] hover:bg-[#f5f5f7] dark:border-[#424245] dark:hover:bg-[#1d1d1f] transition-colors ${
            lang === "zh" ? "bg-[#f5f5f7] dark:bg-[#1d1d1f]" : ""
          }`}
          onClick={() => {
            setLang("zh");
            localStorage.setItem("lang", "zh");
            window.location.reload();
          }}
        >
          中文
        </button>
        <button
          className={`px-3 py-1.5 rounded-full text-sm border border-[#d2d2d7] hover:bg-[#f5f5f7] dark:border-[#424245] dark:hover:bg-[#1d1d1f] transition-colors ${
            lang === "ja" ? "bg-[#f5f5f7] dark:bg-[#1d1d1f]" : ""
          }`}
          onClick={() => {
            setLang("ja");
            localStorage.setItem("lang", "ja");
            window.location.reload();
          }}
        >
          日本語
        </button>
      </div>

      {/* 返回按钮 */}
      <button
        className="absolute top-4 left-4 text-[#0066cc] dark:text-[#0a84ff] hover:underline"
        onClick={() => router.push("/")}
      >
        {lang === "zh" ? "返回首页" : "トップページへ戻る"}
      </button>

      {/* 公司名和网站名 */}
      <div className="flex flex-col items-center gap-2 mb-16">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-2">{COMPANY_NAME}</h1>
        <h2 className="text-2xl sm:text-3xl font-medium text-[#86868b] dark:text-[#86868b]">{texts[lang].site}</h2>
      </div>

      {/* 功能按钮区域 */}
      <div className="flex flex-col items-center w-full max-w-2xl px-4 mt-0">
        {/* 名簿登陆按钮 */}
        <button
          className="w-64 px-8 py-4 rounded-full text-lg font-bold bg-gradient-to-b from-[#bfc9d1] via-[#e6e8ea] to-[#7a7e83] text-black border border-[#bfc9d1] shadow-md hover:from-[#e6e8ea] hover:to-[#bfc9d1] active:from-[#7a7e83] active:to-[#bfc9d1] transition-all duration-200 mb-4"
          style={{ boxShadow: '0 4px 16px 0 #bfc9d1, 0 1.5px 0 #fff inset' }}
          onClick={() => router.push("/namebook/register")}
        >
          {texts[lang].namebook}
        </button>

          {/* 已登录名簿查看/修改按钮 */}
          <button
          className="w-64 px-8 py-4 rounded-full text-lg font-bold bg-gradient-to-b from-[#bfc9d1] via-[#e6e8ea] to-[#7a7e83] text-black border border-[#bfc9d1] shadow-md hover:from-[#e6e8ea] hover:to-[#bfc9d1] active:from-[#7a7e83] active:to-[#bfc9d1] transition-all duration-200 mb-4"
            style={{ boxShadow: '0 4px 16px 0 #bfc9d1, 0 1.5px 0 #fff inset' }}
            onClick={() => setShowUserLogin(true)}
          >
            {lang === 'zh' ? '已登录名簿查看/修改' : '登録済み名簿の確認・修正'}
          </button>

          {/* 管理员登录按钮 */}
          <button
          className="w-64 px-8 py-4 rounded-full text-lg font-bold bg-gradient-to-b from-[#bfc9d1] via-[#e6e8ea] to-[#7a7e83] text-black border border-[#bfc9d1] shadow-md hover:from-[#e6e8ea] hover:to-[#bfc9d1] active:from-[#7a7e83] active:to-[#bfc9d1] transition-all duration-200"
            style={{ boxShadow: '0 4px 16px 0 #bfc9d1, 0 1.5px 0 #fff inset' }}
            onClick={() => setShowLogin(true)}
          >
            {texts[lang].login}
          </button>
        </div>

      {/* 个人登录弹窗 */}
      {showUserLogin && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 w-80 max-w-[90vw] shadow-lg flex flex-col gap-4">
            <h3 className="text-lg font-semibold mb-2">{lang === 'zh' ? '个人登录' : '個人ログイン'}</h3>
            <input
              className="border rounded px-3 py-2 mb-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
              placeholder={lang === 'zh' ? '账号（罗马字）' : 'アカウント（ローマ字）'}
              value={userLoginUser}
              onChange={e => setUserLoginUser(e.target.value.toUpperCase())}
            />
            <div className="relative">
              <input
                className="border rounded px-3 py-2 mb-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 w-full"
                placeholder={lang === 'zh' ? '密码（6位数字）' : 'パスワード（6桁数字）'}
                type={showPassword ? "text" : "password"}
                value={userLoginPass}
                onChange={e => setUserLoginPass(e.target.value)}
              />
              <button
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {userLoginError && <div className="text-red-500 text-sm mb-2">{userLoginError}</div>}
            <div className="flex gap-2">
              <button
                className="flex-1 bg-neutral-800 text-white py-2 rounded hover:bg-neutral-700"
                onClick={handleUserLogin}
              >
                {lang === 'zh' ? '登录' : 'ログイン'}
              </button>
              <button
                className="flex-1 border py-2 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700"
                onClick={() => { setShowUserLogin(false); setUserLoginError(""); }}
              >
                {lang === 'zh' ? '取消' : 'キャンセル'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 名簿信息弹窗 */}
      {showUserList && userInfo && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 w-[90vw] max-w-2xl shadow-lg flex flex-col gap-4">
            <h3 className="text-lg font-semibold mb-2">{lang === 'zh' ? '我的名簿信息' : '自分の名簿情報'}</h3>
            <div className="flex flex-col gap-2 text-sm overflow-y-auto" style={{ maxHeight: '60vh' }}>
              <div><strong>{lang === 'zh' ? '姓名' : '氏名'}:</strong> {userInfo.firstName} {userInfo.lastName}</div>
              <div><strong>{lang === 'zh' ? 'ふりがな' : 'ふりがな'}:</strong> {userInfo.firstNameFurigana} {userInfo.lastNameFurigana}</div>
              <div><strong>{lang === 'zh' ? '罗马字' : 'ローマ字'}:</strong> {userInfo.firstNameRomaji} {userInfo.lastNameRomaji}</div>
              <div><strong>{lang === 'zh' ? '性别' : '性別'}:</strong> {userInfo.gender}</div>
              <div><strong>{lang === 'zh' ? '出生年月日' : '生年月日'}:</strong> {userInfo.birth}</div>
              <div><strong>{lang === 'zh' ? '国籍' : '国籍'}:</strong> {userInfo.nationality}</div>
              <div><strong>{lang === 'zh' ? '工种' : '工種'}:</strong> {userInfo.jobs && userInfo.jobs.length > 0 ? userInfo.jobs.join(', ') : ''}</div>
              <div><strong>{lang === 'zh' ? '住址' : '住所'}:</strong> {[userInfo.address, userInfo.selectedChome, userInfo.detailAddress].filter(Boolean).join(' ')}</div>
              <div><strong>{lang === 'zh' ? '电话' : '電話番号'}:</strong> {userInfo.phone}</div>
            </div>
            <button
              className="w-64 mt-4 px-4 py-2 bg-gradient-to-b from-[#bfc9d1] via-[#e6e8ea] to-[#7a7e83] text-black font-bold border border-[#bfc9d1] rounded shadow-md hover:from-[#e6e8ea] hover:to-[#bfc9d1] active:from-[#7a7e83] active:to-[#bfc9d1] self-end mb-2"
              style={{ boxShadow: '0 4px 16px 0 #bfc9d1, 0 1.5px 0 #fff inset' }}
              onClick={() => {
                localStorage.setItem('editUserAccount', (userInfo.firstNameRomaji + userInfo.lastNameRomaji).toLowerCase());
                window.location.href = '/register?edit=1';
              }}
            >
              {lang === 'zh' ? '设置/修改' : '設定・修正'}
            </button>
            <button
              className="mt-2 px-4 py-2 border rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 self-end"
              onClick={() => setShowUserList(false)}
            >
              {lang === 'zh' ? '关闭' : '閉じる'}
            </button>
          </div>
        </div>
      )}

      {/* 管理员登录弹窗 */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 w-80 max-w-[90vw] shadow-lg flex flex-col gap-4">
            <h3 className="text-lg font-semibold mb-2">{texts[lang].loginTitle}</h3>
            <input
              className="border rounded px-3 py-2 mb-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
              placeholder={texts[lang].user}
              value={adminUser}
              onChange={e => setAdminUser(e.target.value)}
            />
            <input
              className="border rounded px-3 py-2 mb-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
              placeholder={texts[lang].pass}
              type="password"
              value={adminPass}
              onChange={e => setAdminPass(e.target.value)}
            />
            {adminError && (
              <div className="text-red-500 text-sm mb-2 flex flex-col gap-2">
                <span>{adminError}</span>
                <button
                  className="mt-1 px-3 py-1 rounded bg-neutral-200 hover:bg-neutral-300 text-neutral-800 border border-neutral-300 self-start"
                  onClick={() => {
                    setShowLogin(false);
                    setAdminError("");
                    setAdminUser("");
                    setAdminPass("");
                    if (adminUser === "admin") {
                      window.location.href = "/";
                    } else {
                      window.location.href = "/namebook";
                    }
                  }}
                >
                  跳出
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <button
                className="flex-1 bg-neutral-800 text-white py-2 rounded hover:bg-neutral-700"
                onClick={handleAdminLogin}
              >
                {texts[lang].loginBtn}
              </button>
              <button
                className="flex-1 border py-2 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700"
                onClick={() => { setShowLogin(false); setAdminError(""); }}
              >
                {lang === "zh" ? "取消" : "キャンセル"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 