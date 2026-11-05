// הנחות הכדאיות. כל מספר כאן הוא הנחת עבודה שנבחרה לאשדוד, לא נתון מדוד.
// לכל הנחה: מקור או נימוק, ומעמד: "תקן" (מהמקור), "מקובל" (טווח מקצועי ידוע) או "הנחה" (בחירה שלנו, לבדיקה).

export type UnitType = 'r2' | 'r3' | 'r4' | 'r5';
export const UNIT_TYPES: UnitType[] = ['r2', 'r3', 'r4', 'r5'];

export interface UnitSpec { label: string; short: string; net: number; persons: number; priceFactor: number }

// שטח פלדלת ממוצע, נפשות ליחידה ומקדם מחיר למ"ר. מקדם המחיר: דירה קטנה נמכרת ביותר למ"ר.
export const UNITS: Record<UnitType, UnitSpec> = {
  r2: { label: '2 חדרים', short: '2 ח׳', net: 60, persons: 2.0, priceFactor: 1.12 },
  r3: { label: '3 חדרים', short: '3 ח׳', net: 85, persons: 2.9, priceFactor: 1.05 },
  r4: { label: '4 חדרים', short: '4 ח׳', net: 110, persons: 3.6, priceFactor: 1.0 },
  r5: { label: '5 חדרים', short: '5 ח׳', net: 135, persons: 4.2, priceFactor: 0.96 },
};

export interface Assumptions {
  cityId: string;
  siteW: number;            // מ'
  siteD: number;
  plateW: number;           // קומה טיפוסית במגדל, מ'
  plateD: number;
  podiumW: number;
  podiumD: number;
  grossFactor: number;      // ברוטו למגורים מול פלדלת
  priceRes: number;         // ₪ למ"ר פלדלת, דירת 4 חדרים
  priceCom: number;         // ₪ למ"ר מסחר
  priceOff: number;         // ₪ למ"ר משרדים
  costBuild: number;        // ₪ למ"ר ברוטו, עד 8 קומות
  heightPremium: number;    // תוספת עלות לכל קומה מעל 8
  costParking: number;      // ₪ למקום חניה תת־קרקעי
  softCosts: number;        // תכנון, אגרות, ניהול, משיווק: חלק מעלות הבנייה
  finance: number;          // מימון: חלק מכלל העלויות
  land: number;             // ₪ לקרקע
  budget: number;           // ₪, תקרת עלות כוללת
  profitMin: number;        // רווח יזמי מינימלי, על עלות
  parkCom: number;          // מ"ר מסחר לחניה
  parkOff: number;          // מ"ר משרדים לחניה
}

export const DEFAULTS: Assumptions = {
  cityId: 'ashdod',
  siteW: 70, siteD: 60,          // המגרש של גורד שחקים ברוגוזין
  plateW: 24, plateD: 24,        // הקומה הטיפוסית של גורד שחקים
  podiumW: 44, podiumD: 34,      // הפודיום של גורד שחקים
  grossFactor: 1.3,
  priceRes: 23500,
  priceCom: 24000,
  priceOff: 14000,
  costBuild: 7000,
  heightPremium: 0.005,
  costParking: 120000,
  softCosts: 0.15,
  finance: 0.05,
  land: 40_000_000,
  budget: 340_000_000,
  profitMin: 0.15,
  parkCom: 50,
  parkOff: 40,
};

export interface Note { key: keyof Assumptions | 'units' | 'program' | 'geometry'; label: string; value: string; status: 'תקן' | 'מקובל' | 'הנחה'; why: string }

const n = (x: number) => x.toLocaleString('he-IL');

export const NOTES: Note[] = [
  { key: 'program', label: 'פרוגרמה ציבורית', value: 'מחשבון הפרוגרמות', status: 'תקן', why: 'תקני משרד החינוך, משרד הפנים, משרד הבריאות, פיקוד העורף ותמ"א 70, כפי שהם במחשבון.' },
  { key: 'geometry', label: 'גובה ושטח', value: 'מנוע גורד שחקים', status: 'תקן', why: 'אותו מנוע גיאומטריה: פודיום, גוף וכותרת. 3.3 מ\' לקומה טיפוסית, 4.5 מ\' בפודיום.' },
  { key: 'units', label: 'נפשות ליחידה', value: '2.0 עד 4.2', status: 'הנחה', why: 'לפי גודל הדירה, מנורמל למקדם העיר מהלמ"ס. דירה קטנה מביאה פחות נפשות, אבל יותר דירות.' },
  { key: 'priceRes', label: 'מחיר מגורים', value: `${n(DEFAULTS.priceRes)} ₪ למ"ר`, status: 'הנחה', why: 'סדר גודל לדירת 4 חדרים חדשה באשדוד. לאמת מול עסקאות במערכת מידע נדל"ן של רשות המסים.' },
  { key: 'costBuild', label: 'עלות בנייה', value: `${n(DEFAULTS.costBuild)} ₪ למ"ר`, status: 'מקובל', why: `טווח מקובל לבנייה רוויה. מעל 8 קומות מתווספים ${DEFAULTS.heightPremium * 100}% לכל קומה.` },
  { key: 'costParking', label: 'חניה תת־קרקעית', value: `${n(DEFAULTS.costParking)} ₪ למקום`, status: 'הנחה', why: 'כ-30 מ"ר למקום כולל מעברים, עם חפירה ודיפון.' },
  { key: 'profitMin', label: 'רווח יזמי', value: `${DEFAULTS.profitMin * 100}% על עלות`, status: 'מקובל', why: 'כך מודדים כדאיות בתקן 21 של מועצת שמאי המקרקעין: רווח ביחס לעלות. 15% הוא הרף התחתון המקובל.' },
  { key: 'budget', label: 'תקציב', value: `${n(DEFAULTS.budget / 1e6)} מיליון ₪`, status: 'הנחה', why: 'תקרת עלות כוללת: קרקע, בנייה, חניה, עלויות רכות ומימון.' },
];
