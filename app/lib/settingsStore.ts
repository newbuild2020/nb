/**
 * 会社(事業所)設定。localStorage に保存。
 *
 * 協会けんぽの健康保険料率は「適用事業所の所在地(会社の都道府県)」で
 * 決まり、従業員個人の住所ではない。全社員に同じ都道府県の料率を適用する。
 */

const KEY = "companyPrefectureIndex";
const DEFAULT_PREFECTURE = 13; // 神奈川県

export function getCompanyPrefecture(): number {
  if (typeof window === "undefined") return DEFAULT_PREFECTURE;
  const raw = localStorage.getItem(KEY);
  const n = raw != null ? Number(raw) : NaN;
  return Number.isInteger(n) && n >= 0 && n < 47 ? n : DEFAULT_PREFECTURE;
}

export function setCompanyPrefecture(index: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, String(index));
}

const ROUSAI_KEY = "rousaiCategoryKey";

/** 労災保険の事業の種類(会社設定)。既定は建築事業 */
export function getRousaiCategoryKey(): string {
  if (typeof window === "undefined") return "kenchiku";
  return localStorage.getItem(ROUSAI_KEY) || "kenchiku";
}

export function setRousaiCategoryKey(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ROUSAI_KEY, key);
}
