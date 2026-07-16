/**
 * 給与明細の保存(ブラウザの localStorage)。
 * このアプリの名簿データと同じ方式で、端末内に保存される。
 * 将来クラウドDB(Supabase等)に移行する場合はこのファイルの
 * 実装を差し替えるだけでよい。
 */

import type { PayrollInput, PayrollResult } from "./payroll";
import type { PersonRole } from "./peopleStore";

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
  return list;
}

export function deleteSalaryRecord(id: string): SalaryRecord[] {
  const list = loadSalaryRecords().filter((r) => r.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
  return list;
}

/** 全明細をCSV(Excel対応・UTF-8 BOM付き)としてダウンロード */
export function exportSalaryCsv(records: SalaryRecord[], prefectureNames: string[]): void {
  const header = [
    "保存日時", "管理番号", "氏名", "生年月日", "職務", "住所", "入社日", "地域", "区分", "勤務月", "支給月",
    "総支給額", "健康保険料", "介護保険料", "厚生年金保険料", "雇用保険料",
    "源泉所得税", "組合費", "控除合計", "手取り金額",
    "健康保険(会社)", "介護保険(会社)", "厚生年金(会社)", "雇用保険(会社)",
    "労災保険", "子ども・子育て拠出金", "会社負担合計", "会社総コスト",
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
      `${s.paymentYear}/${String(s.paymentMonth).padStart(2, "0")}`,
      i.grossSalary,
      s.healthEmployee,
      s.kaigoEmployee,
      s.pensionEmployee,
      s.koyoEmployee,
      s.incomeTax,
      s.kumiaiFee,
      s.totalEmployeeDeduction,
      s.netPay,
      s.healthEmployer,
      s.kaigoEmployer,
      s.pensionEmployer,
      s.koyoEmployer,
      s.rousai,
      s.kodomoContribution,
      s.totalEmployerBurden,
      s.totalCompanyCost,
    ];
  });
  const csv = [header, ...rows]
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `給与明細_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
