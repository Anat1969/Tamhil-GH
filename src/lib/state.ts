// מצב ההשוואה: בכתובת (העתקת קישור פותחת אותו מצב) ובזיכרון המקומי.
import { useMemo } from 'react';
import { useRoute, setParams } from './route';
import { compare, decodeMix, encodeMix, type Mix } from './engine';
import { DEFAULTS, type Assumptions } from '../data/assumptions';
import { MIX_A, MIX_B } from '../data/mixes';

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
  const budget = Number(get('budget')) || DEFAULTS.budget;
  const a: Assumptions = { ...DEFAULTS, cityId: get('c') || DEFAULTS.cityId, budget };
  const key = [encodeMix(A), encodeMix(B), a.cityId, a.budget].join('|');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cmp = useMemo(() => compare(A, B, a), [key]);
  const set = (patch: { A?: Mix; B?: Mix; c?: string; budget?: number }) => {
    const nA = patch.A ?? A, nB = patch.B ?? B;
    const next: Saved = { a: encodeMix(nA), b: encodeMix(nB), an: nA.name, bn: nB.name, c: patch.c ?? a.cityId, budget: patch.budget ?? a.budget };
    save(next);
    setParams({ a: next.a, b: next.b, an: next.an, bn: next.bn, c: next.c, budget: String(next.budget) });
  };
  return { A, B, a, cmp, set };
}
