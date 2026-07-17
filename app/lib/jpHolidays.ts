/**
 * 日本の国民の祝日を算出する(振替休日・国民の休日を含む)。
 * 春分・秋分は 2000〜2099 年に有効な近似式で求める。
 * 給与支給日の平日判定に使用する。
 */

const holidayCache = new Map<number, Set<string>>();

function key(y: number, m: number, d: number): string {
  return `${y}-${m}-${d}`;
}

/** その月の第n月曜日の日付 */
function nthMonday(year: number, month: number, n: number): number {
  const firstDow = new Date(year, month - 1, 1).getDay(); // 0=日
  const firstMonday = 1 + ((8 - firstDow) % 7);
  return firstMonday + (n - 1) * 7;
}

function shunbun(year: number): number {
  return Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
}
function shubun(year: number): number {
  return Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
}

/** 年ごとの基本の祝日([月, 日]) */
function baseHolidays(year: number): [number, number][] {
  const h: [number, number][] = [];
  h.push([1, 1]); // 元日
  h.push([1, year >= 2000 ? nthMonday(year, 1, 2) : 15]); // 成人の日
  h.push([2, 11]); // 建国記念の日
  if (year >= 2020) h.push([2, 23]); // 天皇誕生日(令和)
  h.push([3, shunbun(year)]); // 春分の日
  h.push([4, 29]); // 昭和の日
  h.push([5, 3]); // 憲法記念日
  h.push([5, 4]); // みどりの日
  h.push([5, 5]); // こどもの日

  // 海の日
  if (year === 2020) h.push([7, 23]);
  else if (year === 2021) h.push([7, 22]);
  else if (year >= 2003) h.push([7, nthMonday(year, 7, 3)]);
  else if (year >= 1996) h.push([7, 20]);

  // 山の日(2016年〜)
  if (year === 2020) h.push([8, 10]);
  else if (year === 2021) h.push([8, 8]);
  else if (year >= 2016) h.push([8, 11]);

  // 敬老の日
  if (year >= 2003) h.push([9, nthMonday(year, 9, 3)]);
  else if (year >= 1966) h.push([9, 15]);

  h.push([9, shubun(year)]); // 秋分の日

  // スポーツの日 / 体育の日
  if (year === 2020) h.push([7, 24]);
  else if (year === 2021) h.push([7, 23]);
  else if (year >= 2000) h.push([10, nthMonday(year, 10, 2)]);
  else h.push([10, 10]);

  h.push([11, 3]); // 文化の日
  h.push([11, 23]); // 勤労感謝の日
  if (year <= 2018 && year >= 1989) h.push([12, 23]); // 天皇誕生日(平成)

  // 2019年の特例(即位関連)
  if (year === 2019) {
    h.push([5, 1]); // 天皇の即位の日
    h.push([10, 22]); // 即位礼正殿の儀
  }
  return h;
}

/** その年の全祝日(振替休日・国民の休日込み)のSet を返す */
function holidaySet(year: number): Set<string> {
  const cached = holidayCache.get(year);
  if (cached) return cached;

  const set = new Set<string>();
  for (const [m, d] of baseHolidays(year)) set.add(key(year, m, d));

  // 振替休日: 祝日が日曜なら、その後の祝日でない最初の日を休日に
  for (const [m, d] of baseHolidays(year)) {
    const date = new Date(year, m - 1, d);
    if (date.getDay() === 0) {
      const sub = new Date(year, m - 1, d);
      do {
        sub.setDate(sub.getDate() + 1);
      } while (set.has(key(sub.getFullYear(), sub.getMonth() + 1, sub.getDate())));
      set.add(key(sub.getFullYear(), sub.getMonth() + 1, sub.getDate()));
    }
  }

  // 国民の休日: 前日と翌日がともに祝日の平日(日曜以外・祝日以外)を休日に
  const jan1 = new Date(year, 0, 1);
  const dec31 = new Date(year, 11, 31);
  for (let t = new Date(jan1); t <= dec31; t.setDate(t.getDate() + 1)) {
    const y = t.getFullYear(), mo = t.getMonth() + 1, da = t.getDate();
    if (set.has(key(y, mo, da)) || t.getDay() === 0) continue;
    const prev = new Date(y, mo - 1, da - 1);
    const next = new Date(y, mo - 1, da + 1);
    if (
      set.has(key(prev.getFullYear(), prev.getMonth() + 1, prev.getDate())) &&
      set.has(key(next.getFullYear(), next.getMonth() + 1, next.getDate()))
    ) {
      set.add(key(y, mo, da));
    }
  }

  holidayCache.set(year, set);
  return set;
}

/** 指定日が日本の祝日か */
export function isJapaneseHoliday(date: Date): boolean {
  return holidaySet(date.getFullYear()).has(
    key(date.getFullYear(), date.getMonth() + 1, date.getDate())
  );
}

/** 平日(土日・祝日以外)か */
export function isBusinessDay(date: Date): boolean {
  const dow = date.getDay();
  if (dow === 0 || dow === 6) return false;
  return !isJapaneseHoliday(date);
}

/**
 * 支給日を「最も近い平日」に調整する。
 * 両側が等距離のときは後ろ(遅い方=向後)を選ぶ。
 */
export function adjustToBusinessDay(year: number, month: number, day: number): {
  date: Date;
  adjusted: boolean;
} {
  const base = new Date(year, month - 1, day);
  if (isBusinessDay(base)) return { date: base, adjusted: false };
  for (let dist = 1; dist <= 15; dist++) {
    const later = new Date(year, month - 1, day + dist);
    if (isBusinessDay(later)) return { date: later, adjusted: true }; // 同距離は後ろ優先
    const earlier = new Date(year, month - 1, day - dist);
    if (isBusinessDay(earlier)) return { date: earlier, adjusted: true };
  }
  return { date: base, adjusted: false };
}

export const WEEKDAY_JA = ["日", "月", "火", "水", "木", "金", "土"];
