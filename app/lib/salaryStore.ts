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

/** 全明細をExcel(オートフィルタ付き)としてダウンロード */
export function exportSalaryCsv(records: SalaryRecord[], prefectureNames: string[]): void {
  const header = [
    "保存日時", "管理番号", "氏名", "生年月日", "職務", "住所", "入社日", "地域", "区分", "勤務月", "支給日",
    "総支給額", "健康保険料", "介護保険料", "厚生年金保険料", "雇用保険料",
    "源泉所得税", "支援金(本人)", "組合費", "県連共済費", "年末調整還付", "年末調整徴収", "控除合計", "手取り金額",
    "健康保険(会社)", "介護保険(会社)", "厚生年金(会社)", "雇用保険(会社)",
    "労災保険", "子ども・子育て拠出金", "支援金(会社)", "会社負担合計", "会社総コスト",
  ];
  const rows = records.map((r) => {
    const i = r.input;
    const s = r.result;
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
      s.healthEmployer,
      s.kaigoEmployer,
      s.pensionEmployer,
      s.koyoEmployer,
      s.rousai,
      s.kodomoContribution,
      s.shienkinEmployer ?? 0,
      s.totalEmployerBurden,
      s.totalCompanyCost,
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

/** コストを人名付きでCSV出力(各項目の内訳と合計) */
export function exportCostCsv(records: SalaryRecord[]): void {
  const header = [
    "管理番号", "氏名", "勤務月", "支給日",
    "健康保険料", "介護保険料", "厚生年金保険料", "雇用保険料", "源泉所得税", "支援金(本人)", "組合費", "県連共済費",
    "健康保険料(会社分)", "介護保険料(会社分)", "厚生年金保険料(会社分)", "雇用保険料(会社分)",
    "労災保険料", "子ども・子育て拠出金", "支援金(会社)", "年末調整還付", "年末調整徴収", "コスト合計",
  ];
  const rows = records.map((r) => {
    const s = r.result;
    return [
      r.person?.code ?? "",
      r.input.name,
      `${r.input.workYear}/${String(r.input.workMonth).padStart(2, "0")}`,
      `${s.paymentYear}/${String(s.paymentMonth).padStart(2, "0")}${s.paymentDay ? "/" + String(s.paymentDay).padStart(2, "0") : ""}`,
      s.healthEmployee, s.kaigoEmployee, s.pensionEmployee, s.koyoEmployee, s.incomeTax, s.shienkinEmployee ?? 0, s.kumiaiFee, s.kenrenKyosai ?? 0,
      s.healthEmployer, s.kaigoEmployer, s.pensionEmployer, s.koyoEmployer,
      s.rousai, s.kodomoContribution, s.shienkinEmployer ?? 0, s.nenmatsuRefund ?? 0, s.nenmatsuCollect ?? 0,
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
