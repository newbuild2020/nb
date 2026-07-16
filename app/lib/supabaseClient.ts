/**
 * Supabase(クラウドDB)への薄いRESTクライアント。
 * publishable key はブラウザに埋め込む前提の公開キー。
 *
 * テーブル構造(SQL Editorで一度だけ作成):
 *   people / salary_records: { id text primary key, data jsonb, updated_at timestamptz }
 * 削除は物理削除ではなく data.deleted = true の墓標(トゥームストーン)で表現し、
 * 他端末のローカルコピーが再アップロードされるのを防ぐ。
 */

export const SUPABASE_URL = "https://cqwsnhnglgshqudicqfn.supabase.co";
const SUPABASE_KEY = "sb_publishable_WTWqx9zK2d31K9K-lDolgQ_VAxuV0jx";

const HEADERS: Record<string, string> = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

export type CloudTable = "people" | "salary_records";

export interface CloudRow {
  id: string;
  data: Record<string, unknown>;
}

/** テーブル全件取得。未設定・オフライン・エラー時は null(ローカルのみで継続) */
export async function fetchAll(table: CloudTable): Promise<CloudRow[] | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id,data`, {
      headers: HEADERS,
    });
    if (!res.ok) return null;
    return (await res.json()) as CloudRow[];
  } catch {
    return null;
  }
}

/** 複数行を upsert(idが同じなら上書き) */
export async function upsertRows(table: CloudTable, rows: CloudRow[]): Promise<boolean> {
  if (rows.length === 0) return true;
  try {
    const now = new Date().toISOString();
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=id`, {
      method: "POST",
      headers: { ...HEADERS, Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(rows.map((r) => ({ id: r.id, data: r.data, updated_at: now }))),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** 1件を非同期でクラウドへ送る(失敗してもローカル動作は継続) */
export function pushItem(table: CloudTable, id: string, data: unknown): void {
  void upsertRows(table, [{ id, data: data as Record<string, unknown> }]);
}

/** 削除の墓標を送る */
export function pushTombstone(table: CloudTable, id: string): void {
  void upsertRows(table, [
    { id, data: { deleted: true, deletedAt: new Date().toISOString() } },
  ]);
}
