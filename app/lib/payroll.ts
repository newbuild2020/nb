/**
 * 日本給与計算ロジック(平成28年度〜令和7年度対応)
 *
 * 年度別の料率・税額計算式は payrollRates.ts にまとめてある。
 * 勤務月に応じて自動的にその年度の官方料率が適用され、
 * 未登録の将来年度は最新年度の料率にフォールバックする。
 */

import {
  PREFECTURE_NAMES,
  KENPO_HISTORY,
  kenpoFiscalYear,
  pensionRate,
  koyoRates,
  kodomoRate,
  pensionSmrRange,
  calcWithholdingTax,
  shienkinRate,
  type KoyoIndustry,
} from "./payrollRates";
import { adjustToBusinessDay } from "./jpHolidays";

export {
  PREFECTURE_NAMES,
  KENPO_HISTORY,
  KENPO_MIN_YEAR,
  KENPO_MAX_YEAR,
  KOYO_INDUSTRY_LABELS,
  ROUSAI_CATEGORIES,
  ROUSAI_DEFAULT_KEY,
  rousaiKeyFromRate,
  type RousaiCategory,
  type KoyoIndustry,
} from "./payrollRates";

/** 労災保険料率デフォルト(その他の各種事業)% */
export const ROUSAI_DEFAULT_RATE = 0.3;

// ============ 標準報酬月額 ============

/** 健康保険 標準報酬月額表(第1〜50等級)。lower = 報酬月額の下限 */
const HEALTH_SMR_TABLE: { lower: number; smr: number }[] = [
  { lower: 0, smr: 58000 },
  { lower: 63000, smr: 68000 },
  { lower: 73000, smr: 78000 },
  { lower: 83000, smr: 88000 },
  { lower: 93000, smr: 98000 },
  { lower: 101000, smr: 104000 },
  { lower: 107000, smr: 110000 },
  { lower: 114000, smr: 118000 },
  { lower: 122000, smr: 126000 },
  { lower: 130000, smr: 134000 },
  { lower: 138000, smr: 142000 },
  { lower: 146000, smr: 150000 },
  { lower: 155000, smr: 160000 },
  { lower: 165000, smr: 170000 },
  { lower: 175000, smr: 180000 },
  { lower: 185000, smr: 190000 },
  { lower: 195000, smr: 200000 },
  { lower: 210000, smr: 220000 },
  { lower: 230000, smr: 240000 },
  { lower: 250000, smr: 260000 },
  { lower: 270000, smr: 280000 },
  { lower: 290000, smr: 300000 },
  { lower: 310000, smr: 320000 },
  { lower: 330000, smr: 340000 },
  { lower: 350000, smr: 360000 },
  { lower: 370000, smr: 380000 },
  { lower: 395000, smr: 410000 },
  { lower: 425000, smr: 440000 },
  { lower: 455000, smr: 470000 },
  { lower: 485000, smr: 500000 },
  { lower: 515000, smr: 530000 },
  { lower: 545000, smr: 560000 },
  { lower: 575000, smr: 590000 },
  { lower: 605000, smr: 620000 },
  { lower: 635000, smr: 650000 },
  { lower: 665000, smr: 680000 },
  { lower: 695000, smr: 710000 },
  { lower: 730000, smr: 750000 },
  { lower: 770000, smr: 790000 },
  { lower: 810000, smr: 830000 },
  { lower: 855000, smr: 880000 },
  { lower: 905000, smr: 930000 },
  { lower: 955000, smr: 980000 },
  { lower: 1005000, smr: 1030000 },
  { lower: 1055000, smr: 1090000 },
  { lower: 1115000, smr: 1150000 },
  { lower: 1175000, smr: 1210000 },
  { lower: 1235000, smr: 1270000 },
  { lower: 1295000, smr: 1330000 },
  { lower: 1355000, smr: 1390000 },
];

/** 健康保険の標準報酬月額 */
export function healthSMR(monthlySalary: number): number {
  let smr = HEALTH_SMR_TABLE[0].smr;
  for (const row of HEALTH_SMR_TABLE) {
    if (monthlySalary >= row.lower) smr = row.smr;
    else break;
  }
  return smr;
}

/** 厚生年金の標準報酬月額(等級範囲は年月で変わる) */
export function pensionSMR(monthlySalary: number, year: number, month: number): number {
  const { min, max } = pensionSmrRange(year, month);
  return Math.min(Math.max(healthSMR(monthlySalary), min), max);
}

// ============ 端数処理 ============

/** 被保険者負担分の端数処理: 50銭以下切捨て・50銭超切上げ */
export function roundEmployeeShare(amount: number): number {
  const floor = Math.floor(amount);
  return amount - floor <= 0.5 ? floor : floor + 1;
}

// ============ 年齢・月判定 ============

/** year/month(1-12)を通算月数に変換 */
function ym(year: number, month: number): number {
  return year * 12 + (month - 1);
}

/** 誕生日からn歳の「到達日」(誕生日の前日)が属する年月を返す */
function reachAgeMonth(birth: Date, age: number): number {
  const d = new Date(birth.getFullYear() + age, birth.getMonth(), birth.getDate());
  d.setDate(d.getDate() - 1); // 到達日 = 誕生日の前日
  return ym(d.getFullYear(), d.getMonth() + 1);
}

/** 介護保険第2号被保険者か(40歳到達月〜65歳到達月の前月) */
export function isKaigoTarget(birth: Date, year: number, month: number): boolean {
  const target = ym(year, month);
  return target >= reachAgeMonth(birth, 40) && target < reachAgeMonth(birth, 65);
}

/** 厚生年金の被保険者か(70歳到達月の前月まで) */
export function isPensionTarget(birth: Date, year: number, month: number): boolean {
  return ym(year, month) < reachAgeMonth(birth, 70);
}

/** 健康保険の被保険者か(75歳の誕生月の前月まで。以後は後期高齢者医療) */
export function isHealthTarget(birth: Date, year: number, month: number): boolean {
  const b75 = new Date(birth.getFullYear() + 75, birth.getMonth(), birth.getDate());
  return ym(year, month) < ym(b75.getFullYear(), b75.getMonth() + 1);
}

// ============ メイン計算 ============

export interface PayrollInput {
  name: string;
  birth: string; // YYYY-MM-DD
  prefectureIndex: number;
  isExecutive: boolean; // 役員か
  workYear: number;
  workMonth: number; // 1-12
  paymentOffset: 0 | 1 | 2; // 当月/翌月/翌々月払い
  grossSalary: number; // 総支給額(月)
  dependents: number; // 扶養親族等の数
  insuranceType: "kyokai" | "kumiai"; // 協会けんぽ / 国保組合・その他
  /**
   * 国保組合・その他のときのみ使用。
   * 健康保険料の月額(医療分・円)。全額本人負担で、
   * 会社が立て替えて給与から控除する(会社負担は0)。
   */
  kumiaiHealthMonthly: number;
  /**
   * 国保組合・その他の介護保険料の月額(円)。全額本人負担。
   * 40〜64歳(介護保険第2号被保険者)の月のみ控除される。
   */
  kumiaiKaigoMonthly: number;
  kumiaiFee: number; // 組合費(本人給与から控除・円/月)
  kenrenKyosai: number; // 県連共済費(本人給与から控除・円/月)
  koyoIndustry: KoyoIndustry; // 雇用保険の業種区分
  rousaiRate: number; // 労災保険料率 %
  /**
   * 源泉所得税の手動指定(円)。null/未指定なら自動計算。
   * 端数調整や特殊な控除を反映したいときに使う。
   */
  incomeTaxOverride?: number | null;
  /** 年末調整による還付額(円)。本人へ戻す=手取りに加算。通常12月給与で使用 */
  nenmatsuRefund?: number;
  /** 年末調整による追加徴収額(円)。本人から徴収=手取りから減算 */
  nenmatsuCollect?: number;
}

/** 計算に実際に適用された料率(画面表示用) */
export interface AppliedRates {
  kenpoFiscalLabel: string; // 例: 令和6年度
  kenpoFallback: boolean; // 未登録年度のため最新年度で代用したか
  kenpoRate: number; // 健康保険料率(%)協会けんぽ時のみ意味を持つ
  kaigoRate: number;
  pensionRate: number;
  koyoEmployeeRate: number;
  koyoEmployerRate: number;
  kodomoRate: number;
  shienkinRate: number; // 子ども・子育て支援金率(令和8年4月分〜)
  taxYear: number; // 所得税の適用年(支給年)
}

export interface PayrollResult {
  paymentYear: number;
  paymentMonth: number;
  paymentDay: number; // 支給日(25日基準・休日調整後)
  paymentWeekday: number; // 0=日〜6=土
  paymentAdjusted: boolean; // 25日が休日で調整されたか
  healthSmr: number;
  pensionSmr: number;
  kaigoApplied: boolean;
  applied: AppliedRates;
  // 本人負担
  healthEmployee: number;
  kaigoEmployee: number;
  pensionEmployee: number;
  koyoEmployee: number;
  incomeTax: number;
  shienkinEmployee: number; // 子ども・子育て支援金(本人)
  kumiaiFee: number;
  kenrenKyosai: number;
  totalEmployeeDeduction: number;
  nenmatsuRefund: number; // 年末調整還付(手取りに加算)
  nenmatsuCollect: number; // 年末調整徴収(手取りから減算)
  netPay: number; // 手取り
  // 会社負担
  healthEmployer: number;
  kaigoEmployer: number;
  pensionEmployer: number;
  koyoEmployer: number;
  kodomoContribution: number;
  shienkinEmployer: number; // 子ども・子育て支援金(会社分)
  rousai: number;
  totalEmployerBurden: number;
  totalCompanyCost: number; // 総支給額 + 会社負担合計
}

export function calcPayroll(input: PayrollInput): PayrollResult {
  const birth = new Date(input.birth + "T00:00:00");
  const gross = input.grossSalary;
  const wy = input.workYear;
  const wm = input.workMonth;

  // 支給月(勤務月 + オフセット)
  const totalM = ym(wy, wm) + input.paymentOffset;
  const paymentYear = Math.floor(totalM / 12);
  const paymentMonth = (totalM % 12) + 1;
  // 支給日 = 支給月の25日。休日(土日祝)なら最も近い平日へ(等距離は後ろ=向後)。
  const payday = adjustToBusinessDay(paymentYear, paymentMonth, 25);
  const paymentDay = payday.date.getDate();
  const paymentWeekday = payday.date.getDay();
  const paymentAdjusted = payday.adjusted;

  const hSmr = healthSMR(gross);
  const pSmr = pensionSMR(gross, wy, wm);

  // 勤務月に応じた年度別料率
  const { fy, isFallback } = kenpoFiscalYear(wy, wm);
  const kenpoYear = KENPO_HISTORY[fy];
  const kenpoRateP = kenpoYear.rates[input.prefectureIndex];
  const kaigoRateP = kenpoYear.kaigo;
  const pensionRateP = pensionRate(wy, wm);
  const koyo = koyoRates(wy, wm, input.koyoIndustry);
  const kodomoRateP = kodomoRate(wy, wm);
  const shienkinRateP = shienkinRate(wy, wm);

  // 保険料の対象月は勤務月で判定
  const healthOk = isHealthTarget(birth, wy, wm);
  const kaigoOk = healthOk && isKaigoTarget(birth, wy, wm);
  const pensionOk = isPensionTarget(birth, wy, wm);

  // ---- 健康保険・介護保険 ----
  let healthEmployee = 0, healthEmployer = 0, kaigoEmployee = 0, kaigoEmployer = 0;
  let shienkinEmployee = 0, shienkinEmployer = 0;
  if (input.insuranceType === "kyokai") {
    if (healthOk) {
      const total = hSmr * (kenpoRateP / 100);
      healthEmployee = roundEmployeeShare(total / 2);
      healthEmployer = Math.round(total) - healthEmployee;
      if (kaigoOk) {
        const kTotal = hSmr * (kaigoRateP / 100);
        kaigoEmployee = roundEmployeeShare(kTotal / 2);
        kaigoEmployer = Math.round(kTotal) - kaigoEmployee;
      }
      if (shienkinRateP > 0) {
        // 子ども・子育て支援金(令和8年4月分〜): 健康保険とあわせて徴収・労使折半
        const sTotal = hSmr * (shienkinRateP / 100);
        shienkinEmployee = roundEmployeeShare(sTotal / 2);
        shienkinEmployer = Math.round(sTotal) - shienkinEmployee;
      }
    }
  } else {
    // 国保組合・その他: 保険料は全額本人負担。
    // 会社が立て替えて給与から控除するため会社負担は0。
    // 介護保険分は40〜64歳(第2号被保険者)の月のみ控除する。
    healthEmployee = Math.round(input.kumiaiHealthMonthly || 0);
    if (kaigoOk) {
      kaigoEmployee = Math.round(input.kumiaiKaigoMonthly || 0);
    }
  }

  // ---- 厚生年金 ----
  let pensionEmployee = 0, pensionEmployer = 0;
  if (pensionOk) {
    const total = pSmr * (pensionRateP / 100);
    pensionEmployee = roundEmployeeShare(total / 2);
    pensionEmployer = Math.round(total) - pensionEmployee;
  }

  // ---- 雇用保険・労災(役員は対象外) ----
  let koyoEmployee = 0, koyoEmployer = 0, rousai = 0;
  if (!input.isExecutive) {
    koyoEmployee = roundEmployeeShare(gross * (koyo.employee / 100));
    koyoEmployer = Math.round(gross * (koyo.employer / 100));
    rousai = Math.round(gross * (input.rousaiRate / 100));
  }

  // ---- 子ども・子育て拠出金(厚生年金の標準報酬月額 × 率・会社のみ) ----
  const kodomoContribution = pensionOk ? Math.round(pSmr * (kodomoRateP / 100)) : 0;

  // ---- 源泉所得税(支給日の属する年の計算式を適用。手動指定があれば優先) ----
  const shakaiHoken = healthEmployee + kaigoEmployee + pensionEmployee + koyoEmployee + shienkinEmployee;
  const incomeTax =
    input.incomeTaxOverride != null
      ? Math.max(0, Math.round(input.incomeTaxOverride))
      : calcWithholdingTax(gross - shakaiHoken, input.dependents, paymentYear);

  const kumiaiFee = input.insuranceType === "kumiai" ? Math.round(input.kumiaiFee || 0) : 0;
  const kenrenKyosai = input.insuranceType === "kumiai" ? Math.round(input.kenrenKyosai || 0) : 0;

  const totalEmployeeDeduction = shakaiHoken + incomeTax + kumiaiFee + kenrenKyosai;
  const nenmatsuRefund = Math.max(0, Math.round(input.nenmatsuRefund || 0));
  const nenmatsuCollect = Math.max(0, Math.round(input.nenmatsuCollect || 0));
  const netPay = gross - totalEmployeeDeduction + nenmatsuRefund - nenmatsuCollect;

  const totalEmployerBurden =
    healthEmployer + kaigoEmployer + pensionEmployer + koyoEmployer +
    kodomoContribution + shienkinEmployer + rousai;

  return {
    paymentYear,
    paymentMonth,
    paymentDay,
    paymentWeekday,
    paymentAdjusted,
    healthSmr: hSmr,
    pensionSmr: pSmr,
    kaigoApplied: kaigoOk,
    applied: {
      kenpoFiscalLabel: kenpoYear.label,
      kenpoFallback: isFallback,
      kenpoRate: kenpoRateP,
      kaigoRate: kaigoRateP,
      pensionRate: pensionRateP,
      koyoEmployeeRate: koyo.employee,
      koyoEmployerRate: koyo.employer,
      kodomoRate: kodomoRateP,
      shienkinRate: shienkinRateP,
      taxYear: paymentYear,
    },
    healthEmployee,
    kaigoEmployee,
    pensionEmployee,
    koyoEmployee,
    incomeTax,
    shienkinEmployee,
    kumiaiFee,
    kenrenKyosai,
    totalEmployeeDeduction,
    nenmatsuRefund,
    nenmatsuCollect,
    netPay,
    healthEmployer,
    kaigoEmployer,
    pensionEmployer,
    koyoEmployer,
    kodomoContribution,
    shienkinEmployer,
    rousai,
    totalEmployerBurden,
    totalCompanyCost: gross + totalEmployerBurden,
  };
}
