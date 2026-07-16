/**
 * ローカル(localStorage)とクラウド(Supabase)の同期。
 *
 * 方針: localStorage を作業用ストアとして維持し(高速・オフライン可)、
 * ページを開いたときに pull → マージ → 差分を push する。
 * 個々の保存・更新・削除は各ストアが write-through でクラウドへ送る。
 * 競合は「更新時刻の新しい方が勝ち」で解決する。
 */

import { fetchAll, upsertRows, type CloudTable, type CloudRow } from "./supabaseClient";
import { loadPeople, overwritePeople, type Person } from "./peopleStore";
import { loadSalaryRecords, overwriteSalaryRecords, type SalaryRecord } from "./salaryStore";

interface MaybeDeleted {
  deleted?: boolean;
}

function ts(iso: string | undefined): number {
  if (!iso) return 0;
  const n = Date.parse(iso);
  return Number.isNaN(n) ? 0 : n;
}

/** 汎用マージ: 新しい方優先・墓標は削除として扱う・ローカル新規はpush */
async function syncTable<T extends { id: string }>(
  table: CloudTable,
  local: T[],
  recency: (item: T) => number,
  write: (list: T[]) => void
): Promise<T[] | null> {
  const cloud = await fetchAll(table);
  if (cloud === null) return null; // オフライン等: ローカルのまま

  const cloudMap = new Map<string, (T & MaybeDeleted) | MaybeDeleted>(
    cloud.map((r: CloudRow) => [r.id, r.data as T & MaybeDeleted])
  );
  const localIds = new Set(local.map((i) => i.id));
  const merged: T[] = [];
  const toPush: CloudRow[] = [];

  for (const item of local) {
    const c = cloudMap.get(item.id);
    if (!c) {
      // クラウド未登録 → アップロード(既存端末データの自動移行もこれで完了)
      merged.push(item);
      toPush.push({ id: item.id, data: item as unknown as Record<string, unknown> });
      continue;
    }
    if (c.deleted) continue; // 他端末で削除済み → ローカルからも消す
    const cloudItem = c as T;
    if (recency(item) > recency(cloudItem)) {
      merged.push(item);
      toPush.push({ id: item.id, data: item as unknown as Record<string, unknown> });
    } else {
      merged.push(cloudItem);
    }
  }
  for (const [id, c] of cloudMap) {
    if (localIds.has(id) || c.deleted) continue;
    merged.push(c as T); // クラウドのみに存在 → 取り込み
  }

  write(merged);
  if (toPush.length > 0) void upsertRows(table, toPush);
  return merged;
}

/** 人員リストを同期。オフライン時は null */
export async function syncPeople(): Promise<Person[] | null> {
  return syncTable(
    "people",
    loadPeople(),
    (p) => ts(p.updatedAt) || ts(p.createdAt),
    overwritePeople
  );
}

/** 明細リストを同期。オフライン時は null */
export async function syncSalaryRecords(): Promise<SalaryRecord[] | null> {
  return syncTable(
    "salary_records",
    loadSalaryRecords(),
    (r) => ts(r.savedAt),
    overwriteSalaryRecords
  );
}
