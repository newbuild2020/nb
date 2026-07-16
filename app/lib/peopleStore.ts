/**
 * 人員(給与計算対象者)の登録データ。localStorage に保存。
 *
 * 管理番号は職務ごとに自動採番される:
 *   役員: NB-01, NB-02, ...
 *   社員: NB-001, NB-002, ...
 */

import { pushItem, pushTombstone } from "./supabaseClient";

export type PersonRole = "executive" | "employee";
export type PersonStatus = "active" | "retired";

export interface Person {
  id: string;
  code: string; // 管理番号(自動採番)
  name: string; // 姓名
  kana: string; // 姓名カナ
  gender: "male" | "female" | "";
  birth: string; // YYYY-MM-DD
  prefectureIndex: number; // 都道府県(給与計算の地域にも使用)
  address: string; // 住所(詳細)
  role: PersonRole; // 職務
  hireDate: string; // 入社年月日 YYYY-MM-DD
  status: PersonStatus; // 在職/退職(初回登録時は在職)
  createdAt: string;
  updatedAt?: string; // クラウド同期の競合解決に使用
}

export const ROLE_LABELS: Record<PersonRole, string> = {
  executive: "役員",
  employee: "社員",
};

export const STATUS_LABELS: Record<PersonStatus, string> = {
  active: "在職",
  retired: "退職",
};

const KEY = "salaryPeople";

/** 職務ごとの次の管理番号を採番する */
function nextCode(list: Person[], role: PersonRole): string {
  const digits = role === "executive" ? 2 : 3;
  let max = 0;
  for (const p of list) {
    if (p.role !== role || !p.code) continue;
    const m = p.code.match(/^NB-(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `NB-${String(max + 1).padStart(digits, "0")}`;
}

/** 役員→社員の順、同職務内は管理番号順に並べる */
function sortPeople(list: Person[]): void {
  list.sort((a, b) => {
    if (a.role !== b.role) return a.role === "executive" ? -1 : 1;
    return a.code.localeCompare(b.code, "ja", { numeric: true });
  });
}

/** 旧形式データ(職務・管理番号なし)の自動移行 */
function migrate(raw: unknown[]): { people: Person[]; changed: boolean } {
  let changed = false;
  const people = raw.map((item) => ({ ...(item as Person) }));
  for (const p of people) {
    if (!p.role) {
      // 既存登録の移行: 王鑫さんは役員として登録済みの扱い、それ以外は社員
      p.role = p.name === "王鑫" ? "executive" : "employee";
      changed = true;
    }
    if (!p.status) {
      p.status = "active";
      changed = true;
    }
    if (p.hireDate === undefined) {
      p.hireDate = "";
      changed = true;
    }
  }
  for (const p of people) {
    if (!p.code) {
      p.code = nextCode(people, p.role);
      changed = true;
    }
  }
  if (changed) sortPeople(people);
  return { people, changed };
}

export function loadPeople(): Person[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return [];
    const { people, changed } = migrate(list);
    if (changed) localStorage.setItem(KEY, JSON.stringify(people));
    return people;
  } catch {
    return [];
  }
}

export function savePerson(
  p: Omit<Person, "id" | "createdAt" | "code" | "status">
): { list: Person[]; person: Person } {
  const list = loadPeople();
  const now = new Date().toISOString();
  const person: Person = {
    ...p,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    code: nextCode(list, p.role),
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
  list.push(person);
  sortPeople(list);
  localStorage.setItem(KEY, JSON.stringify(list));
  pushItem("people", person.id, person);
  return { list, person };
}

/** 人員情報の更新。職務が変わった場合は新しい職務で採番し直す */
export function updatePerson(
  id: string,
  patch: Partial<Omit<Person, "id" | "createdAt" | "code">>
): Person[] {
  const list = loadPeople();
  const idx = list.findIndex((x) => x.id === id);
  if (idx >= 0) {
    const before = list[idx];
    const updated: Person = { ...before, ...patch, updatedAt: new Date().toISOString() };
    if (patch.role && patch.role !== before.role) {
      updated.code = nextCode(list.filter((x) => x.id !== id), patch.role);
    }
    list[idx] = updated;
    sortPeople(list);
    localStorage.setItem(KEY, JSON.stringify(list));
    pushItem("people", updated.id, updated);
  }
  return list;
}

export function deletePerson(id: string): Person[] {
  const list = loadPeople().filter((p) => p.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
  pushTombstone("people", id);
  return list;
}

/** クラウド同期後のリストで丸ごと置き換える(cloudSync用) */
export function overwritePeople(list: Person[]): void {
  const sorted = [...list];
  sortPeople(sorted);
  localStorage.setItem(KEY, JSON.stringify(sorted));
}
