/**
 * 日本給与計算ロジック(令和7年度基準)
 *
 * 料率・税額計算式はすべてこのファイル冒頭の定数にまとめてある。
 * 年度更新の際はここだけ書き換えればよい。
 */

// ============ 料率定数(令和7年度) ============

/** 協会けんぽ 都道府県別 健康保険料率(%)令和7年度 */
export const PREFECTURES: { name: string; rate: number }[] = [
  { name: "北海道", rate: 10.31 },
  { name: "青森県", rate: 9.85 },
  { name: "岩手県", rate: 9.62 },
  { name: "宮城県", rate: 10.11 },
  { name: "秋田県", rate: 10.01 },
  { name: "山形県", rate: 9.75 },
  { name: "福島県", rate: 9.62 },
  { name: "茨城県", rate: 9.67 },
  { name: "栃木県", rate: 9.82 },
  { name: "群馬県", rate: 9.77 },
  { name: "埼玉県", rate: 9.76 },
  { name: "千葉県", rate: 9.79 },
  { name: "東京都", rate: 9.91 },
  { name: "神奈川県", rate: 9.92 },
  { name: "新潟県", rate: 9.55 },
  { name: "富山県", rate: 9.65 },
  { name: "石川県", rate: 9.88 },
  { name: "福井県", rate: 9.94 },
  { name: "山梨県", rate: 9.89 },
  { name: "長野県", rate: 9.69 },
  { name: "岐阜県", rate: 9.93 },
  { name: "静岡県", rate: 9.80 },
  { name: "愛知県", rate: 10.03 },
  { name: "三重県", rate: 9.99 },
  { name: "滋賀県", rate: 9.97 },
  { name: "京都府", rate: 10.03 },
  { name: "大阪府", rate: 10.24 },
  { name: "兵庫県", rate: 10.16 },
  { name: "奈良県", rate: 10.02 },
  { name: "和歌山県", rate: 10.19 },
  { name: "鳥取県", rate: 9.93 },
  { name: "島根県", rate: 9.94 },
  { name: "岡山県", rate: 10.17 },
  { name: "広島県", rate: 9.97 },
  { name: "山口県", rate: 10.36 },
  { name: "徳島県", rate: 10.47 },
  { name: "香川県", rate: 10.21 },
  { name: "愛媛県", rate: 10.18 },
  { name: "高知県", rate: 10.13 },
  { name: "福岡県", rate: 10.31 },
  { name: "佐賀県", rate: 10.78 },
  { name: "長崎県", rate: 10.41 },
  { name: "熊本県", rate: 10.27 },
  { name: "大分県", rate: 10.25 },
  { name: "宮崎県", rate: 9.85 },
  { name: "鹿児島県", rate: 10.31 },
  { name: "沖縄県", rate: 9.44 },
];

/** 介護保険料率(協会けんぽ・全国一律)% */
export const KAIGO_RATE = 1.59;
/** 厚生年金保険料率 % */
export const PENSION_RATE = 18.3;
/** 雇用保険料率(一般の事業)% */
export const KOYO_EMPLOYEE_RATE = 0.55;
export const KOYO_EMPLOYER_RATE = 0.9;
/** 子ども・子育て拠出金率(会社のみ負担)% */
export const KODOMO_RATE = 0.36;
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

/** 厚生年金の標準報酬月額(第1等級88,000円〜第32等級650,000円) */
export function pensionSMR(monthlySalary: number): number {
  const smr = healthSMR(monthlySalary);
  return Math.min(Math.max(smr, 88000), 650000);
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

// ============ 源泉所得税(電算機計算の特例・令和7年分・甲欄) ============

/**
 * 月額給与の源泉徴収所得税を計算する。
 * @param afterShakaiHoken 社会保険料等控除後の給与等の金額
 * @param dependents 扶養親族等の数
 */
export function calcWithholdingTax(afterShakaiHoken: number, dependents: number): number {
  const A = afterShakaiHoken;
  if (A <= 0) return 0;

  // 給与所得控除の月額(1円未満切上げ)
  let B: number;
  if (A <= 135416) B = 45834;
  else if (A <= 149999) B = A * 0.4 - 8333;
  else if (A <= 299999) B = A * 0.3 + 6667;
  else if (A <= 549999) B = A * 0.2 + 36667;
  else if (A <= 708330) B = A * 0.1 + 91667;
  else B = 162500;
  B = Math.ceil(B);

  // 基礎控除の月額 + 扶養控除の月額
  const C = 40000;
  const D = 31667 * dependents;

  const taxable = Math.max(0, A - B - C - D);
  if (taxable <= 0) return 0;

  // 税額の月割計算式(復興特別所得税込み)
  let tax: number;
  if (taxable <= 162500) tax = taxable * 0.05105;
  else if (taxable <= 275000) tax = taxable * 0.1021 - 8296;
  else if (taxable <= 579166) tax = taxable * 0.2042 - 36374;
  else if (taxable <= 750000) tax = taxable * 0.23483 - 54113;
  else if (taxable <= 1500000) tax = taxable * 0.33693 - 130688;
  else if (taxable <= 3333333) tax = taxable * 0.4084 - 237893;
  else tax = taxable * 0.45945 - 408061;

  // 10円未満四捨五入
  return Math.max(0, Math.round(tax / 10) * 10);
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
  insuranceType: "kyokai" | "kumiai"; // 協会けんぽ / 組合健保
  // 組合健保のときのみ使用(%)
  kumiaiHealthEmployeeRate: number;
  kumiaiHealthEmployerRate: number;
  kumiaiKaigoEmployeeRate: number;
  kumiaiKaigoEmployerRate: number;
  kumiaiFee: number; // 組合費(本人給与から控除・円/月)
  rousaiRate: number; // 労災保険料率 %
}

export interface PayrollResult {
  paymentYear: number;
  paymentMonth: number;
  healthSmr: number;
  pensionSmr: number;
  kaigoApplied: boolean;
  // 本人負担
  healthEmployee: number;
  kaigoEmployee: number;
  pensionEmployee: number;
  koyoEmployee: number;
  incomeTax: number;
  kumiaiFee: number;
  totalEmployeeDeduction: number;
  netPay: number; // 手取り
  // 会社負担
  healthEmployer: number;
  kaigoEmployer: number;
  pensionEmployer: number;
  koyoEmployer: number;
  kodomoContribution: number;
  rousai: number;
  totalEmployerBurden: number;
  totalCompanyCost: number; // 総支給額 + 会社負担合計
}

export function calcPayroll(input: PayrollInput): PayrollResult {
  const birth = new Date(input.birth + "T00:00:00");
  const gross = input.grossSalary;

  // 支給月(勤務月 + オフセット)
  const totalM = ym(input.workYear, input.workMonth) + input.paymentOffset;
  const paymentYear = Math.floor(totalM / 12);
  const paymentMonth = (totalM % 12) + 1;

  const hSmr = healthSMR(gross);
  const pSmr = pensionSMR(gross);

  // 保険料の対象月は勤務月で判定
  const healthOk = isHealthTarget(birth, input.workYear, input.workMonth);
  const kaigoOk = healthOk && isKaigoTarget(birth, input.workYear, input.workMonth);
  const pensionOk = isPensionTarget(birth, input.workYear, input.workMonth);

  // ---- 健康保険・介護保険 ----
  let healthEmployee = 0, healthEmployer = 0, kaigoEmployee = 0, kaigoEmployer = 0;
  if (healthOk) {
    if (input.insuranceType === "kyokai") {
      const rate = PREFECTURES[input.prefectureIndex].rate / 100;
      const total = hSmr * rate;
      healthEmployee = roundEmployeeShare(total / 2);
      healthEmployer = Math.round(total) - healthEmployee;
      if (kaigoOk) {
        const kTotal = hSmr * (KAIGO_RATE / 100);
        kaigoEmployee = roundEmployeeShare(kTotal / 2);
        kaigoEmployer = Math.round(kTotal) - kaigoEmployee;
      }
    } else {
      // 組合健保: 本人・会社の料率を個別指定
      healthEmployee = roundEmployeeShare(hSmr * (input.kumiaiHealthEmployeeRate / 100));
      healthEmployer = Math.round(hSmr * (input.kumiaiHealthEmployerRate / 100));
      if (kaigoOk) {
        kaigoEmployee = roundEmployeeShare(hSmr * (input.kumiaiKaigoEmployeeRate / 100));
        kaigoEmployer = Math.round(hSmr * (input.kumiaiKaigoEmployerRate / 100));
      }
    }
  }

  // ---- 厚生年金 ----
  let pensionEmployee = 0, pensionEmployer = 0;
  if (pensionOk) {
    const total = pSmr * (PENSION_RATE / 100);
    pensionEmployee = roundEmployeeShare(total / 2);
    pensionEmployer = Math.round(total) - pensionEmployee;
  }

  // ---- 雇用保険・労災(役員は対象外) ----
  let koyoEmployee = 0, koyoEmployer = 0, rousai = 0;
  if (!input.isExecutive) {
    koyoEmployee = roundEmployeeShare(gross * (KOYO_EMPLOYEE_RATE / 100));
    koyoEmployer = Math.round(gross * (KOYO_EMPLOYER_RATE / 100));
    rousai = Math.round(gross * (input.rousaiRate / 100));
  }

  // ---- 子ども・子育て拠出金(厚生年金の標準報酬月額 × 0.36%・会社のみ) ----
  const kodomoContribution = pensionOk ? Math.round(pSmr * (KODOMO_RATE / 100)) : 0;

  // ---- 源泉所得税 ----
  const shakaiHoken = healthEmployee + kaigoEmployee + pensionEmployee + koyoEmployee;
  const incomeTax = calcWithholdingTax(gross - shakaiHoken, input.dependents);

  const kumiaiFee = input.insuranceType === "kumiai" ? Math.round(input.kumiaiFee || 0) : 0;

  const totalEmployeeDeduction = shakaiHoken + incomeTax + kumiaiFee;
  const netPay = gross - totalEmployeeDeduction;

  const totalEmployerBurden =
    healthEmployer + kaigoEmployer + pensionEmployer + koyoEmployer + kodomoContribution + rousai;

  return {
    paymentYear,
    paymentMonth,
    healthSmr: hSmr,
    pensionSmr: pSmr,
    kaigoApplied: kaigoOk,
    healthEmployee,
    kaigoEmployee,
    pensionEmployee,
    koyoEmployee,
    incomeTax,
    kumiaiFee,
    totalEmployeeDeduction,
    netPay,
    healthEmployer,
    kaigoEmployer,
    pensionEmployer,
    koyoEmployer,
    kodomoContribution,
    rousai,
    totalEmployerBurden,
    totalCompanyCost: gross + totalEmployerBurden,
  };
}
