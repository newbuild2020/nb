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
  ws["!cols"] = header.map((h) => ({ wch: Math.max(10, h.length * 2 + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${prefix}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * 列見出しに公式料率(%)を埋め込む。
 * 出力対象の全明細で率が同じなら「9.92%」、年度をまたいで
 * 異なる場合は「9.91〜9.92%」のように範囲で表示する。
 * 率で計算していない明細(定額の組合保険など)は無視する。
 */
function rateHeader(base: string, values: (number | string)[], note = ""): string {
  const nums = [...new Set(values.filter((v): v is number => typeof v === "number"))];
  if (nums.length === 0) return base;
  const label = nums.length === 1 ? `${nums[0]}%` : `${Math.min(...nums)}〜${Math.max(...nums)}%`;
  return `${base}(${label}${note ? " " + note : ""})`;
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
    "保存日時", "管理番号", "氏名", "生年月日", "職務", "住所", "入社日", "地域", "区分", "勤務月", "支給日", "適用年度",
    "総支給額",
    rateHeader("健康保険料", rates.map((x) => x.kenpo), "労使折半"),
    rateHeader("介護保険料", rates.map((x) => x.kaigo), "労使折半"),
    rateHeader("厚生年金保険料", rates.map((x) => x.pension), "労使折半"),
    rateHeader("雇用保険料", rates.map((x) => x.koyoEmp), "本人分"),
    "源泉所得税",
    rateHeader("支援金(本人)", rates.map((x) => x.shienkin), "労使折半"),
    "組合費", "県連共済費", "年末調整還付", "年末調整徴収", "控除合計", "手取り金額",
  ];
  const rows = records.map((r) => {
    const i = r.input;
    const s = r.result;
    const rate = appliedRateCols(r);
    return [
      new Date(r.savedAt).toLocaleString("ja-JP"),
      r.person?.code ?? "",
      i.name,
      i.birth,
      r.person ? (r.person.role === "executive" ? "役員" : "社員") : "",
      r.person?.address ?? "",
      r.person?.hireDate ?? "",
      prefectureNames[i.prefectureIndex] ?? "",
      i.isExecutive ? "役員" : "社員",
      `${i.workYear}/${String(i.workMonth).padStart(2, "0")}`,
      `${s.paymentYear}/${String(s.paymentMonth).padStart(2, "0")}${s.paymentDay ? "/" + String(s.paymentDay).padStart(2, "0") : ""}`,
      rate.fiscalLabel,
      i.grossSalary,
      s.healthEmployee,
      s.kaigoEmployee,
      s.pensionEmployee,
      s.koyoEmployee,
      s.incomeTax,
      s.shienkinEmployee ?? 0,
      s.kumiaiFee,
      s.kenrenKyosai ?? 0,
      s.nenmatsuRefund ?? 0,
      s.nenmatsuCollect ?? 0,
      s.totalEmployeeDeduction,
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
    rateHeader("厚生年金保険料", rates.map((x) => x.pension), "労使折半"),
    rateHeader("雇用保険料", rates.map((x) => x.koyoEmp), "本人分"),
    "源泉所得税",
    rateHeader("支援金(本人)", rates.map((x) => x.shienkin), "労使折半"),
    "組合費", "県連共済費",
    "健康保険料(会社分)", "介護保険料(会社分)", "厚生年金保険料(会社分)",
    rateHeader("雇用保険料(会社分)", rates.map((x) => x.koyoComp)),
    rateHeader("労災保険料", rates.map((x) => x.rousai)),
    rateHeader("子ども・子育て拠出金", rates.map((x) => x.kodomo)),
    "支援金(会社)", "年末調整還付", "年末調整徴収", "コスト合計",
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
      s.pensionEmployee,
      s.koyoEmployee,
      s.incomeTax, s.shienkinEmployee ?? 0, s.kumiaiFee, s.kenrenKyosai ?? 0,
      s.healthEmployer, s.kaigoEmployer, s.pensionEmployer,
      s.koyoEmployer,
      s.rousai,
      s.kodomoContribution,
      s.shienkinEmployer ?? 0, s.nenmatsuRefund ?? 0, s.nenmatsuCollect ?? 0,
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
