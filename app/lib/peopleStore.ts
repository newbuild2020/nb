/**
 * 人員(給与計算対象者)の登録データ。localStorage に保存。
 */

export interface Person {
  id: string;
  name: string; // 姓名
  kana: string; // 姓名カナ
  gender: "male" | "female" | "";
  birth: string; // YYYY-MM-DD
  prefectureIndex: number; // 都道府県(給与計算の地域にも使用)
  address: string; // 住所(詳細)
  createdAt: string;
}

const KEY = "salaryPeople";

export function loadPeople(): Person[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as Person[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function savePerson(p: Omit<Person, "id" | "createdAt">): Person[] {
  const person: Person = {
    ...p,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  const list = loadPeople();
  list.push(person);
  list.sort((a, b) => a.kana.localeCompare(b.kana, "ja"));
  localStorage.setItem(KEY, JSON.stringify(list));
  return list;
}

export function deletePerson(id: string): Person[] {
  const list = loadPeople().filter((p) => p.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
  return list;
}
