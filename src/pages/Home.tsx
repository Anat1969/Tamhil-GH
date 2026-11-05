// דף הבית: התובנה הגדולה, האובייקט (שני המגדלים), בעיה־פתרון־תובנה, ומפת התוכן.
import { useMemo } from 'react';
import Rich from '../components/Rich';
import Towers from '../components/Towers';
import { bestMix, budgetHeight, compare, evaluate } from '../lib/engine';
import { headline, mil, n0, pc } from '../lib/insights';
import { DEFAULTS } from '../data/assumptions';
import { MIX_A, MIX_B } from '../data/mixes';
import { go } from '../lib/route';

export default function Home() {
  const a = DEFAULTS;
  const c = useMemo(() => compare(MIX_A, MIX_B, a), [a]);
  const lines = useMemo(() => ({ A: budgetHeight(MIX_A, a), B: budgetHeight(MIX_B, a) }), [a]);
  const best = useMemo(() => { const m = bestMix(MIX_A, a); return m ? evaluate(m, a) : null; }, [a]);
  const h = headline(c, a);
  const extra = best ? best.units - c.B.units : 0;
  return (
    <main className="home">
      <section className="home-text">
        <p className="label">החלטה · אדריכלות ועיצוב · רוגוזין, אשדוד (Ashdod)</p>
        <h1 className="home-h">
          <bdi className="num big">{best ? n0(extra) : '0'}</bdi>
          <Rich>{`דירות **יותר**, באותו גובה ובאותו תקציב.`}</Rich>
        </h1>
        <Rich as="p" className="home-s">{`על מגרש אחד, **${n0(c.A.units)}** דירות קטנות חורגות ב-**${mil(c.A.overBudget)}** מיליון ₪. **${n0(c.B.units)}** דירות משפחתיות מחזיקות. ==התמהיל הנכון מחזיק ${best ? n0(best.units) : ''}==.`}</Rich>

        <div className="home-tones">
          <div className="tone tone-problem"><h4>הבעיה</h4><Rich as="p">{`תמהיל נבחר לפי **מכירות**. החניה, הציבור והגובה שהוא מושך מתגלים רק בתקציב.`}</Rich></div>
          <div className="tone tone-solution"><h4>הפתרון</h4><Rich as="p">{`תמהיל ← **פרוגרמה** ← **מגדל** ← כדאיות, בחישוב אחד, לשני תמהילים זה מול זה.`}</Rich></div>
          <div className="tone tone-insight"><h4>התובנה</h4><Rich as="p">{`יותר דירות זה לא יותר קומות. **החניה** היא שמכריעה את התקציב.`}</Rich></div>
        </div>

        <div className="home-map">
          <button className="press map-card" onClick={() => go('/compare')}>
            <span className="label">השוואה</span>
            <b>ארבע שאלות, שני מגדלים</b>
            <span className="mc-n"><bdi className="num">{c.winner ? (c.winner === 'A' ? 'א' : 'ב') : '—'}</bdi> מחזיק תקציב</span>
          </button>
          <button className="press map-card" onClick={() => go('/method')}>
            <span className="label">שיטה</span>
            <b>על מה זה נשען ואיך מודדים אמינות</b>
            <span className="mc-n"><bdi className="num">{pc(c.B.priceDrop)}</bdi> ירידת מחיר שההחלטה סופגת</span>
          </button>
        </div>
        <Rich as="p" className="home-src">{`נבנה ממחשבון הפרוגרמות ומגורד שחקים. השראה: מאזן הסחר של **ויליאם פלייפייר** (William Playfair), 1786.`}</Rich>
      </section>
      <section className="home-obj" aria-label="שני התמהילים כמגדלים">
        <Towers c={c} a={a} lines={lines} compact />
        <Rich as="p" className="home-cap">{h.title}</Rich>
      </section>
    </main>
  );
}
