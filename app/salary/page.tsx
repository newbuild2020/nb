'use client';

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PREFECTURES,
  KAIGO_RATE,
  PENSION_RATE,
  KOYO_EMPLOYEE_RATE,
  KOYO_EMPLOYER_RATE,
  KODOMO_RATE,
  ROUSAI_DEFAULT_RATE,
  calcPayroll,
  type PayrollInput,
} from "../lib/payroll";

const MONTH_NAMES = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

function yen(n: number): string {
  return n.toLocaleString("ja-JP") + " 円";
}

export default function SalaryPage() {
  const router = useRouter();
  const now = new Date();

  const [name, setName] = useState("");
  const [birth, setBirth] = useState("1990-01-01");
  const [prefectureIndex, setPrefectureIndex] = useState(12); // 東京都
  const [isExecutive, setIsExecutive] = useState(false);
  const [workYear, setWorkYear] = useState(now.getFullYear());
  const [workMonth, setWorkMonth] = useState(now.getMonth() + 1);
  const [paymentOffset, setPaymentOffset] = useState<0 | 1 | 2>(1);
  const [grossSalary, setGrossSalary] = useState(300000);
  const [dependents, setDependents] = useState(0);
  const [insuranceType, setInsuranceType] = useState<"kyokai" | "kumiai">("kyokai");
  const [kumiaiHealthEmployeeRate, setKumiaiHealthEmployeeRate] = useState(4.5);
  const [kumiaiHealthEmployerRate, setKumiaiHealthEmployerRate] = useState(5.5);
  const [kumiaiKaigoEmployeeRate, setKumiaiKaigoEmployeeRate] = useState(0.8);
  const [kumiaiKaigoEmployerRate, setKumiaiKaigoEmployerRate] = useState(0.8);
  const [kumiaiFee, setKumiaiFee] = useState(0);
  const [rousaiRate, setRousaiRate] = useState(ROUSAI_DEFAULT_RATE);

  const result = useMemo(() => {
    if (!birth || grossSalary <= 0) return null;
    const input: PayrollInput = {
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
      kumiaiHealthEmployeeRate,
      kumiaiHealthEmployerRate,
      kumiaiKaigoEmployeeRate,
      kumiaiKaigoEmployerRate,
      kumiaiFee,
      rousaiRate,
    };
    try {
      return calcPayroll(input);
    } catch {
      return null;
    }
  }, [
    name, birth, prefectureIndex, isExecutive, workYear, workMonth, paymentOffset,
    grossSalary, dependents, insuranceType, kumiaiHealthEmployeeRate, kumiaiHealthEmployerRate,
    kumiaiKaigoEmployeeRate, kumiaiKaigoEmployerRate, kumiaiFee, rousaiRate,
  ]);

  const labelCls = "block text-sm font-medium text-gray-700 mb-1";
  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
  const cardCls = "bg-white rounded-2xl shadow p-5";

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
          <section className={cardCls}>
            <h2 className="font-bold text-gray-800 mb-4 border-l-4 border-blue-700 pl-2">基本情報</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>氏名</label>
                <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="山田 太郎" />
              </div>
              <div>
                <label className={labelCls}>生年月日</label>
                <input type="date" className={inputCls} value={birth} onChange={(e) => setBirth(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>地域(都道府県)</label>
                <select className={inputCls} value={prefectureIndex} onChange={(e) => setPrefectureIndex(Number(e.target.value))}>
                  {PREFECTURES.map((p, i) => (
                    <option key={p.name} value={i}>
                      {p.name}(健保 {p.rate}%)
                    </option>
                  ))}
                </select>
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
                  type="number" min={0} max={10} className={inputCls}
                  value={dependents}
                  onChange={(e) => setDependents(Math.max(0, Number(e.target.value) || 0))}
                />
              </div>
            </div>
            {isExecutive && (
              <p className="text-xs text-amber-600 mt-3">※ 役員は雇用保険・労災保険の対象外として計算します。</p>
            )}
          </section>

          <section className={cardCls}>
            <h2 className="font-bold text-gray-800 mb-4 border-l-4 border-blue-700 pl-2">勤務月・支給月・給与</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>勤務月(対象月)</label>
                <input
                  type="month" className={inputCls}
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
              <div className="col-span-2">
                <label className={labelCls}>月額給与(総支給額・円)</label>
                <input
                  type="number" min={0} step={1000} className={inputCls}
                  value={grossSalary}
                  onChange={(e) => setGrossSalary(Math.max(0, Number(e.target.value) || 0))}
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
                組合健保(健保組合)
              </button>
            </div>

            {insuranceType === "kyokai" ? (
              <p className="text-sm text-gray-600">
                {PREFECTURES[prefectureIndex].name} の料率 {PREFECTURES[prefectureIndex].rate}%(介護保険 {KAIGO_RATE}%)を労使折半で計算します。
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>健康保険料率 本人負担(%)</label>
                  <input type="number" step={0.01} min={0} className={inputCls}
                    value={kumiaiHealthEmployeeRate}
                    onChange={(e) => setKumiaiHealthEmployeeRate(Math.max(0, Number(e.target.value) || 0))} />
                </div>
                <div>
                  <label className={labelCls}>健康保険料率 会社負担(%)</label>
                  <input type="number" step={0.01} min={0} className={inputCls}
                    value={kumiaiHealthEmployerRate}
                    onChange={(e) => setKumiaiHealthEmployerRate(Math.max(0, Number(e.target.value) || 0))} />
                </div>
                <div>
                  <label className={labelCls}>介護保険料率 本人負担(%)</label>
                  <input type="number" step={0.01} min={0} className={inputCls}
                    value={kumiaiKaigoEmployeeRate}
                    onChange={(e) => setKumiaiKaigoEmployeeRate(Math.max(0, Number(e.target.value) || 0))} />
                </div>
                <div>
                  <label className={labelCls}>介護保険料率 会社負担(%)</label>
                  <input type="number" step={0.01} min={0} className={inputCls}
                    value={kumiaiKaigoEmployerRate}
                    onChange={(e) => setKumiaiKaigoEmployerRate(Math.max(0, Number(e.target.value) || 0))} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>組合費(円/月・給与から控除)</label>
                  <input type="number" min={0} step={100} className={inputCls}
                    value={kumiaiFee}
                    onChange={(e) => setKumiaiFee(Math.max(0, Number(e.target.value) || 0))} />
                </div>
              </div>
            )}

            {!isExecutive && (
              <div className="mt-4">
                <label className={labelCls}>労災保険料率(%・会社全額負担)</label>
                <input type="number" step={0.05} min={0} className={inputCls}
                  value={rousaiRate}
                  onChange={(e) => setRousaiRate(Math.max(0, Number(e.target.value) || 0))} />
              </div>
            )}
          </section>
        </div>

        {/* ==== 計算結果 ==== */}
        <div className="space-y-6">
          {result ? (
            <>
              <section className={cardCls}>
                <h2 className="font-bold text-gray-800 mb-1 border-l-4 border-green-600 pl-2">
                  本人(手取り){name && <span className="ml-2 text-gray-500 font-normal">{name} 様</span>}
                </h2>
                <p className="text-xs text-gray-500 mb-3">
                  標準報酬月額: 健保 {yen(result.healthSmr)} / 厚年 {yen(result.pensionSmr)}
                  {result.kaigoApplied && " ・介護保険第2号被保険者(40〜64歳)"}
                </p>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">総支給額</td>
                      <td className="py-2 text-right font-medium">{yen(grossSalary)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">健康保険料</td>
                      <td className="py-2 text-right text-red-600">-{yen(result.healthEmployee)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">介護保険料</td>
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
                      <td className="py-2 text-gray-600">源泉所得税</td>
                      <td className="py-2 text-right text-red-600">-{yen(result.incomeTax)}</td>
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
                      <td className="py-2 text-gray-600">健康保険料(会社分)</td>
                      <td className="py-2 text-right">{yen(result.healthEmployer)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">介護保険料(会社分)</td>
                      <td className="py-2 text-right">{yen(result.kaigoEmployer)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">厚生年金保険料(会社分)</td>
                      <td className="py-2 text-right">{yen(result.pensionEmployer)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">雇用保険料(会社分 {KOYO_EMPLOYER_RATE}%)</td>
                      <td className="py-2 text-right">{yen(result.koyoEmployer)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">労災保険料(全額会社)</td>
                      <td className="py-2 text-right">{yen(result.rousai)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">子ども・子育て拠出金({KODOMO_RATE}%)</td>
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

              <p className="text-xs text-gray-400 leading-relaxed">
                ※ 令和7年度の協会けんぽ料率・厚生年金 {PENSION_RATE}%・雇用保険(一般の事業 本人{KOYO_EMPLOYEE_RATE}%/会社{KOYO_EMPLOYER_RATE}%)、
                源泉所得税は電算機計算の特例(甲欄・令和7年分)により計算しています。
                住民税・通勤手当の非課税処理などは含みません。実際の給与計算では最新の官方料率をご確認ください。
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
