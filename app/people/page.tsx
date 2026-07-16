'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PREFECTURE_NAMES } from "../lib/payroll";
import { useRequireLogin } from "../lib/auth";
import { loadPeople, savePerson, deletePerson, type Person } from "../lib/peopleStore";

const GENDER_LABELS: Record<string, string> = { male: "男", female: "女", "": "-" };

export default function PeoplePage() {
  const router = useRouter();
  const authed = useRequireLogin();

  const [people, setPeople] = useState<Person[]>([]);
  const [name, setName] = useState("");
  const [kana, setKana] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [birth, setBirth] = useState("");
  const [prefectureIndex, setPrefectureIndex] = useState(12); // 東京都
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setPeople(loadPeople());
  }, []);

  function handleRegister() {
    if (!name.trim()) { setError("姓名を入力してください。"); return; }
    if (!birth) { setError("生年月日を入力してください。"); return; }
    const list = savePerson({
      name: name.trim(),
      kana: kana.trim(),
      gender,
      birth,
      prefectureIndex,
      address: address.trim(),
    });
    setPeople(list);
    setMessage(`${name.trim()} さんを登録しました。`);
    setError("");
    setName(""); setKana(""); setGender(""); setBirth(""); setAddress("");
  }

  function handleDelete(p: Person) {
    if (!confirm(`${p.name} さんを削除しますか?`)) return;
    setPeople(deletePerson(p.id));
  }

  const labelCls = "block text-sm font-medium text-gray-700 mb-1";
  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
  const cardCls = "bg-white rounded-2xl shadow p-5";

  if (!authed) return null;

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <header className="bg-blue-800 text-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow">
        <button onClick={() => router.push("/")} className="text-white text-2xl leading-none" aria-label="戻る">
          ←
        </button>
        <h1 className="text-lg font-bold">人員登録</h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-6 space-y-6">
        <section className={cardCls}>
          <h2 className="font-bold text-gray-800 mb-4 border-l-4 border-blue-700 pl-2">新規登録</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>姓名 *</label>
              <input className={inputCls} value={name} placeholder="山田 太郎"
                onChange={(e) => { setName(e.target.value); setError(""); }} />
            </div>
            <div>
              <label className={labelCls}>姓名カナ</label>
              <input className={inputCls} value={kana} placeholder="ヤマダ タロウ"
                onChange={(e) => setKana(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>性別</label>
              <select className={inputCls} value={gender} onChange={(e) => setGender(e.target.value as "male" | "female" | "")}>
                <option value="">選択してください</option>
                <option value="male">男</option>
                <option value="female">女</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>生年月日 *</label>
              <input type="date" className={inputCls} value={birth}
                onChange={(e) => { setBirth(e.target.value); setError(""); }} />
            </div>
            <div>
              <label className={labelCls}>都道府県(給与計算の地域)</label>
              <select className={inputCls} value={prefectureIndex} onChange={(e) => setPrefectureIndex(Number(e.target.value))}>
                {PREFECTURE_NAMES.map((p, i) => (
                  <option key={p} value={i}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>住所</label>
              <input className={inputCls} value={address} placeholder="新宿区西新宿1-1-1"
                onChange={(e) => setAddress(e.target.value)} />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          {message && !error && <p className="text-sm text-green-700 mt-3">{message}</p>}
          <button
            className="w-full mt-4 py-3 rounded-xl bg-blue-700 text-white font-bold hover:bg-blue-800 transition-colors"
            onClick={handleRegister}
          >
            登録する
          </button>
        </section>

        <section className={cardCls}>
          <h2 className="font-bold text-gray-800 mb-3 border-l-4 border-gray-500 pl-2">
            登録済み人員({people.length}名)
          </h2>
          {people.length === 0 ? (
            <p className="text-sm text-gray-500">まだ登録がありません。</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2 pr-4">姓名</th>
                    <th className="py-2 pr-4">カナ</th>
                    <th className="py-2 pr-4">性別</th>
                    <th className="py-2 pr-4">生年月日</th>
                    <th className="py-2 pr-4">住所</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {people.map((p) => (
                    <tr key={p.id} className="border-b last:border-b-0">
                      <td className="py-2 pr-4 font-medium">{p.name}</td>
                      <td className="py-2 pr-4 text-gray-600">{p.kana || "-"}</td>
                      <td className="py-2 pr-4">{GENDER_LABELS[p.gender]}</td>
                      <td className="py-2 pr-4">{p.birth}</td>
                      <td className="py-2 pr-4 text-gray-600">
                        {PREFECTURE_NAMES[p.prefectureIndex]}{p.address && ` ${p.address}`}
                      </td>
                      <td className="py-2 text-right">
                        <button className="text-red-600 hover:underline" onClick={() => handleDelete(p)}>削除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
