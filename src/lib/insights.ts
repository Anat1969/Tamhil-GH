// כל טקסט מחושב: שורת תובנה עד 8 מילים, משפט הסבר עד 20 מילים. ** = מודגש, == = מרקר תובנה.
import type { Comparison, MixKey, Result } from './engine';
import { NEIGHBOR_HEIGHT } from './engine';
import type { Assumptions } from '../data/assumptions';

export const L = (k: MixKey) => (k === 'A' ? 'א' : 'ב');
export const mil = (n: number) => Math.round(n / 1e6).toLocaleString('he-IL');
export const n0 = (n: number) => Math.round(n).toLocaleString('he-IL');
export const pc = (n: number, d = 1) => `${(n * 100).toFixed(d).replace(/\.0$/, '')}%`;

export function verdictText(r: Result, a: Assumptions) {
  if (r.holds) return { tone: 'ok' as const, short: 'מחזיק', long: `מחזיק: **${mil(r.cost.total)}** מתוך **${mil(a.budget)}** מיליון` };
  if (!r.holdsBudget) return { tone: 'bad' as const, short: `חורג ב-${mil(r.overBudget)} מיליון`, long: `חורג ב-**${mil(r.overBudget)}** מיליון ₪ מהתקציב` };
  return { tone: 'bad' as const, short: `רווח ${pc(r.margin)}`, long: `רווח **${pc(r.margin)}**, מתחת לרף **${pc(a.profitMin, 0)}**` };
}

// הכותרת של ההשוואה: התשובה לשאלה "איזה תמהיל מחזיק תקציב".
export function headline(c: Comparison, a: Assumptions) {
  const w = c.winner, o: MixKey = w === 'A' ? 'B' : 'A';
  if (w && !c[o].holds) {
    return {
      title: `**תמהיל ${L(w)}** מחזיק תקציב, ${L(o)} לא.`,
      sub: `תמהיל ${L(o)} ${c[o].holdsBudget ? `מרוויח רק **${pc(c[o].margin)}**` : `חורג ב-**${mil(c[o].overBudget)}** מיליון ₪`}, ותמהיל ${L(w)} נשאר עם רווח של **${pc(c[w].margin)}**.`,
    };
  }
  if (w) {
    return {
      title: `שניהם מחזיקים, **תמהיל ${L(w)}** מרוויח יותר.`,
      sub: `רווח של **${pc(c[w].margin)}** מול **${pc(c[o].margin)}**, בתקציב של **${mil(a.budget)}** מיליון ₪.`,
    };
  }
  const k = c.closer;
  return {
    title: `**אף תמהיל** לא מחזיק תקציב.`,
    sub: `תמהיל ${L(k)} הכי קרוב: ${c[k].holdsBudget ? `רווח **${pc(c[k].margin)}** מול רף **${pc(a.profitMin, 0)}**` : `חורג ב-**${mil(c[k].overBudget)}** מיליון ₪`}.`,
  };
}

// למה ההפרש בעלות: הרכיב שמסביר את רוב הפער.
export function costDriver(c: Comparison) {
  const parts: [string, number][] = [
    ['בנייה', c.A.cost.hard - c.B.cost.hard],
    ['חניה', c.A.cost.parking - c.B.cost.parking],
    ['עלויות רכות ומימון', c.A.cost.soft + c.A.cost.finance - c.B.cost.soft - c.B.cost.finance],
  ];
  const diff = c.A.cost.total - c.B.cost.total;
  const hi: MixKey = diff >= 0 ? 'A' : 'B';
  const top = parts.slice().sort((x, y) => Math.abs(y[1]) - Math.abs(x[1]))[0];
  if (Math.abs(diff) < 1e6) return { title: 'העלויות כמעט זהות.', sub: `ההפרש בין התמהילים קטן ממיליון ₪, וההכנסה היא שמכריעה.` };
  const park = Math.abs(c.A.parking - c.B.parking);
  return {
    title: `**${top[0]}** מסבירה את רוב הפער.`,
    sub: `תמהיל ${L(hi)} יקר ב-**${mil(Math.abs(diff))}** מיליון ₪, מהם **${mil(Math.abs(top[1]))}** ב${top[0]}${top[0] === 'חניה' ? `: **${n0(park)}** מקומות נוספים` : ''}.`,
  };
}

export function heightText(c: Comparison) {
  const hi: MixKey = c.A.height >= c.B.height ? 'A' : 'B', lo: MixKey = hi === 'A' ? 'B' : 'A';
  const dh = c[hi].height - c[lo].height;
  const ratio = c[hi].height / NEIGHBOR_HEIGHT;
  if (dh < 1) return { title: 'אותו גובה, תמהיל אחר.', sub: `שני המגדלים **${n0(c.A.height)}** מ', פי **${ratio.toFixed(1)}** מהבניינים ברוגוזין.` };
  const du = c[hi].units - c[lo].units;
  return {
    title: `תמהיל ${L(hi)} גבוה ב-**${n0(dh)}** מ'.`,
    sub: `**${n0(c[hi].floors - c[lo].floors)}** קומות נוספות${du > 0 ? ` בשביל **${n0(du)}** דירות` : ''}, פי **${ratio.toFixed(1)}** מהבניינים ברוגוזין.`,
  };
}

export function burdenText(c: Comparison) {
  const hi: MixKey = c.A.residents >= c.B.residents ? 'A' : 'B', lo: MixKey = hi === 'A' ? 'B' : 'A';
  const dr = c[hi].residents - c[lo].residents, dp = c.A.parking - c.B.parking;
  const pk: MixKey = dp >= 0 ? 'A' : 'B';
  return {
    title: Math.abs(dp) > dr / 3 ? `החניה, לא התושבים, היא העומס.` : `**${n0(dr)}** תושבים נוספים בתמהיל ${L(hi)}.`,
    sub: `תמהיל ${L(pk)} דורש **${n0(Math.abs(dp))}** חניות נוספות, ותמהיל ${L(hi)} עוד **${n0(c[hi].program.builtPublic - c[lo].program.builtPublic)}** מ"ר ציבורי מבונה.`,
  };
}

export function stabilityText(c: Comparison, a: Assumptions) {
  const k = c.winner ?? c.closer, r = c[k];
  if (!r.holdsProfit) return { title: 'ההחלטה עוד לא עומדת.', sub: `צריך עלייה של **${pc(-r.priceDrop)}** במחיר המגורים כדי שתמהיל ${L(k)} יגיע לרף.` };
  const flip = c.flipAt != null ? ` הדירוג מתהפך ב-**${pc(Math.abs(c.flipAt))}** ${c.flipAt < 0 ? 'ירידה' : 'עלייה'} במחיר.` : '';
  return {
    title: r.priceDrop > 0.08 ? `החלטה **יציבה**: סופגת ירידת מחירים.` : `החלטה **רגישה** למחיר הדירה.`,
    sub: `תמהיל ${L(k)} נשאר מעל רף **${pc(a.profitMin, 0)}** עד ירידה של **${pc(r.priceDrop)}** במחיר המגורים.${flip}`,
  };
}
