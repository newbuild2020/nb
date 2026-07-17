'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  loadSalaryRecords,
  saveSalaryRecord,
  updateSalaryRecord,
  type SalaryRecord,
  type PersonSnapshot,
} from "../lib/salaryStore";
import { useRequireLogin } from "../lib/auth";
import { loadPeople, type Person } from "../lib/peopleStore";
import { syncPeople, syncSalaryRecords } from "../lib/cloudSync";
import { getCompanyPrefecture, setCompanyPrefecture } from "../lib/settingsStore";
import {
  PREFECTURE_NAMES,
  KENPO_MIN_YEAR,
  KENPO_MAX_YEAR,
  KOYO_INDUSTRY_LABELS,
  ROUSAI_DEFAULT_RATE,
  calcPayroll,
  type PayrollInput,
  type KoyoIndustry,
} from "../lib/payroll";

const MONTH_NAMES = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

function yen(n: number): string {
  return n.toLocaleString("ja-JP") + " 円";
}

export default function SalaryPage() {
  const router = useRouter();
  const authed = useRequireLogin();
  const now = new Date();

  const [name, setName] = useState("");
  const [birth, setBirth] = useState("1990-01-01");
  // 協会けんぽの都道府県 = 会社(事業所)の所在地。従業員個人の住所ではない。
  const [prefectureIndex, setPrefectureIndex] = useState(13); // 会社所在地(神奈川県・既定)
  const [isExecutive, setIsExecutive] = useState(false);
  const [workYear, setWorkYear] = useState(now.getFullYear());
  const [workMonth, setWorkMonth] = useState(now.getMonth() + 1);
  const [paymentOffset, setPaymentOffset] = useState<0 | 1 | 2>(1);
  const [grossSalaryStr, setGrossSalaryStr] = useState("");
  const [dependentsStr, setDependentsStr] = useState("0");
  const [insuranceType, setInsuranceType] = useState<"kyokai" | "kumiai">("kyokai");
  const [kumiaiHealthStr, setKumiaiHealthStr] = useState("");
  const [kumiaiKaigoStr, setKumiaiKaigoStr] = useState("");
  const [kumiaiFeeStr, setKumiaiFeeStr] = useState("");
  const [koyoIndustry, setKoyoIndustry] = useState<KoyoIndustry>("construction");
  const [rousaiRateStr, setRousaiRateStr] = useState(String(ROUSAI_DEFAULT_RATE));

  const [incomeTaxOverride, setIncomeTaxOverride] = useState<number | null>(null);
  const [taxOverrideStr, setTaxOverrideStr] = useState("");
  const [nenmatsuRefundStr, setNenmatsuRefundStr] = useState("");
  const [nenmatsuCollectStr, setNenmatsuCollectStr] = useState("");

  // 入力欄は文字列で保持し、計算時に数値へ変換する(0が消せない問題の対策)
  const grossSalary = Math.max(0, Number(grossSalaryStr) || 0);
  const dependents = Math.max(0, Math.floor(Number(dependentsStr) || 0));
  const kumiaiHealthMonthly = Math.max(0, Number(kumiaiHealthStr) || 0);
  const kumiaiKaigoMonthly = Math.max(0, Number(kumiaiKaigoStr) || 0);
  const kumiaiFee = Math.max(0, Number(kumiaiFeeStr) || 0);
  const rousaiRate = Math.max(0, Number(rousaiRateStr) || 0);
  const nenmatsuRefund = Math.max(0, Number(nenmatsuRefundStr) || 0);
  const nenmatsuCollect = Math.max(0, Number(nenmatsuCollectStr) || 0);
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [saveMessage, setSaveMessage] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");

  useEffect(() => {
    setPrefectureIndex(getCompanyPrefecture());
    const loaded = loadSalaryRecords();
    setRecords(loaded);
    setPeople(loadPeople());
    // クラウドと同期(オフライン時はローカルのまま)
    syncPeople().then((list) => { if (list) setPeople(list); });
    syncSalaryRecords().then((list) => { if (list) setRecords(list); });
    // 明細一覧の「編集」から遷移してきた場合、対象明細を読み込む
    const editId = sessionStorage.getItem("salaryEditRecordId");
    if (editId) {
      sessionStorage.removeItem("salaryEditRecordId");
      const r = loaded.find((x) => x.id === editId);
      if (r) {
        const i = r.input;
        setName(i.name);
        setBirth(i.birth);
        setPrefectureIndex(i.prefectureIndex);
        setIsExecutive(i.isExecutive);
        setWorkYear(i.workYear);
        setWorkMonth(i.workMonth);
        setPaymentOffset(i.paymentOffset);
        setGrossSalaryStr(String(i.grossSalary));
        setDependentsStr(String(i.dependents));
        setInsuranceType(i.insuranceType);
        setKumiaiHealthStr(i.kumiaiHealthMonthly ? String(i.kumiaiHealthMonthly) : "");
        setKumiaiKaigoStr(i.kumiaiKaigoMonthly ? String(i.kumiaiKaigoMonthly) : "");
        setKumiaiFeeStr(i.kumiaiFee ? String(i.kumiaiFee) : "");
        setKoyoIndustry(i.koyoIndustry ?? "construction");
        setRousaiRateStr(String(i.rousaiRate ?? ROUSAI_DEFAULT_RATE));
        setIncomeTaxOverride(i.incomeTaxOverride ?? null);
        setTaxOverrideStr(i.incomeTaxOverride != null ? String(i.incomeTaxOverride) : "");
        setNenmatsuRefundStr(i.nenmatsuRefund ? String(i.nenmatsuRefund) : "");
        setNenmatsuCollectStr(i.nenmatsuCollect ? String(i.nenmatsuCollect) : "");
        setEditingId(r.id);
        setEditingLabel(`${i.name} / ${r.result.paymentYear}年${r.result.paymentMonth}月支給分`);
      }
    }
  }, []);

  // 在職の人員のみ選択可能(退職者は除外)
  const activePeople = people.filter((p) => p.status === "active");

  const [depAutoNote, setDepAutoNote] = useState("");
  const depManualRef = useRef(false);

  function handleSelectPerson(id: string) {
    setSelectedPersonId(id);
    setSaveMessage("");
    depManualRef.current = false; // 扶養人数を再び自動追従させる
    const p = people.find((x) => x.id === id);
    if (p) {
      setName(p.name);
      setBirth(p.birth);
      // 健康保険料率は会社所在地で決まるため、従業員の住所では上書きしない
      setIsExecutive(p.role === "executive");
    }
  }

  /** その人の「対象月より前」で最も新しい明細の扶養人数を探す */
  function findPrevDependents(personId: string, wy: number, wm: number): number | null {
    const p = people.find((x) => x.id === personId);
    if (!p) return null;
    const target = wy * 12 + (wm - 1);
    let best: { ym: number; dep: number } | null = null;
    for (const r of records) {
      const match =
        (r.person && r.person.code === p.code) ||
        (r.input.name === p.name && r.input.birth === p.birth);
      if (!match) continue;
      const ym = r.input.workYear * 12 + (r.input.workMonth - 1);
      if (ym >= target) continue;
      if (!best || ym > best.ym) best = { ym, dep: r.input.dependents };
    }
    return best ? best.dep : null;
  }

  // 人員選択時・勤務月変更時: 前月(以前)の明細から扶養人数を自動入力。
  // 手動で修正した後は上書きしない。
  useEffect(() => {
    if (!selectedPersonId || editingId || depManualRef.current) return;
    const dep = findPrevDependents(selectedPersonId, workYear, workMonth);
    if (dep !== null) {
      setDependentsStr(String(dep));
      setDepAutoNote(`前月までの明細から扶養親族等の数「${dep}人」を自動入力しました。`);
    } else {
      setDependentsStr("0");
      setDepAutoNote("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPersonId, workYear, workMonth, records, people]);

  /** 選択中の人員から明細用スナップショット(対象月時点の情報)を作る */
  function buildSnapshot(): PersonSnapshot | undefined {
    const p = people.find((x) => x.id === selectedPersonId);
    if (!p) return undefined;
    return {
      code: p.code,
      role: p.role,
      address: `${PREFECTURE_NAMES[p.prefectureIndex]}${p.address ? ` ${p.address}` : ""}`,
      hireDate: p.hireDate || "",
    };
  }

  const currentInput = useMemo<PayrollInput | null>(() => {
    if (!birth || grossSalary <= 0) return null;
    return {
      name,
      birth,
      prefectureIndex,
      isExecutive,
      workYear,
      workMonth,
      paymentOffset,
      grossSalary,
      dependents,
      insuranceType,
      kumiaiHealthMonthly,
      kumiaiKaigoMonthly,
      kumiaiFee,
      koyoIndustry,
      rousaiRate,
      incomeTaxOverride,
      nenmatsuRefund,
      nenmatsuCollect,
    };
  }, [
    name, birth, prefectureIndex, isExecutive, workYear, workMonth, paymentOffset,
    grossSalary, dependents, insuranceType, kumiaiHealthMonthly, kumiaiKaigoMonthly, kumiaiFee,
    koyoIndustry, rousaiRate, incomeTaxOverride, nenmatsuRefund, nenmatsuCollect,
  ]);

  const result = useMemo(() => {
    if (!currentInput) return null;
    try {
      return calcPayroll(currentInput);
    } catch {
      return null;
    }
  }, [currentInput]);

  /** 保存後にフォームを初期化(次の対象者をすぐ入力できるように)。
   *  会社所在地・勤務月・支給タイミング・業種・労災率など会社共通の設定は保持する。 */
  function resetFormAfterSave() {
    setName("");
    setBirth("1990-01-01");
    setSelectedPersonId("");
    setIsExecutive(false);
    setGrossSalaryStr("");
    setDependentsStr("0");
    setInsuranceType("kyokai");
    setKumiaiHealthStr("");
    setKumiaiKaigoStr("");
    setKumiaiFeeStr("");
    setIncomeTaxOverride(null);
    setTaxOverrideStr("");
    setNenmatsuRefundStr("");
    setNenmatsuCollectStr("");
    setDepAutoNote("");
    depManualRef.current = false;
    setEditingId(null);
    setEditingLabel("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSave() {
    if (!currentInput || !result) return;
    if (!currentInput.name.trim()) {
      setSaveMessage("氏名を入力してから保存してください。");
      return;
    }
    const snapshot = buildSnapshot();
    const label = `${currentInput.name} / ${result.paymentYear}年${result.paymentMonth}月支給分`;
    if (editingId) {
      setRecords(updateSalaryRecord(editingId, currentInput, result, snapshot));
    } else {
      saveSalaryRecord(currentInput, result, snapshot);
      setRecords(loadSalaryRecords());
    }
    resetFormAfterSave();
    setSaveMessage(`${editingId ? "更新" : "保存"}しました(${label})。フォームを初期化しました。`);
  }

  function stopEditing() {
    setEditingId(null);
    setEditingLabel("");
    setSaveMessage("");
  }

  const labelCls = "block text-sm font-medium text-gray-700 mb-1";
  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
  const cardCls = "bg-white rounded-2xl shadow p-5";

  if (!authed) return null; // 未ログインはホームへリダイレクト(useRequireLogin)

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      {/* ヘッダー */}
      <header className="bg-blue-800 text-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow">
        <button onClick={() => router.push("/")} className="text-white text-2xl leading-none" aria-label="戻る">
          ←
        </button>
        <h1 className="text-lg font-bold">給料計算(給与・社会保険・所得税)</h1>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-6 grid gap-6 lg:grid-cols-2">
        {/* ==== 入力フォーム ==== */}
        <div className="space-y-6">
          {saveMessage && (
            <div className="bg-green-50 border border-green-300 text-green-800 rounded-xl px-4 py-3 text-sm">
              ✓ {saveMessage}
            </div>
          )}
          {editingId && (
            <div className="bg-blue-50 border border-blue-300 text-blue-900 rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-3">
              <span>✎ 編集中: {editingLabel}</span>
              <button className="text-blue-700 underline whitespace-nowrap" onClick={stopEditing}>
                編集をやめて新規作成
              </button>
            </div>
          )}

          <section className={cardCls}>
            <h2 className="font-bold text-gray-800 mb-4 border-l-4 border-blue-700 pl-2">対象者の選択</h2>
            {activePeople.length === 0 ? (
              <p className="text-sm text-gray-600">
                選択できる在職の人員がいません。
                <button className="text-blue-700 underline ml-1" onClick={() => router.push("/people")}>
                  人員登録
                </button>
                で先に登録すると、ここから選ぶだけで氏名・生年月日・地域が自動入力されます。
              </p>
            ) : (
              <>
                <select
                  className={inputCls}
                  value={selectedPersonId}
                  onChange={(e) => handleSelectPerson(e.target.value)}
                >
                  <option value="">選択してください(手動入力も可)</option>
                  {activePeople.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} {p.name}{p.kana && `(${p.kana})`}
                    </option>
                  ))}
                </select>
                {selectedPersonId && (
                  <p className="text-xs text-gray-500 mt-2">
                    氏名・生年月日・地域・区分(役員/社員)を自動入力しました。下で修正もできます。
                    保存時に管理番号・住所・入社日も明細に記録されます。
                  </p>
                )}
              </>
            )}
          </section>

          <section className={cardCls}>
            <h2 className="font-bold text-gray-800 mb-4 border-l-4 border-blue-700 pl-2">基本情報</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>氏名</label>
                <input className={inputCls} value={name} onChange={(e) => { setName(e.target.value); setSaveMessage(""); }} placeholder="山田 太郎" />
              </div>
              <div>
                <label className={labelCls}>生年月日</label>
                <input type="date" className={inputCls} value={birth} onChange={(e) => setBirth(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>会社所在地(協会けんぽの都道府県)</label>
                <select className={inputCls} value={prefectureIndex} onChange={(e) => { const v = Number(e.target.value); setPrefectureIndex(v); setCompanyPrefecture(v); }}>
                  {PREFECTURE_NAMES.map((p, i) => (
                    <option key={p} value={i}>{p}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  ※ 協会けんぽの健康保険料率は会社(事業所)の所在地で決まります。従業員個人の住所ではありません。一度設定すると次回以降も保持されます。
                </p>
              </div>
              <div>
                <label className={labelCls}>区分</label>
                <div className="flex rounded-lg overflow-hidden border border-gray-300">
                  <button
                    className={`flex-1 py-2 text-sm font-medium ${!isExecutive ? "bg-blue-700 text-white" : "bg-white text-gray-600"}`}
                    onClick={() => setIsExecutive(false)}
                  >
                    社員
                  </button>
                  <button
                    className={`flex-1 py-2 text-sm font-medium ${isExecutive ? "bg-blue-700 text-white" : "bg-white text-gray-600"}`}
                    onClick={() => setIsExecutive(true)}
                  >
                    役員
                  </button>
                </div>
              </div>
              <div>
                <label className={labelCls}>扶養親族等の数</label>
                <input
                  type="number" min={0} max={10} className={inputCls} placeholder="0"
                  value={dependentsStr}
                  onChange={(e) => {
                    setDependentsStr(e.target.value);
                    depManualRef.current = true;
                    setDepAutoNote("");
                  }}
                />
                {depAutoNote && <p className="text-xs text-green-700 mt-1">{depAutoNote}</p>}
              </div>
            </div>
            {isExecutive && (
              <p className="text-xs text-amber-600 mt-3">※ 役員は雇用保険・労災保険の対象外として計算します。</p>
            )}
          </section>

          <section className={cardCls}>
            <h2 className="font-bold text-gray-800 mb-4 border-l-4 border-blue-700 pl-2">勤務月・支給月・給与</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>勤務月(対象月)</label>
                <input
                  type="month" className={inputCls} min={`${KENPO_MIN_YEAR}-01`}
                  value={`${workYear}-${String(workMonth).padStart(2, "0")}`}
                  onChange={(e) => {
                    const [y, m] = e.target.value.split("-").map(Number);
                    if (y && m) { setWorkYear(y); setWorkMonth(m); }
                  }}
                />
              </div>
              <div>
                <label className={labelCls}>給与支給のタイミング</label>
                <select className={inputCls} value={paymentOffset} onChange={(e) => setPaymentOffset(Number(e.target.value) as 0 | 1 | 2)}>
                  <option value={0}>当月払い</option>
                  <option value={1}>翌月払い</option>
                  <option value={2}>翌々月払い</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>月額給与(総支給額・円)</label>
                <input
                  type="number" min={0} step={1000} className={inputCls} placeholder="0"
                  value={grossSalaryStr}
                  onChange={(e) => setGrossSalaryStr(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>年末調整 還付(円・手取りに加算)</label>
                <input
                  type="number" min={0} step={100} className={inputCls} placeholder="0"
                  value={nenmatsuRefundStr}
                  onChange={(e) => setNenmatsuRefundStr(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>年末調整 徴収(円・手取りから減算)</label>
                <input
                  type="number" min={0} step={100} className={inputCls} placeholder="0"
                  value={nenmatsuCollectStr}
                  onChange={(e) => setNenmatsuCollectStr(e.target.value)}
                />
              </div>
            </div>
            {result && (
              <p className="text-sm text-gray-600 mt-3">
                支給月: <span className="font-bold text-blue-800">{result.paymentYear}年{MONTH_NAMES[result.paymentMonth - 1]}</span>
                (勤務月 {workYear}年{MONTH_NAMES[workMonth - 1]} 分)
              </p>
            )}
          </section>

          <section className={cardCls}>
            <h2 className="font-bold text-gray-800 mb-4 border-l-4 border-blue-700 pl-2">健康保険の種類</h2>
            <div className="flex rounded-lg overflow-hidden border border-gray-300 mb-4">
              <button
                className={`flex-1 py-2 text-sm font-medium ${insuranceType === "kyokai" ? "bg-blue-700 text-white" : "bg-white text-gray-600"}`}
                onClick={() => setInsuranceType("kyokai")}
              >
                協会けんぽ
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium ${insuranceType === "kumiai" ? "bg-blue-700 text-white" : "bg-white text-gray-600"}`}
                onClick={() => setInsuranceType("kumiai")}
              >
                国保組合・その他
              </button>
            </div>

            {insuranceType === "kyokai" ? (
              <p className="text-sm text-gray-600">
                {PREFECTURE_NAMES[prefectureIndex]} の協会けんぽ料率
                {result && `(${result.applied.kenpoFiscalLabel}: 健保 ${result.applied.kenpoRate}%・介護 ${result.applied.kaigoRate}%)`}
                を労使折半で計算します。勤務月に応じて {KENPO_MIN_YEAR}(平成28)〜{KENPO_MAX_YEAR}(令和7)年度の公式料率を自動適用します。
              </p>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  建設国保などの組合保険は<span className="font-medium">全額本人負担</span>です。
                  会社が立て替えて給与から控除するため、会社負担は0円になります。
                </p>
                <div>
                  <label className={labelCls}>健康保険料の月額(医療分・円)</label>
                  <input type="number" min={0} step={100} className={inputCls} placeholder="0"
                    value={kumiaiHealthStr}
                    onChange={(e) => setKumiaiHealthStr(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>介護保険料の月額(円・40〜64歳のみ控除)</label>
                  <input type="number" min={0} step={100} className={inputCls} placeholder="0"
                    value={kumiaiKaigoStr}
                    onChange={(e) => setKumiaiKaigoStr(e.target.value)} />
                  {result && !result.kaigoApplied && kumiaiKaigoMonthly > 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      ※ この勤務月は介護保険第2号被保険者(40〜64歳)に該当しないため控除されません。
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>組合費(円/月・給与から控除)</label>
                  <input type="number" min={0} step={100} className={inputCls} placeholder="0"
                    value={kumiaiFeeStr}
                    onChange={(e) => setKumiaiFeeStr(e.target.value)} />
                </div>
              </div>
            )}
          </section>

          {!isExecutive && (
            <section className={cardCls}>
              <h2 className="font-bold text-gray-800 mb-4 border-l-4 border-blue-700 pl-2">雇用保険・労災保険</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>雇用保険の業種区分</label>
                  <select className={inputCls} value={koyoIndustry} onChange={(e) => setKoyoIndustry(e.target.value as KoyoIndustry)}>
                    {(Object.keys(KOYO_INDUSTRY_LABELS) as KoyoIndustry[]).map((k) => (
                      <option key={k} value={k}>{KOYO_INDUSTRY_LABELS[k]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>労災保険料率(%・会社全額負担)</label>
                  <input type="number" step={0.05} min={0} className={inputCls} placeholder="0.3"
                    value={rousaiRateStr}
                    onChange={(e) => setRousaiRateStr(e.target.value)} />
                </div>
              </div>
              {result && (
                <p className="text-xs text-gray-500 mt-3">
                  {KOYO_INDUSTRY_LABELS[koyoIndustry]}の雇用保険料率
                  (本人 {result.applied.koyoEmployeeRate}% / 会社 {result.applied.koyoEmployerRate}%)を適用中。
                  労災保険料率は事業の種類ごとに異なります(例: 建築事業 0.95%、その他の各種事業 0.3%)。
                </p>
              )}
            </section>
          )}
        </div>

        {/* ==== 計算結果 ==== */}
        <div className="space-y-6">
          {result ? (
            <>
              {result.applied.kenpoFallback && (
                <div className="bg-amber-50 border border-amber-300 text-amber-800 rounded-xl px-4 py-3 text-sm">
                  ⚠ {workYear}年{workMonth}月分の協会けんぽ料率は未登録のため、
                  登録済みの最新年度({result.applied.kenpoFiscalLabel})の料率で計算しています。
                  新年度の料率が公表され次第、自動的に反映されます。
                </div>
              )}

              <section className={cardCls}>
                <h2 className="font-bold text-gray-800 mb-3 border-l-4 border-blue-700 pl-2">適用料率({result.applied.kenpoFiscalLabel})</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600">
                  {insuranceType === "kyokai" && <div>健康保険: {result.applied.kenpoRate}%</div>}
                  {insuranceType === "kyokai" && <div>介護保険: {result.applied.kaigoRate}%</div>}
                  <div>厚生年金: {result.applied.pensionRate}%</div>
                  <div>子ども・子育て拠出金: {result.applied.kodomoRate}%</div>
                  {!isExecutive && <div>雇用保険 本人: {result.applied.koyoEmployeeRate}%({KOYO_INDUSTRY_LABELS[koyoIndustry]})</div>}
                  {!isExecutive && <div>雇用保険 会社: {result.applied.koyoEmployerRate}%</div>}
                  <div>所得税: {result.applied.taxYear}年分の計算式</div>
                </div>
              </section>

              <section className={cardCls}>
                <h2 className="font-bold text-gray-800 mb-1 border-l-4 border-green-600 pl-2">
                  本人(手取り){name && <span className="ml-2 text-gray-500 font-normal">{name} 様</span>}
                </h2>
                <p className="text-xs text-gray-500 mb-3">
                  標準報酬月額: {insuranceType === "kyokai" && `健保 ${yen(result.healthSmr)} / `}厚年 {yen(result.pensionSmr)}
                  {result.kaigoApplied && " ・介護保険第2号被保険者(40〜64歳)"}
                </p>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">総支給額</td>
                      <td className="py-2 text-right font-medium">{yen(grossSalary)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">
                        健康保険料{insuranceType === "kumiai" && "(全額本人負担)"}
                      </td>
                      <td className="py-2 text-right text-red-600">-{yen(result.healthEmployee)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">
                        介護保険料{!result.kaigoApplied && "(40〜64歳のみ・対象外)"}
                        {result.kaigoApplied && insuranceType === "kumiai" && "(全額本人負担)"}
                      </td>
                      <td className="py-2 text-right text-red-600">-{yen(result.kaigoEmployee)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">厚生年金保険料</td>
                      <td className="py-2 text-right text-red-600">-{yen(result.pensionEmployee)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">雇用保険料{isExecutive && "(役員対象外)"}</td>
                      <td className="py-2 text-right text-red-600">-{yen(result.koyoEmployee)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">
                        源泉所得税
                        {incomeTaxOverride !== null ? (
                          <>
                            <span className="ml-1 text-xs text-amber-600">(手動)</span>
                            <button
                              className="ml-2 text-xs text-blue-700 underline"
                              onClick={() => { setIncomeTaxOverride(null); setTaxOverrideStr(""); }}
                            >
                              自動計算に戻す
                            </button>
                          </>
                        ) : (
                          <span className="ml-1 text-xs text-gray-400">(修正可)</span>
                        )}
                      </td>
                      <td className="py-2 text-right text-red-600 whitespace-nowrap">
                        -
                        <input
                          type="number"
                          min={0}
                          step={10}
                          className="w-28 text-right border border-gray-300 rounded px-2 py-1 text-red-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={incomeTaxOverride !== null ? taxOverrideStr : String(result.incomeTax)}
                          onChange={(e) => {
                            setTaxOverrideStr(e.target.value);
                            setIncomeTaxOverride(Math.max(0, Number(e.target.value) || 0));
                          }}
                        />
                        {" 円"}
                      </td>
                    </tr>
                    {insuranceType === "kumiai" && (
                      <tr className="border-b">
                        <td className="py-2 text-gray-600">組合費</td>
                        <td className="py-2 text-right text-red-600">-{yen(result.kumiaiFee)}</td>
                      </tr>
                    )}
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">控除合計</td>
                      <td className="py-2 text-right">-{yen(result.totalEmployeeDeduction)}</td>
                    </tr>
                    {result.nenmatsuRefund > 0 && (
                      <tr className="border-b">
                        <td className="py-2 text-gray-600">年末調整 還付</td>
                        <td className="py-2 text-right text-green-700">+{yen(result.nenmatsuRefund)}</td>
                      </tr>
                    )}
                    {result.nenmatsuCollect > 0 && (
                      <tr className="border-b">
                        <td className="py-2 text-gray-600">年末調整 徴収</td>
                        <td className="py-2 text-right text-red-600">-{yen(result.nenmatsuCollect)}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="py-3 font-bold text-gray-800">手取り金額(差引支給額)</td>
                      <td className="py-3 text-right font-bold text-green-700 text-xl">{yen(result.netPay)}</td>
                    </tr>
                  </tbody>
                </table>
              </section>

              <section className={cardCls}>
                <h2 className="font-bold text-gray-800 mb-3 border-l-4 border-orange-500 pl-2">会社負担</h2>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">
                        健康保険料(会社分){insuranceType === "kumiai" && " ※全額本人負担のため0"}
                      </td>
                      <td className="py-2 text-right">{yen(result.healthEmployer)}</td>
                    </tr>
                    {insuranceType === "kyokai" && (
                      <tr className="border-b">
                        <td className="py-2 text-gray-600">介護保険料(会社分)</td>
                        <td className="py-2 text-right">{yen(result.kaigoEmployer)}</td>
                      </tr>
                    )}
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">厚生年金保険料(会社分)</td>
                      <td className="py-2 text-right">{yen(result.pensionEmployer)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">雇用保険料(会社分 {result.applied.koyoEmployerRate}%)</td>
                      <td className="py-2 text-right">{yen(result.koyoEmployer)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">労災保険料(全額会社)</td>
                      <td className="py-2 text-right">{yen(result.rousai)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">子ども・子育て拠出金({result.applied.kodomoRate}%)</td>
                      <td className="py-2 text-right">{yen(result.kodomoContribution)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-bold text-gray-800">会社負担合計</td>
                      <td className="py-2 text-right font-bold text-orange-600 text-lg">{yen(result.totalEmployerBurden)}</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-bold text-gray-800">会社総コスト(総支給+負担)</td>
                      <td className="py-3 text-right font-bold text-gray-900 text-xl">{yen(result.totalCompanyCost)}</td>
                    </tr>
                  </tbody>
                </table>
              </section>

              <section className={cardCls}>
                <div className="flex items-center gap-3">
                  <button
                    className="flex-1 py-3 rounded-xl bg-blue-700 text-white font-bold hover:bg-blue-800 transition-colors"
                    onClick={handleSave}
                  >
                    {editingId ? "更新して保存" : "この明細を保存"}
                  </button>
                  <button
                    className="px-4 py-3 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => router.push("/salary/records")}
                  >
                    明細一覧({records.length}件)
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  ※ 明細はこの端末(ブラウザ)内に保存されます。保存した明細は「明細一覧」で確認できます。
                </p>
              </section>

              <p className="text-xs text-gray-400 leading-relaxed">
                ※ 勤務月に応じて {KENPO_MIN_YEAR}(平成28)〜{KENPO_MAX_YEAR}(令和7)年度の公式料率
                (協会けんぽ都道府県別料率・介護保険・厚生年金・雇用保険(業種別)・子ども・子育て拠出金)を自動適用します。
                源泉所得税は支給年の電算機計算の特例(甲欄)により計算しています。
                住民税・通勤手当の非課税処理などは含みません。実際の給与計算では公式の保険料額表もあわせてご確認ください。
              </p>
            </>
          ) : (
            <section className={cardCls}>
              <p className="text-gray-500 text-sm">生年月日と給与額を入力すると自動計算されます。</p>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
