// מסך ההשוואה: שאלות המשתמש הן המבנה. כותרת עם התשובה, מוקד אחד (המגדלים), ארבע שאלות עם מספר גדול, וסרגל כפתורים קבוע.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Rich from '../components/Rich';
import Towers from '../components/Towers';
import MoneyBars from '../components/MoneyBars';
import MixTable from '../components/MixTable';
import { useStudio } from '../lib/state';
import { bestMix, budgetHeight, evaluate, sumUnits, type MixKey } from '../lib/engine';
import { L, burdenText, costDriver, headline, heightText, mil, n0, pc, stabilityText, verdictText } from '../lib/insights';
import { PRESETS } from '../data/mixes';
import { UNITS } from '../data/assumptions';
import { CITIES } from '../data/program';
import { requestBrief, type Brief } from '../lib/ai';

type Pane = 'answer' | 'towers' | 'money' | 'mix';
const PANES: [Pane, string][] = [['answer', 'תשובות'], ['towers', 'מגדלים'], ['money', 'כסף'], ['mix', 'תמהיל']];

export default function Studio() {
  const { A, B, a, cmp: c, set } = useStudio();
  const [pane, setPane] = useState<Pane>('answer');
  const [brief, setBrief] = useState<Brief | null>(null);
  const [briefState, setBriefState] = useState<'idle' | 'busy' | 'error'>('idle');
  const [briefErr, setBriefErr] = useState('');
  const abort = useRef<AbortController | null>(null);

  const lines = useMemo(() => ({ A: budgetHeight(A, a), B: budgetHeight(B, a) }), [c]); // eslint-disable-line react-hooks/exhaustive-deps
  const loser: MixKey = c.winner === 'A' ? 'B' : c.winner === 'B' ? 'A' : c.closer === 'A' ? 'B' : 'A';
  const fixFor: MixKey = c[loser].holds ? (c.A.units >= c.B.units ? 'A' : 'B') : loser;
  const best = useMemo(() => bestMix(c[fixFor].mix, a), [c, fixFor, a]);
  const bestR = useMemo(() => (best ? evaluate(best, a) : null), [best, a]);
  const extra = bestR ? bestR.units - Math.max(...(['A', 'B'] as MixKey[]).filter((k) => c[k].holds).map((k) => c[k].units), 0) : 0;

  useEffect(() => { setBrief(null); setBriefState('idle'); abort.current?.abort(); }, [c]);

  const h = headline(c, a), ht = heightText(c), cd = costDriver(c), bt = burdenText(c), st = stabilityText(c, a);
  const vA = verdictText(c.A, a), vB = verdictText(c.B, a);

  const ask = async () => {
    abort.current?.abort();
    const ctl = new AbortController(); abort.current = ctl;
    setBriefState('busy'); setBriefErr('');
    try { setBrief(await requestBrief(c, a, ctl.signal)); setBriefState('idle'); }
    catch (e) { if (!ctl.signal.aborted) { setBriefState('error'); setBriefErr((e as Error).message); } }
  };

  const Q = ({ n, q, big, unit, ins, tone }: { n: string; q: string; big: ReactNode; unit?: string; ins: { title: string; sub: string }; tone?: string }) => (
    <article className={`q ${tone ?? ''}`} data-info>
      <div className="q-head"><span className="q-n num">{n}</span><h3>{q}</h3></div>
      <div className="q-big">{big}{unit && <span className="q-unit">{unit}</span>}</div>
      <Rich as="p" className="q-ins">{ins.title}</Rich>
      <Rich as="p" className="q-sub">{ins.sub}</Rich>
    </article>
  );

  const pair = (fa: string, fb: string) => (
    <span className="pair"><span><small>א</small><bdi className="num">{fa}</bdi></span><span className="vs">מול</span><span><small>ב</small><bdi className="num">{fb}</bdi></span></span>
  );

  return (
    <main className="studio" data-pane={pane}>
      <section className="lens">
        <div className="lens-text">
          <div className="crumbs"><a href="#/">בית</a> / השוואה</div>
          <Rich as="h1" className="lens-h">{h.title}</Rich>
          <Rich as="p" className="lens-s">{h.sub}</Rich>
        </div>
        <div className="lens-ctl">
          <label className="ctl"><span className="label">עיר</span>
            <select className="field" value={a.cityId} onChange={(e) => set({ c: e.target.value })}>
              {CITIES.map((x) => <option key={x.id} value={x.id}>{x.name} · {x.coefficient} נפש</option>)}
            </select>
          </label>
          <label className="ctl"><span className="label">תקציב, מיליוני ₪</span>
            <input className="field num" inputMode="numeric" value={Math.round(a.budget / 1e6)} onChange={(e) => set({ budget: (Number(e.target.value.replace(/\D/g, '')) || 1) * 1e6 })} />
          </label>
        </div>
        <nav className="panes" aria-label="חלקי המסך">
          {PANES.map(([p, l]) => <button key={p} className="press chip" aria-pressed={pane === p} onClick={() => setPane(p)}>{l}</button>)}
        </nav>
      </section>

      <div className="studio-grid">
        <aside className="col-mix pane-mix" aria-label="עריכת התמהילים">
          <h2 className="col-h">מה בכל תמהיל</h2>
          <MixTable A={A} B={B} onChange={set} />
          {best && bestR && (
            <div className="best tone tone-solution" data-info>
              <h4>התמהיל שמחזיק</h4>
              <Rich as="p">{`**${n0(bestR.units)}** דירות בתקציב${extra > 0 ? `, **${n0(extra)}** יותר מהתמהיל שמחזיק היום` : ''}. **${bestR.floors}** קומות, רווח **${pc(bestR.margin)}**.`}</Rich>
              <div className="best-mix">{(['r2', 'r3', 'r4', 'r5'] as const).map((t) => <span key={t}><b>{best.units[t]}</b>{UNITS[t].short}</span>)}</div>
              <button className="press btn primary" onClick={() => set({ [fixFor]: { ...best, key: fixFor, name: 'התמהיל שמחזיק' } })}>החלפת תמהיל {L(fixFor)} בזה</button>
            </div>
          )}
        </aside>

        <section className="col-focus" aria-label="המגדלים והכסף">
          <div className="pane-towers focus-box">
            <Towers c={c} a={a} lines={lines} />
            <div className="ins"><Rich as="p" className="ins-t">{ht.title}</Rich><Rich as="p" className="ins-s">{ht.sub}</Rich></div>
          </div>
          <div className="pane-money money-box">
            <MoneyBars c={c} a={a} />
            <div className="ins"><Rich as="p" className="ins-t">{cd.title}</Rich><Rich as="p" className="ins-s">{cd.sub}</Rich></div>
          </div>
        </section>

        <aside className="col-q pane-answer" aria-label="ארבע השאלות">
          <Q n="1" q="איזה תמהיל מחזיק תקציב?" tone={c.winner ? 'ok' : 'bad'}
            big={c.winner ? <span className="q-word">תמהיל {L(c.winner)}</span> : <span className="q-word bad">אף אחד</span>}
            ins={{ title: `א: ${vA.long}.`, sub: `ב: ${vB.long}.` }} />
          <Q n="2" q="כמה גבוה זה יוצא?" big={pair(n0(c.A.height), n0(c.B.height))} unit="מ'" ins={ht} />
          <Q n="3" q="מה זה דורש מהשכונה?" big={pair(n0(c.A.parking), n0(c.B.parking))} unit="חניות" ins={bt} />
          <Q n="4" q="כמה יציבה ההחלטה?" big={<bdi className="num">{c[c.winner ?? c.closer].priceDrop > 0 ? `−${pc(c[c.winner ?? c.closer].priceDrop)}` : pc(-c[c.winner ?? c.closer].priceDrop)}</bdi>} unit="במחיר הדירה" ins={st} />
        </aside>
      </div>

      <nav className="dock" aria-label="פעולות">
        <div className="dock-in">
          <span className="label">השוואות מוכנות</span>
          {PRESETS.map((p) => {
            const on = sumUnits(p.A) === sumUnits(A) && sumUnits(p.B) === sumUnits(B) && p.A.office === A.office && p.B.office === B.office && p.A.units.r2 === A.units.r2;
            return <button key={p.id} className="press chip" aria-pressed={on} title={p.hint} onClick={() => set({ A: p.A, B: p.B })}>{p.name}</button>;
          })}
          <span className="dock-gap" />
          <button className="press btn" onClick={() => set({ A: { ...B, key: 'A' }, B: { ...A, key: 'B' } })}>החלפת א ו-ב</button>
          <button className="press btn primary" onClick={ask} disabled={briefState === 'busy'}>{briefState === 'busy' ? 'מנסח…' : 'ניסוח ההחלטה'}</button>
        </div>
      </nav>

      {(brief || briefState === 'error') && (
        <div className="brief" role="dialog" aria-label="ניסוח ההחלטה">
          <div className="brief-in">
            <button className="press chip brief-x" onClick={() => { setBrief(null); setBriefState('idle'); }} aria-label="סגירה">סגירה</button>
            {briefState === 'error' && <p className="tone tone-problem">{briefErr}. המספרים במסך מחושבים במנוע ולא תלויים בניסוח.</p>}
            {brief && (
              <>
                <Rich as="h2" className="brief-h">{brief.headline.insight}</Rich>
                <Rich as="p" className="brief-s">{brief.headline.detail}</Rich>
                <div className="grid-2">
                  {brief.mixes.map((m) => (
                    <div key={m.key} className={`tone ${c[m.key]?.holds ? 'tone-solution' : 'tone-problem'}`}>
                      <h4>תמהיל {L(m.key)}</h4>
                      <Rich as="p" className="b-ins">{m.text.insight}</Rich>
                      <Rich as="p">{m.text.detail}</Rich>
                    </div>
                  ))}
                </div>
                <div className="tone tone-insight"><h4>המלצה</h4><Rich as="p" className="b-ins">{brief.recommendation.insight}</Rich><Rich as="p">{brief.recommendation.detail}</Rich></div>
                <ol className="brief-steps">{brief.steps.map((s, i) => <Rich as="li" key={i}>{s}</Rich>)}</ol>
                <p className="label">ניסוח: {brief.engine === 'gemini' ? 'Gemini' : 'Claude'} · המספרים מהמנוע · תקציב {mil(a.budget)} מיליון ₪</p>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
