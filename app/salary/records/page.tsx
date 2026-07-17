'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PREFECTURE_NAMES } from "../../lib/payroll";
import { useRequireLogin } from "../../lib/auth";
import {
  loadSalaryRecords,
  deleteSalaryRecord,
  exportSalaryCsv,
  exportCostCsv,
  exportBackupJson,
  recordCost,
  type SalaryRecord,
} from "../../lib/salaryStore";
import { loadPeople } from "../../lib/peopleStore";
import { syncSalaryRecords } from "../../lib/cloudSync";

function yen(n: number): string {
  return n.toLocaleString("ja-JP") + " 円";
}

type GroupMode = "month" | "year" | "person";

const GROUP_LABELS: Record<GroupMode, string> = {
  month: "月ごと",
  year: "年ごと",
  person: "人ごと",
};

/** 勤務月を通算キーに */
function workKey(r: SalaryRecord): number {
  return r.input.workYear * 12 + (r.input.workMonth - 1);
}

/** "YYYY-MM" を通算キーに(空なら null) */
function parseMonth(v: string): number | null {
  const m = v.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  return parseInt(m[1], 10) * 12 + (parseInt(m[2], 10) - 1);
}

export default function SalaryRecordsPage() {
  const router = useRouter();
  const authed = useRequireLogin();

  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [groupMode, setGroupMode] = useState<GroupMode>("month");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterName, setFilterName] = useState("");
  // 既定は全グループ折りたたみ。展開したものだけ true を持つ
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setRecords(loadSalaryRecords());
    syncSalaryRecords().then((list) => { if (list) setRecords(list); });
  }, []);

  function handleDelete(r: SalaryRecord) {
    if (!confirm(`${r.input.name} さんの ${r.result.paymentYear}年${r.result.paymentMonth}月支給分を削除しますか?`)) return;
    setRecords(deleteSalaryRecord(r.id));
    if (openId === r.id) setOpenId(null);
  }

  // ---- 絞り込み(勤務月の範囲 + 氏名/管理番号) ----
  const filtered = useMemo(() => {
    const from = parseMonth(filterFrom);
    const to = parseMonth(filterTo);
    const q = filterName.trim().toLowerCase();
    return records.filter((r) => {
      const k = workKey(r);
      if (from !== null && k < from) return false;
      if (to !== null && k > to) return false;
      if (q) {
        const name = r.input.name.toLowerCase();
        const code = (r.person?.code ?? "").toLowerCase();
        if (!name.includes(q) && !code.includes(q)) return false;
      }
      return true;
    });
  }, [records, filterFrom, filterTo, filterName]);

  // ---- 並び替え/グループ化(ツリー) ----
  const groups = useMemo(() => {
    const map = new Map<string, { label: string; sort: number; items: SalaryRecord[] }>();
    for (const r of filtered) {
      let gkey: string, label: string, sort: number;
      if (groupMode === "month") {
        gkey = `m${r.input.workYear}-${r.input.workMonth}`;
        label = `${r.input.workYear}年${r.input.workMonth}月`;
        sort = -workKey(r); // 新しい月を上に
      } else if (groupMode === "year") {
        gkey = `y${r.input.workYear}`;
        label = `${r.input.workYear}年`;
        sort = -r.input.workYear;
      } else {
        gkey = `p${r.person?.code ?? r.input.name}`;
        label = `${r.person?.code ? r.person.code + " " : ""}${r.input.name}`;
        sort = 0; // 後で管理番号/氏名で整列
      }
      if (!map.has(gkey)) map.set(gkey, { label, sort, items: [] });
      map.get(gkey)!.items.push(r);
    }
    const arr = [...map.entries()].map(([gkey, g]) => ({ gkey, ...g }));
    // グループの並び
    if (groupMode === "person") {
      arr.sort((a, b) => a.label.localeCompare(b.label, "ja", { numeric: true }));
    } else {
      arr.sort((a, b) => a.sort - b.sort);
    }
    // グループ内: 勤務月の新しい順、同月は保存日時の新しい順
    for (const g of arr) {
      g.items.sort((a, b) => {
        const dk = workKey(b) - workKey(a);
        if (dk !== 0) return dk;
        return a.savedAt < b.savedAt ? 1 : -1;
      });
    }
    return arr;
  }, [filtered, groupMode]);

  const cardCls = "bg-white rounded-2xl shadow p-5";
  const filteredCount = filtered.length;

  // CSV出力は画面の並び(月ごと/年ごと/人ごとの表示順)に従う。
  // 「人ごと」を選べば氏名順→勤務月順、「月ごと」なら勤務月順で出力される。
  const exportList = useMemo(() => groups.flatMap((g) => g.items), [groups]);

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
        {/* ==== 操作パネル ==== */}
        <section className={cardCls}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="font-bold text-gray-800 border-l-4 border-blue-700 pl-2">
              保存済みの明細(全{records.length}件 / 表示{filteredCount}件)
            </h2>
            <button
              className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 self-start"
              onClick={() => router.push("/salary")}
            >
              明細を作成
            </button>
          </div>

          {/* 絞り込み(勤務月 範囲 + 氏名/管理番号) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">勤務月(開始)</label>
              <input type="month" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">勤務月(終了)</label>
              <input type="month" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">氏名・管理番号で検索</label>
              <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                placeholder="例: 王鑫 / NB-01"
                value={filterName} onChange={(e) => setFilterName(e.target.value)} />
            </div>
          </div>
          {(filterFrom || filterTo || filterName) && (
            <button className="text-xs text-blue-700 underline mb-4" onClick={() => { setFilterFrom(""); setFilterTo(""); setFilterName(""); }}>
              絞り込みを解除
            </button>
          )}

          {/* 並び替え(グループ) */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs text-gray-500">表示:</span>
            {(Object.keys(GROUP_LABELS) as GroupMode[]).map((m) => (
              <button
                key={m}
                className={`px-3 py-1.5 rounded-full text-sm border ${
                  groupMode === m ? "bg-blue-700 text-white border-blue-700" : "bg-white text-gray-600 border-gray-300"
                }`}
                onClick={() => setGroupMode(m)}
              >
                {GROUP_LABELS[m]}
              </button>
            ))}
          </div>

          {/* 出力(絞り込み結果に基づく) */}
          <div className="flex flex-wrap gap-2">
            <button
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              disabled={filteredCount === 0}
              onClick={() => exportSalaryCsv(exportList, PREFECTURE_NAMES)}
            >
              Excel出力({filteredCount}件)
            </button>
            <button
              className="px-4 py-2 rounded-lg border border-orange-300 text-sm text-orange-700 hover:bg-orange-50 disabled:opacity-40"
              disabled={filteredCount === 0}
              onClick={() => exportCostCsv(exportList)}
            >
              コスト出力({filteredCount}件)
            </button>
            <button
              className="px-4 py-2 rounded-lg border border-green-400 text-sm text-green-700 hover:bg-green-50"
              onClick={() => exportBackupJson(loadPeople(), records)}
              title="人員と明細の全データをJSONで保存(データベースの生データ)"
            >
              データバックアップ(全件)
            </button>
          </div>
        </section>

        {/* ==== ツリー表示 ==== */}
        {filteredCount === 0 ? (
          <section className={cardCls}>
            <p className="text-sm text-gray-500">
              {records.length === 0
                ? "まだ保存された明細がありません。「明細を作成」から計算して保存してください。"
                : "条件に一致する明細がありません。絞り込みを変更してください。"}
            </p>
          </section>
        ) : (
          groups.map((g) => {
            const isCollapsed = !expanded[g.gkey];
            const groupCost = g.items.reduce((sum, r) => sum + recordCost(r), 0);
            return (
              <section key={g.gkey} className={cardCls}>
                <button
                  className="w-full flex items-center justify-between gap-2 mb-1"
                  onClick={() => setExpanded((c) => ({ ...c, [g.gkey]: !c[g.gkey] }))}
                >
                  <span className="font-bold text-gray-800 flex items-center gap-2">
                    <span className="text-gray-400">{isCollapsed ? "▸" : "▾"}</span>
                    {g.label}
                    <span className="text-xs font-normal text-gray-400">({g.items.length}件)</span>
                  </span>
                  <span className="text-xs text-gray-500">コスト計 {yen(groupCost)}</span>
                </button>

                {!isCollapsed && (
                  <div className="overflow-x-auto mt-2">
                    <table className="w-full text-sm whitespace-nowrap">
                      <thead>
                        <tr className="text-left text-gray-500 border-b">
                          <th className="py-2 pr-4">管理番号</th>
                          <th className="py-2 pr-4">氏名</th>
                          <th className="py-2 pr-4">勤務月</th>
                          <th className="py-2 pr-4">支給日</th>
                          <th className="py-2 pr-4 text-right">総支給額</th>
                          <th className="py-2 pr-4 text-right">手取り</th>
                          <th className="py-2 pr-4 text-right">コスト</th>
                          <th className="py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.items.map((r) => (
                          <tr key={r.id} className="border-b last:border-b-0 align-top">
                            <td className="py-2 pr-4 font-mono">{r.person?.code ?? "-"}</td>
                            <td className="py-2 pr-4 font-medium">{r.input.name}</td>
                            <td className="py-2 pr-4">{r.input.workYear}/{String(r.input.workMonth).padStart(2, "0")}</td>
                            <td className="py-2 pr-4">
                              {r.result.paymentYear}/{String(r.result.paymentMonth).padStart(2, "0")}
                              {r.result.paymentDay ? `/${String(r.result.paymentDay).padStart(2, "0")}` : ""}
                            </td>
                            <td className="py-2 pr-4 text-right">{yen(r.input.grossSalary)}</td>
                            <td className="py-2 pr-4 text-right font-medium text-green-700">{yen(r.result.netPay)}</td>
                            <td className="py-2 pr-4 text-right">{yen(recordCost(r))}</td>
                            <td className="py-2 text-right">
                              <button className="text-blue-700 hover:underline mr-3" onClick={() => setOpenId(openId === r.id ? null : r.id)}>
                                {openId === r.id ? "閉じる" : "詳細"}
                              </button>
                              <button
                                className="text-blue-700 hover:underline mr-3"
                                onClick={() => { sessionStorage.setItem("salaryEditRecordId", r.id); router.push("/salary"); }}
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

                {/* このグループ内で開いている詳細 */}
                {!isCollapsed && g.items.filter((r) => r.id === openId).map((r) => (
                  <DetailBlock key={r.id} r={r} />
                ))}
              </section>
            );
          })
        )}
      </main>
    </div>
  );
}

function DetailBlock({ r }: { r: SalaryRecord }) {
  return (
    <div className="mt-4 pt-4 border-t border-dashed">
      <h3 className="font-bold text-gray-800 mb-1 border-l-4 border-green-600 pl-2">
        {r.input.name} 様 {r.result.paymentYear}年{r.result.paymentMonth}月支給分
        (勤務月 {r.input.workYear}年{r.input.workMonth}月)
      </h3>
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
          <h4 className="text-sm font-bold text-gray-700 mb-2">本人(手取り)</h4>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b"><td className="py-1.5 text-gray-600">総支給額</td><td className="py-1.5 text-right">{yen(r.input.grossSalary)}</td></tr>
              <tr className="border-b"><td className="py-1.5 text-gray-600">健康保険料</td><td className="py-1.5 text-right text-red-600">-{yen(r.result.healthEmployee)}</td></tr>
              <tr className="border-b"><td className="py-1.5 text-gray-600">介護保険料</td><td className="py-1.5 text-right text-red-600">-{yen(r.result.kaigoEmployee)}</td></tr>
              <tr className="border-b"><td className="py-1.5 text-gray-600">厚生年金保険料</td><td className="py-1.5 text-right text-red-600">-{yen(r.result.pensionEmployee)}</td></tr>
              <tr className="border-b"><td className="py-1.5 text-gray-600">雇用保険料</td><td className="py-1.5 text-right text-red-600">-{yen(r.result.koyoEmployee)}</td></tr>
              <tr className="border-b"><td className="py-1.5 text-gray-600">源泉所得税</td><td className="py-1.5 text-right text-red-600">-{yen(r.result.incomeTax)}</td></tr>
              {(r.result.shienkinEmployee ?? 0) > 0 && (
                <tr className="border-b"><td className="py-1.5 text-gray-600">子ども・子育て支援金</td><td className="py-1.5 text-right text-red-600">-{yen(r.result.shienkinEmployee)}</td></tr>
              )}
              {r.result.kumiaiFee > 0 && (
                <tr className="border-b"><td className="py-1.5 text-gray-600">組合費</td><td className="py-1.5 text-right text-red-600">-{yen(r.result.kumiaiFee)}</td></tr>
              )}
              {(r.result.kenrenKyosai ?? 0) > 0 && (
                <tr className="border-b"><td className="py-1.5 text-gray-600">県連共済費</td><td className="py-1.5 text-right text-red-600">-{yen(r.result.kenrenKyosai)}</td></tr>
              )}
              <tr className="border-b"><td className="py-1.5 text-gray-600">年末調整 還付</td><td className="py-1.5 text-right text-green-700">+{yen(r.result.nenmatsuRefund ?? 0)}</td></tr>
              <tr className="border-b"><td className="py-1.5 text-gray-600">年末調整 徴収</td><td className="py-1.5 text-right text-red-600">-{yen(r.result.nenmatsuCollect ?? 0)}</td></tr>
              <tr><td className="py-2 font-bold">手取り金額</td><td className="py-2 text-right font-bold text-green-700 text-lg">{yen(r.result.netPay)}</td></tr>
            </tbody>
          </table>
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-700 mb-2">会社負担</h4>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b"><td className="py-1.5 text-gray-600">健康保険料(会社分)</td><td className="py-1.5 text-right">{yen(r.result.healthEmployer)}</td></tr>
              <tr className="border-b"><td className="py-1.5 text-gray-600">介護保険料(会社分)</td><td className="py-1.5 text-right">{yen(r.result.kaigoEmployer)}</td></tr>
              <tr className="border-b"><td className="py-1.5 text-gray-600">厚生年金保険料(会社分)</td><td className="py-1.5 text-right">{yen(r.result.pensionEmployer)}</td></tr>
              <tr className="border-b"><td className="py-1.5 text-gray-600">雇用保険料(会社分)</td><td className="py-1.5 text-right">{yen(r.result.koyoEmployer)}</td></tr>
              <tr className="border-b"><td className="py-1.5 text-gray-600">労災保険料</td><td className="py-1.5 text-right">{yen(r.result.rousai)}</td></tr>
              <tr className="border-b"><td className="py-1.5 text-gray-600">子ども・子育て拠出金</td><td className="py-1.5 text-right">{yen(r.result.kodomoContribution)}</td></tr>
              {(r.result.shienkinEmployer ?? 0) > 0 && (
                <tr className="border-b"><td className="py-1.5 text-gray-600">子ども・子育て支援金(会社分)</td><td className="py-1.5 text-right">{yen(r.result.shienkinEmployer)}</td></tr>
              )}
              <tr className="border-b"><td className="py-1.5 font-bold">会社負担合計</td><td className="py-1.5 text-right font-bold text-orange-600">{yen(r.result.totalEmployerBurden)}</td></tr>
              <tr><td className="py-2 font-bold">コスト合計</td><td className="py-2 text-right font-bold text-lg">{yen(recordCost(r))}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
