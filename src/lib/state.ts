// מצב ההשוואה: בכתובת (העתקת קישור פותחת אותו מצב) ובזיכרון המקומי.
import { useMemo } from 'react';
import { useRoute, setParams } from './route';
import { compare, decodeMix, encodeMix, type Mix } from './engine';
import { DEFAULTS, type Assumptions } from '../data/assumptions';
import { MIX_A, MIX_B } from '../data/mixes';
import { decodeDossier } from './dossier';

// תקציב למגרש מהתיק: 13,800 ₪ למ"ר זכויות (מגורים, מסחר ותעסוקה), כמו 340 מיליון לכ-24,700 מ"ר בברירת המחדל (הנחה).
export const BUDGET_PER_M2 = 13_800;

const KEY = 'tamhil:v1';
type Saved = { a?: string; b?: string; an?: string; bn?: string; c?: string; budget?: number };
const load = (): Saved => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
const save = (s: Saved) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* פרטי */ } };

export function useStudio() {
  const { q } = useRoute();
  const saved = load();
  const get = (k: keyof Saved) => q.get(k) ?? (saved[k] != null ? String(saved[k]) : null);
  const A = decodeMix(get('a'), 'A', get('an') || MIX_A.name, MIX_A);
  const B = decodeMix(get('b'), 'B', get('bn') || MIX_B.name, MIX_B);
  // תיק פרויקט מהשלב הקודם: המגרש מטבלה 5 של התב"ע קובע את המגרש, את הקומה הטיפוסית ואת התקציב
  const dossier = decodeDossier(q.get('d'));
  const lot = dossier?.lot;
  const budget = Number(q.get('budget')) || (lot ? Math.round(((lot.res + lot.com + lot.emp) * BUDGET_PER_M2) / 1e6) * 1e6 : Number(saved.budget) || DEFAULTS.budget);
  const side = lot ? Math.round(Math.sqrt(lot.areaM2)) : 0;
  const plate = lot ? Math.round(Math.sqrt(lot.res / lot.floors)) : 0;
  const a: Assumptions = lot
    ? { ...DEFAULTS, cityId: get('c') || DEFAULTS.cityId, budget, siteW: side, siteD: side, plateW: plate, plateD: plate, podiumW: side - 6, podiumD: side - 6 }
    : { ...DEFAULTS, cityId: get('c') || DEFAULTS.cityId, budget };
  const key = [encodeMix(A), encodeMix(B), a.cityId, a.budget, side, plate].join('|');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cmp = useMemo(() => compare(A, B, a), [key]);
  const set = (patch: { A?: Mix; B?: Mix; c?: string; budget?: number }) => {
    const nA = patch.A ?? A, nB = patch.B ?? B;
    const next: Saved = { a: encodeMix(nA), b: encodeMix(nB), an: nA.name, bn: nB.name, c: patch.c ?? a.cityId, budget: patch.budget ?? a.budget };
    save(next);
    setParams({ a: next.a, b: next.b, an: next.an, bn: next.bn, c: next.c, budget: String(next.budget) });
  };
  return { A, B, a, cmp, set, dossier };
}
