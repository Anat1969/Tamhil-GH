// הקישורים לשלבים האחרים בשרשרת. הנתונים עוברים בכתובת, באותם שמות פרמטרים כמו באפליקציה המקבלת.
import type { Mix, Result } from './engine';
import { sumUnits, skyskiperLink } from './engine';
import type { Assumptions } from '../data/assumptions';

// חזרה לפרוגרמה: התמהיל כאחוזים מהדירות, באותו סדר סוגים (2 ← עד 55, 3 ← עד 80, 4 ← 110, 5 ← 135).
export const PROGRAMA_URL = 'https://programa-gh.vercel.app/';
export function programaLink(m: Mix, cityId: string) {
  const t = sumUnits(m) || 1;
  const pct = [m.units.r2, m.units.r3, m.units.r4, m.units.r5].map((x) => Math.round((x / t) * 100));
  pct[3] = Math.max(0, 100 - pct[0] - pct[1] - pct[2]);
  return `${PROGRAMA_URL}#/program?${new URLSearchParams({ m: pct.join('.'), c: cityId }).toString()}`;
}
export const skyFor = (r: Result, a: Assumptions, name: string) => skyskiperLink(r, a, name);
