'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PREFECTURE_NAMES } from "../../lib/payroll";
import { useRequireLogin } from "../../lib/auth";
import {
  loadSalaryRecords,
  deleteSalaryRecord,
  exportSalaryCsv,
  type SalaryRecord,
} from "../../lib/salaryStore";
import { syncSalaryRecords } from "../../lib/cloudSync";

function yen(n: number): string {
  return n.toLocaleString("ja-JP") + " 円";
}

export default function SalaryRecordsPage() {
  const router = useRouter();
  const authed = useRequireLogin();

  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    setRecords(loadSalaryRecords());
    // クラウドと同期(オフライン時はローカルのまま)
    syncSalaryRecords().then((list) => { if (list) setRecords(list); });
  }, []);

  function handleDelete(r: SalaryRecord) {
    if (!confirm(`${r.input.name} さんの ${r.result.paymentYear}年${r.result.paymentMonth}月支給分を削除しますか?`)) return;
    setRecords(deleteSalaryRecord(r.id));
    if (openId === r.id) setOpenId(null);
  }

  const cardCls = "bg-white rounded-2xl shadow p-5";

  if (!authed) return null;

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <header className="bg-blue-800 text-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow">
        <button onClick={() => router.push("/")} className="text-white text-2xl leading-none" aria-label="戻る">
          ←
        </button>
        <h1 className="text-lg font-bold">明細一覧(過去の記録)</h1>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        <section className={cardCls}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
            <h2 className="font-bold text-gray-800 border-l-4 border-blue-700 pl-2">
              保存済みの明細({records.length}件)
            </h2>
            <div className="flex gap-2">
              {records.length > 0 && (
                <button
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => exportSalaryCsv(records, PREFECTURE_NAMES)}
                >
                  CSV出力
                </button>
              )}
              <button
                className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800"
                onClick={() => router.push("/salary")}
              >
                明細を作成
              </button>
            </div>
          </div>

          {records.length === 0 ? (
            <p className="text-sm text-gray-500">
              まだ保存された明細がありません。「明細を作成」から計算して保存してください。
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2 pr-4">保存日時</th>
                    <th className="py-2 pr-4">管理番号</th>
                    <th className="py-2 pr-4">氏名</th>
                    <th className="py-2 pr-4">勤務月</th>
                    <th className="py-2 pr-4">支給月</th>
                    <th className="py-2 pr-4 text-right">総支給額</th>
                    <th className="py-2 pr-4 text-right">手取り</th>
                    <th className="py-2 pr-4 text-right">会社負担</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} className="border-b last:border-b-0 align-top">
                      <td className="py-2 pr-4 text-gray-500">
                        {new Date(r.savedAt).toLocaleString("ja-JP", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="py-2 pr-4 font-mono">{r.person?.code ?? "-"}</td>
                      <td className="py-2 pr-4 font-medium">{r.input.name}</td>
                      <td className="py-2 pr-4">{r.input.workYear}/{String(r.input.workMonth).padStart(2, "0")}</td>
                      <td className="py-2 pr-4">{r.result.paymentYear}/{String(r.result.paymentMonth).padStart(2, "0")}</td>
                      <td className="py-2 pr-4 text-right">{yen(r.input.grossSalary)}</td>
                      <td className="py-2 pr-4 text-right font-medium text-green-700">{yen(r.result.netPay)}</td>
                      <td className="py-2 pr-4 text-right">{yen(r.result.totalEmployerBurden)}</td>
                      <td className="py-2 text-right">
                        <button
                          className="text-blue-700 hover:underline mr-3"
                          onClick={() => setOpenId(openId === r.id ? null : r.id)}
                        >
                          {openId === r.id ? "閉じる" : "詳細"}
                        </button>
                        <button
                          className="text-blue-700 hover:underline mr-3"
                          onClick={() => {
                            sessionStorage.setItem("salaryEditRecordId", r.id);
                            router.push("/salary");
                          }}
                        >
                          編集
                        </button>
                        <button className="text-red-600 hover:underline" onClick={() => handleDelete(r)}>削除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ==== 詳細表示 ==== */}
        {records.filter((r) => r.id === openId).map((r) => (
          <section key={r.id} className={cardCls}>
            <h2 className="font-bold text-gray-800 mb-1 border-l-4 border-green-600 pl-2">
              {r.input.name} 様 {r.result.paymentYear}年{r.result.paymentMonth}月支給分
              (勤務月 {r.input.workYear}年{r.input.workMonth}月)
            </h2>
            <p className="text-xs text-gray-500 mb-1">
              {r.person && <>管理番号 <span className="font-mono">{r.person.code}</span> / </>}
              {PREFECTURE_NAMES[r.input.prefectureIndex]} / {r.input.isExecutive ? "役員" : "社員"} /
              {r.input.insuranceType === "kyokai" ? " 協会けんぽ" : " 国保組合・その他"} /
              適用料率 {r.result.applied?.kenpoFiscalLabel ?? "-"}
            </p>
            {r.person && (
              <p className="text-xs text-gray-500 mb-4">
                対象月時点の記録: 住所 {r.person.address || "-"}
                {r.person.hireDate && ` / 入社日 ${r.person.hireDate}`}
              </p>
            )}
            {!r.person && <span className="block mb-3" />}
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-2">本人(手取り)</h3>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b"><td className="py-1.5 text-gray-600">総支給額</td><td className="py-1.5 text-right">{yen(r.input.grossSalary)}</td></tr>
                    <tr className="border-b"><td className="py-1.5 text-gray-600">健康保険料</td><td className="py-1.5 text-right text-red-600">-{yen(r.result.healthEmployee)}</td></tr>
                    <tr className="border-b"><td className="py-1.5 text-gray-600">介護保険料</td><td className="py-1.5 text-right text-red-600">-{yen(r.result.kaigoEmployee)}</td></tr>
                    <tr className="border-b"><td className="py-1.5 text-gray-600">厚生年金保険料</td><td className="py-1.5 text-right text-red-600">-{yen(r.result.pensionEmployee)}</td></tr>
                    <tr className="border-b"><td className="py-1.5 text-gray-600">雇用保険料</td><td className="py-1.5 text-right text-red-600">-{yen(r.result.koyoEmployee)}</td></tr>
                    <tr className="border-b"><td className="py-1.5 text-gray-600">源泉所得税</td><td className="py-1.5 text-right text-red-600">-{yen(r.result.incomeTax)}</td></tr>
                    {r.result.kumiaiFee > 0 && (
                      <tr className="border-b"><td className="py-1.5 text-gray-600">組合費</td><td className="py-1.5 text-right text-red-600">-{yen(r.result.kumiaiFee)}</td></tr>
                    )}
                    {(r.result.nenmatsuRefund ?? 0) > 0 && (
                      <tr className="border-b"><td className="py-1.5 text-gray-600">年末調整 還付</td><td className="py-1.5 text-right text-green-700">+{yen(r.result.nenmatsuRefund)}</td></tr>
                    )}
                    {(r.result.nenmatsuCollect ?? 0) > 0 && (
                      <tr className="border-b"><td className="py-1.5 text-gray-600">年末調整 徴収</td><td className="py-1.5 text-right text-red-600">-{yen(r.result.nenmatsuCollect)}</td></tr>
                    )}
                    <tr><td className="py-2 font-bold">手取り金額</td><td className="py-2 text-right font-bold text-green-700 text-lg">{yen(r.result.netPay)}</td></tr>
                  </tbody>
                </table>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-2">会社負担</h3>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b"><td className="py-1.5 text-gray-600">健康保険料(会社分)</td><td className="py-1.5 text-right">{yen(r.result.healthEmployer)}</td></tr>
                    <tr className="border-b"><td className="py-1.5 text-gray-600">介護保険料(会社分)</td><td className="py-1.5 text-right">{yen(r.result.kaigoEmployer)}</td></tr>
                    <tr className="border-b"><td className="py-1.5 text-gray-600">厚生年金保険料(会社分)</td><td className="py-1.5 text-right">{yen(r.result.pensionEmployer)}</td></tr>
                    <tr className="border-b"><td className="py-1.5 text-gray-600">雇用保険料(会社分)</td><td className="py-1.5 text-right">{yen(r.result.koyoEmployer)}</td></tr>
                    <tr className="border-b"><td className="py-1.5 text-gray-600">労災保険料</td><td className="py-1.5 text-right">{yen(r.result.rousai)}</td></tr>
                    <tr className="border-b"><td className="py-1.5 text-gray-600">子ども・子育て拠出金</td><td className="py-1.5 text-right">{yen(r.result.kodomoContribution)}</td></tr>
                    <tr className="border-b"><td className="py-1.5 font-bold">会社負担合計</td><td className="py-1.5 text-right font-bold text-orange-600">{yen(r.result.totalEmployerBurden)}</td></tr>
                    <tr><td className="py-2 font-bold">会社総コスト</td><td className="py-2 text-right font-bold text-lg">{yen(r.result.totalCompanyCost)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
