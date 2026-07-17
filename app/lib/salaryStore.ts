/**
 * 給与明細の保存(ブラウザの localStorage)。
 * このアプリの名簿データと同じ方式で、端末内に保存される。
 * 将来クラウドDB(Supabase等)に移行する場合はこのファイルの
 * 実装を差し替えるだけでよい。
 */

import type { PayrollInput, PayrollResult } from "./payroll";
import type { PersonRole } from "./peopleStore";
import { pushItem, pushTombstone } from "./supabaseClient";

/**
 * 明細作成時点の人員情報スナップショット。
 * 後から住所などが変わっても、対象月時点の情報が明細に残る。
 */
export interface PersonSnapshot {
  code: string; // 管理番号
  role: PersonRole; // 職務(役員/社員)
  address: string; // 住所(都道府県+詳細)
  hireDate: string; // 入社年月日
}

export interface SalaryRecord {
  id: string;
  savedAt: string; // ISO日時
  input: PayrollInput;
  result: PayrollResult;
  person?: PersonSnapshot; // 人員選択から作成した場合のみ
}

const KEY = "salaryRecords";

export function loadSalaryRecords(): SalaryRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as SalaryRecord[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveSalaryRecord(
  input: PayrollInput,
  result: PayrollResult,
  person?: PersonSnapshot
): SalaryRecord {
  const record: SalaryRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    savedAt: new Date().toISOString(),
    input,
    result,
    ...(person ? { person } : {}),
  };
  const list = loadSalaryRecords();
  list.unshift(record); // 新しい順
  localStorage.setItem(KEY, JSON.stringify(list));
  pushItem("salary_records", record.id, record);
  return record;
}

/** 既存明細を上書き更新する(idは保持、保存日時は更新。personは指定時のみ差し替え) */
export function updateSalaryRecord(
  id: string,
  input: PayrollInput,
  result: PayrollResult,
  person?: PersonSnapshot
): SalaryRecord[] {
  const list = loadSalaryRecords().map((r) =>
    r.id === id
      ? { ...r, input, result, savedAt: new Date().toISOString(), ...(person ? { person } : {}) }
      : r
  );
  localStorage.setItem(KEY, JSON.stringify(list));
  const updated = list.find((r) => r.id === id);
  if (updated) pushItem("salary_records", id, updated);
  return list;
}

export function deleteSalaryRecord(id: string): SalaryRecord[] {
  const list = loadSalaryRecords().filter((r) => r.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
  pushTombstone("salary_records", id);
  return list;
}

/** クラウド同期後のリストで丸ごと置き換える(cloudSync用) */
export function overwriteSalaryRecords(list: SalaryRecord[]): void {
  const sorted = [...list].sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1)); // 新しい順
  localStorage.setItem(KEY, JSON.stringify(sorted));
}

/**
 * ヘッダー行にオートフィルタ(クリックで並べ替え・絞り込み)付きの
 * Excelファイル(.xlsx)としてダウンロードする。
 */
async function downloadExcel(
  header: string[],
  rows: (string | number)[][],
  prefix: string,
  sheetName: string
): Promise<void> {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  // 全列にオートフィルタ(氏名・勤務月などをクリックで並べ替え可能)
  ws["!autofilter"] = {
    ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: header.length - 1 } }),
  };
  // 数値セルは桁区切り+負数(控除額)を赤字で表示
  const range = XLSX.utils.decode_range(ws["!ref"] as string);
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (cell && cell.t === "n") cell.z = "#,##0;[Red]-#,##0";
    }
  }
  // 列幅は見出し・データの実際の表示幅(全角=2)に合わせる(文字が切れない最小限)
  const dispWidth = (s: string): number => {
    let w = 0;
    for (const ch of s) w += ch.charCodeAt(0) > 0xff ? 2 : 1;
    return w;
  };
  ws["!cols"] = header.map((h, c) => {
    let w = dispWidth(h) + 3; // +3 はオートフィルタの▼ボタン分
    for (const row of rows) {
      const v = row[c];
      if (v == null || v === "") continue;
      const s = typeof v === "number" ? v.toLocaleString("en-US") : String(v);
      w = Math.max(w, dispWidth(s) + 1);
    }
    return { wch: w };
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${prefix}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * 列見出しに公式料率(%)を埋め込む(画面の行ラベルと同じ書式)。
 * 出力対象の全明細で率が同じなら「9.92%」、年度をまたいで異なる
 * 場合は範囲ではなく「1.59%・1.62%」と各料率をそのまま列挙する
 * (どの行がどの率かは「適用年度」列で判別できる)。
 * 率で計算していない明細(定額の組合保険など)は無視する。
 */
function rateHeader(base: string, values: (number | string)[], note = "", noteFirst = false): string {
  const nums = [...new Set(values.filter((v): v is number => typeof v === "number"))].sort((a, b) => a - b);
  if (nums.length === 0) return base;
  const label = nums.map((n) => `${n}%`).join("・");
  const inner = noteFirst ? `${note} ${label}` : note ? `${label} ${note}` : label;
  return `${base}(${inner})`;
}

/**
 * 明細に実際に適用された公式料率(%)。payrollRates.ts の
 * 年度別公式データから計算時に確定した値(result.applied)をそのまま使う。
 * 率で計算していない項目(定額の組合保険・役員の雇用/労災など)は空欄。
 */
function appliedRateCols(r: SalaryRecord): {
  fiscalLabel: string;
  kenpo: number | string;
  kaigo: number | string;
  pension: number | string;
  koyoEmp: number | string;
  koyoComp: number | string;
  rousai: number | string;
  kodomo: number | string;
  shienkin: number | string;
} {
  const a = r.result.applied;
  const i = r.input;
  const kyokai = i.insuranceType === "kyokai";
  const exec = i.isExecutive;
  return {
    fiscalLabel: a?.kenpoFiscalLabel ?? "",
    kenpo: kyokai ? a?.kenpoRate ?? "" : "",
    kaigo: kyokai && r.result.kaigoApplied ? a?.kaigoRate ?? "" : "",
    pension: a?.pensionRate ?? "",
    koyoEmp: exec ? "" : a?.koyoEmployeeRate ?? "",
    koyoComp: exec ? "" : a?.koyoEmployerRate ?? "",
    rousai: !exec && i.rousaiApplied !== false ? i.rousaiRate ?? "" : "",
    kodomo: a?.kodomoRate ?? "",
    shienkin: kyokai && (a?.shienkinRate ?? 0) > 0 ? a!.shienkinRate : "",
  };
}

/**
 * 全明細をExcel(オートフィルタ付き)としてダウンロード。
 * 正規の給与明細として本人向けの項目のみを出力する。
 * 会社負担分(会社分保険料・労災・拠出金・会社負担合計など)は
 * 含めない — それらは「コスト出力」で確認する。
 */
export function exportSalaryCsv(records: SalaryRecord[], prefectureNames: string[]): void {
  const rates = records.map(appliedRateCols);
  const header = [
    "保存日時", "管理番号", "氏名", "生年月日", "住所", "入社日", "地域", "区分", "勤務月", "支給日", "適用年度",
    "総支給額",
    rateHeader("健康保険料", rates.map((x) => x.kenpo), "労使折半"),
    rateHeader("介護保険料", rates.map((x) => x.kaigo), "労使折半"),
    rateHeader("子ども・子育て支援金", rates.map((x) => x.shienkin), "労使折半"),
    rateHeader("厚生年金保険料", rates.map((x) => x.pension), "労使折半"),
    rateHeader("雇用保険料", rates.map((x) => x.koyoEmp), "本人", true),
    "源泉所得税",
    "組合費", "県連共済費", "控除合計", "年末調整 還付", "年末調整 徴収", "手取り金額(差引支給額)",
  ];
  // 控除項目は画面と同じくマイナス表記(Excelでは赤字で表示される)
  const neg = (n: number): number => (n ? -n : 0);
  const rows = records.map((r) => {
    const i = r.input;
    const s = r.result;
    const rate = appliedRateCols(r);
    return [
      new Date(r.savedAt).toLocaleString("ja-JP"),
      r.person?.code ?? "",
      i.name,
      i.birth,
      r.person?.address ?? "",
      r.person?.hireDate ?? "",
      prefectureNames[i.prefectureIndex] ?? "",
      i.isExecutive ? "役員" : "社員",
      `${i.workYear}/${String(i.workMonth).padStart(2, "0")}`,
      `${s.paymentYear}/${String(s.paymentMonth).padStart(2, "0")}${s.paymentDay ? "/" + String(s.paymentDay).padStart(2, "0") : ""}`,
      rate.fiscalLabel,
      i.grossSalary,
      neg(s.healthEmployee),
      neg(s.kaigoEmployee),
      neg(s.shienkinEmployee ?? 0),
      neg(s.pensionEmployee),
      neg(s.koyoEmployee),
      neg(s.incomeTax),
      neg(s.kumiaiFee),
      neg(s.kenrenKyosai ?? 0),
      neg(s.totalEmployeeDeduction),
      s.nenmatsuRefund ?? 0,
      neg(s.nenmatsuCollect ?? 0),
      s.netPay,
    ];
  });
  void downloadExcel(header, rows, "給与明細", "給与明細");
}

/** 1明細の「コスト」= 各項目の合計(組合費を含む) */
export function recordCost(r: SalaryRecord): number {
  const s = r.result;
  return (
    s.healthEmployee + s.kaigoEmployee + s.pensionEmployee + s.koyoEmployee + s.incomeTax +
    s.kumiaiFee + s.kenrenKyosai +
    s.healthEmployer + s.kaigoEmployer + s.pensionEmployer + s.koyoEmployer +
    s.rousai + s.kodomoContribution +
    (s.shienkinEmployee ?? 0) + (s.shienkinEmployer ?? 0) +
    (s.nenmatsuRefund ?? 0) + (s.nenmatsuCollect ?? 0)
  );
}

/** コストを人名付きでExcel出力(各項目の内訳と合計。公式料率は列見出しに表示) */
export function exportCostCsv(records: SalaryRecord[]): void {
  const rates = records.map(appliedRateCols);
  const header = [
    "管理番号", "氏名", "勤務月", "支給日", "適用年度",
    rateHeader("健康保険料", rates.map((x) => x.kenpo), "労使折半"),
    rateHeader("介護保険料", rates.map((x) => x.kaigo), "労使折半"),
    rateHeader("子ども・子育て支援金", rates.map((x) => x.shienkin), "労使折半"),
    rateHeader("厚生年金保険料", rates.map((x) => x.pension), "労使折半"),
    rateHeader("雇用保険料", rates.map((x) => x.koyoEmp), "本人", true),
    "源泉所得税",
    "組合費", "県連共済費",
    "健康保険料(会社分)", "介護保険料(会社分)",
    rateHeader("子ども・子育て支援金(会社分)", rates.map((x) => x.shienkin), "労使折半"),
    "厚生年金保険料(会社分)",
    rateHeader("子ども・子育て拠出金", rates.map((x) => x.kodomo), "会社のみ", true),
    rateHeader("雇用保険料", rates.map((x) => x.koyoComp), "会社分", true),
    rateHeader("労災保険料", rates.map((x) => x.rousai), "全額会社", true),
    "年末調整 還付", "年末調整 徴収", "コスト合計",
  ];
  const rows = records.map((r) => {
    const s = r.result;
    return [
      r.person?.code ?? "",
      r.input.name,
      `${r.input.workYear}/${String(r.input.workMonth).padStart(2, "0")}`,
      `${s.paymentYear}/${String(s.paymentMonth).padStart(2, "0")}${s.paymentDay ? "/" + String(s.paymentDay).padStart(2, "0") : ""}`,
      appliedRateCols(r).fiscalLabel,
      s.healthEmployee,
      s.kaigoEmployee,
      s.shienkinEmployee ?? 0,
      s.pensionEmployee,
      s.koyoEmployee,
      s.incomeTax, s.kumiaiFee, s.kenrenKyosai ?? 0,
      s.healthEmployer, s.kaigoEmployer,
      s.shienkinEmployer ?? 0,
      s.pensionEmployer,
      s.kodomoContribution,
      s.koyoEmployer,
      s.rousai,
      s.nenmatsuRefund ?? 0, s.nenmatsuCollect ?? 0,
      recordCost(r),
    ];
  });
  void downloadExcel(header, rows, "コスト", "コスト");
}

/**
 * 全データ(人員+明細)をJSONファイルとしてダウンロード。
 * データベースの生データそのもの。復元・移行・保管用。
 */
export function exportBackupJson(people: unknown[], records: SalaryRecord[]): void {
  const backup = {
    app: "NewBuild給料明細",
    exportedAt: new Date().toISOString(),
    people,
    salaryRecords: records,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `給料データバックアップ_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
