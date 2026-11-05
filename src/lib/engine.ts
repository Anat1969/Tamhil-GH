// המנוע: תמהיל → פרוגרמה (מחשבון הפרוגרמות) → מגדל (גורד שחקים) → כדאיות. פונקציות טהורות, בלי React.
import { buildTower } from './skyskiper-geometry.js';
import presets from '../data/skyskiper-presets.json';
import { CITIES, program, type Program } from '../data/program';
import { UNITS, UNIT_TYPES, type Assumptions, type UnitType } from '../data/assumptions';

export type MixKey = 'A' | 'B';
export interface Mix { key: MixKey; name: string; units: Record<UnitType, number>; commercial: number; office: number }

export const NEIGHBOR_HEIGHT = 12; // גובה הבניינים ברוגוזין, ההנחה של גורד שחקים (OSM בלי מספר קומות)
const PODIUM_FH = 4.5;
const BODY_FH = 3.3;

export interface Slab { mass: string; floor: number; z0: number; z1: number; points: [number, number][]; kind: string; use?: string }

export interface Result {
  mix: Mix;
  units: number;
  netRes: number;           // מ"ר פלדלת
  grossRes: number;
  residents: number;
  program: Program;
  podiumArea: number;       // מסחר + משרדים + ציבור מבונה
  podiumFloors: number;
  bodyFloors: number;
  floors: number;
  height: number;
  gfa: number;
  slabs: Slab[];
  parking: number;
  cost: { land: number; hard: number; parking: number; soft: number; finance: number; total: number; perM2: number };
  revenue: { res: number; com: number; off: number; total: number };
  profit: number;
  margin: number;
  overBudget: number;       // ₪ מעבר לתקציב (שלילי = מרווח)
  holdsBudget: boolean;
  holdsProfit: boolean;
  holds: boolean;
  priceDrop: number;        // כמה ירידה במחיר המגורים התמהיל סופג לפני שהוא יורד מתחת לרף הרווח
}

export const sumUnits = (m: Mix) => UNIT_TYPES.reduce((a, t) => a + (m.units[t] || 0), 0);
export const cityOf = (id: string) => CITIES.find((c) => c.id === id) ?? CITIES[0];

// נפשות: לפי סוג הדירה, מנורמל למקדם העיר (3.3 הוא הממוצע המשוקלל של התמהיל הסטנדרטי).
export function residentsOf(m: Mix, a: Assumptions) {
  const k = cityOf(a.cityId).coefficient / 3.3;
  return Math.round(UNIT_TYPES.reduce((s, t) => s + (m.units[t] || 0) * UNITS[t].persons, 0) * k);
}

function shape(m: Mix, a: Assumptions) {
  const units = sumUnits(m);
  const netRes = UNIT_TYPES.reduce((s, t) => s + (m.units[t] || 0) * UNITS[t].net, 0);
  const grossRes = netRes * a.grossFactor;
  const residents = residentsOf(m, a);
  const prog = program(units, residents);
  const podiumArea = m.commercial + m.office + prog.builtPublic;
  const podiumPlate = a.podiumW * a.podiumD;
  const podiumFloors = Math.max(1, Math.min(12, Math.ceil(podiumArea / podiumPlate)));
  const bodyFloors = Math.max(1, Math.min(160, Math.ceil(grossRes / (a.plateW * a.plateD))));
  return { units, netRes, grossRes, residents, prog, podiumArea, podiumFloors, bodyFloors };
}

// הפרויקט של גורד שחקים, עם הקומות שהתמהיל דורש.
export function towerProject(a: Assumptions, podiumFloors: number, bodyFloors: number) {
  const p = JSON.parse(JSON.stringify(presets.default));
  p.site = { ...p.site, width: a.siteW, depth: a.siteD };
  p.base.footprint = { ...p.base.footprint, width: a.podiumW, depth: a.podiumD };
  p.base.height = { ...p.base.height, floors: podiumFloors, floorHeight: PODIUM_FH, doubleGround: false };
  p.body.footprint = { ...p.body.footprint, width: a.plateW, depth: a.plateD };
  p.body.height = { ...p.body.height, floors: bodyFloors, floorHeight: BODY_FH };
  p.crown.footprint = { ...p.crown.footprint, width: Math.min(a.plateW, p.crown.footprint.width), depth: Math.min(a.plateD, p.crown.footprint.depth) };
  return p;
}

function money(a: Assumptions, gfa: number, floors: number, parking: number) {
  const perM2 = a.costBuild * (1 + a.heightPremium * Math.max(0, floors - 8));
  const hard = gfa * perM2;
  const park = parking * a.costParking;
  const soft = a.softCosts * (hard + park);
  const sub = a.land + hard + park + soft;
  const finance = a.finance * sub;
  return { land: a.land, hard, parking: park, soft, finance, total: sub + finance, perM2 };
}

function revenueOf(m: Mix, a: Assumptions) {
  const res = UNIT_TYPES.reduce((s, t) => s + (m.units[t] || 0) * UNITS[t].net * UNITS[t].priceFactor, 0) * a.priceRes;
  const com = m.commercial * a.priceCom;
  const off = m.office * a.priceOff;
  return { res, com, off, total: res + com + off };
}

const parkingOf = (m: Mix, a: Assumptions, prog: Program) =>
  prog.parkingResidents + prog.parkingVisitors + Math.ceil(m.commercial / a.parkCom) + Math.ceil(m.office / a.parkOff);

function verdict(m: Mix, a: Assumptions, cost: Result['cost'], revenue: Result['revenue']) {
  const profit = revenue.total - cost.total;
  const margin = cost.total ? profit / cost.total : 0;
  const holdsBudget = cost.total <= a.budget;
  const holdsProfit = margin >= a.profitMin;
  const fMin = revenue.res ? (cost.total * (1 + a.profitMin) - revenue.com - revenue.off) / revenue.res : 1;
  return { profit, margin, holdsBudget, holdsProfit, holds: holdsBudget && holdsProfit, overBudget: cost.total - a.budget, priceDrop: 1 - fMin, _m: m };
}

export function evaluate(m: Mix, a: Assumptions): Result {
  const s = shape(m, a);
  const { slabs, metrics } = buildTower(towerProject(a, s.podiumFloors, s.bodyFloors)) as { slabs: Slab[]; metrics: { height: number; floors: number; gfa: number } };
  const parking = parkingOf(m, a, s.prog);
  const cost = money(a, metrics.gfa, metrics.floors, parking);
  const revenue = revenueOf(m, a);
  const v = verdict(m, a, cost, revenue);
  return {
    mix: m, units: s.units, netRes: s.netRes, grossRes: s.grossRes, residents: s.residents, program: s.prog,
    podiumArea: s.podiumArea, podiumFloors: s.podiumFloors, bodyFloors: s.bodyFloors,
    floors: metrics.floors, height: metrics.height, gfa: metrics.gfa, slabs, parking, cost, revenue,
    profit: v.profit, margin: v.margin, overBudget: v.overBudget, holdsBudget: v.holdsBudget, holdsProfit: v.holdsProfit, holds: v.holds, priceDrop: v.priceDrop,
  };
}

// ---------- ההשוואה ----------
export interface Comparison {
  A: Result; B: Result;
  winner: MixKey | null;     // התמהיל שמחזיק תקציב; כששניהם מחזיקים, זה עם הרווח הגבוה; כשאף אחד, null
  closer: MixKey;            // כשאף אחד לא מחזיק: מי קרוב יותר
  flipAt: number | null;     // שינוי במחיר המגורים שבו סדר הרווח מתהפך (למשל -0.08)
}

export function compare(A: Mix, B: Mix, a: Assumptions): Comparison {
  const ra = evaluate(A, a), rb = evaluate(B, a);
  let winner: MixKey | null = null;
  if (ra.holds && rb.holds) winner = ra.profit >= rb.profit ? 'A' : 'B';
  else if (ra.holds) winner = 'A';
  else if (rb.holds) winner = 'B';
  const gap = (r: Result) => Math.max(0, r.overBudget) / a.budget + Math.max(0, a.profitMin - r.margin);
  const closer: MixKey = gap(ra) <= gap(rb) ? 'A' : 'B';
  // רווח_i(f) = מגורים_i·f + אחר_i − עלות_i. נקודת ההיפוך: f שבו הרווחים שווים.
  const dRes = ra.revenue.res - rb.revenue.res;
  let flipAt: number | null = null;
  if (Math.abs(dRes) > 1) {
    const f = ((rb.revenue.com + rb.revenue.off - rb.cost.total) - (ra.revenue.com + ra.revenue.off - ra.cost.total)) / dRes;
    if (f > 0.6 && f < 1.4) flipAt = f - 1;
  }
  return { A: ra, B: rb, winner, closer, flipAt };
}

// ---------- התמהיל שמחזיק ----------
// חיפוש: הכי הרבה דירות שהתקציב והרווח מחזיקים, בלי סוג דירה מעל 40%, עם המסחר והמשרדים של התמהיל הנתון.
// מסלול מהיר בלי גיאומטריה (מלבנים: שטח = קומות × לוח), והתוצאה נבדקת שוב במנוע המלא.
const baseCache = new Map<string, { gfa: number; floors: number; height: number }>();
// שטח ברוטו מהיר: מגדל של קומה אחת בפודיום וקומה אחת בגוף נבנה פעם אחת במנוע, וכל קומה נוספת היא מלבן.
function unitTower(a: Assumptions) {
  const k = [a.podiumW, a.podiumD, a.plateW, a.plateD, a.siteW, a.siteD].join('|');
  let v = baseCache.get(k);
  if (!v) {
    const { metrics } = buildTower(towerProject(a, 1, 1)) as { metrics: { gfa: number; floors: number; height: number } };
    v = { gfa: metrics.gfa, floors: metrics.floors, height: metrics.height };
    baseCache.set(k, v);
  }
  return v;
}

export function fastTotals(m: Mix, a: Assumptions) {
  const s = shape(m, a);
  const u = unitTower(a);
  const gfa = u.gfa + (s.podiumFloors - 1) * a.podiumW * a.podiumD + (s.bodyFloors - 1) * a.plateW * a.plateD;
  const floors = u.floors + s.podiumFloors - 1 + s.bodyFloors - 1;
  const height = u.height + (s.podiumFloors - 1) * PODIUM_FH + (s.bodyFloors - 1) * BODY_FH;
  const cost = money(a, gfa, floors, parkingOf(m, a, s.prog));
  const revenue = revenueOf(m, a);
  return { ...verdict(m, a, cost, revenue), gfa, floors, height, units: s.units, total: cost.total };
}

// קו התקציב: באיזה גובה הכסף נגמר, אם מגדילים או מקטינים את אותו תמהיל באותם יחסים.
export function budgetHeight(m: Mix, a: Assumptions): number | null {
  const scaled = (k: number): Mix => ({ ...m, units: Object.fromEntries(UNIT_TYPES.map((t) => [t, Math.round((m.units[t] || 0) * k)])) as Record<UnitType, number> });
  if (fastTotals(scaled(0.02), a).total > a.budget) return null;
  let lo = 0.02, hi = 4;
  if (fastTotals(scaled(hi), a).total <= a.budget) return null;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (fastTotals(scaled(mid), a).total <= a.budget) lo = mid; else hi = mid;
  }
  return fastTotals(scaled(lo), a).height;
}

export function bestMix(base: Mix, a: Assumptions, cap = 0.4): Mix | null {
  let best: { m: Mix; units: number; margin: number } | null = null;
  const steps = [0, 0.1, 0.2, 0.3, 0.4];
  for (let total = 40; total <= 600; total += 10) {
    let anyHolds = false;
    for (const s2 of steps) for (const s3 of steps) for (const s4 of steps) {
      const s5 = +(1 - s2 - s3 - s4).toFixed(2);
      if (s5 < 0 || s5 > cap + 1e-9) continue;
      const units = { r2: Math.round(total * s2), r3: Math.round(total * s3), r4: Math.round(total * s4), r5: 0 } as Record<UnitType, number>;
      units.r5 = total - units.r2 - units.r3 - units.r4;
      const m: Mix = { ...base, key: base.key, name: 'התמהיל שמחזיק', units };
      const t = fastTotals(m, a);
      if (!t.holds) continue;
      anyHolds = true;
      if (!best || t.units > best.units || (t.units === best.units && t.margin > best.margin)) best = { m, units: t.units, margin: t.margin };
    }
    if (!anyHolds && best && total > best.units + 60) break;
  }
  return best?.m ?? null;
}

// ---------- מצב בכתובת ----------
export const encodeMix = (m: Mix) => [m.units.r2, m.units.r3, m.units.r4, m.units.r5, m.commercial, m.office].join('.');
export function decodeMix(s: string | null, key: MixKey, name: string, fallback: Mix): Mix {
  if (!s) return fallback;
  const n = s.split('.').map((x) => Math.max(0, Math.min(100000, parseInt(x, 10) || 0)));
  if (n.length < 6) return fallback;
  return { key, name, units: { r2: n[0], r3: n[1], r4: n[2], r5: n[3] }, commercial: n[4], office: n[5] };
}
