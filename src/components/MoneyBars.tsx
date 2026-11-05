// הכסף, בהשראת מאזן הסחר של פלייפייר (1786): עלות מול הכנסה על סקאלה אחת, וקו התקציב חותך את שתיהן.
import type { Comparison, MixKey, Result } from '../lib/engine';
import { L, mil } from '../lib/insights';
import type { Assumptions } from '../data/assumptions';

const PARTS: { id: string; label: string; v: (r: Result) => number }[] = [
  { id: 'land', label: 'קרקע', v: (r) => r.cost.land },
  { id: 'hard', label: 'בנייה', v: (r) => r.cost.hard },
  { id: 'park', label: 'חניה', v: (r) => r.cost.parking },
  { id: 'soft', label: 'רכות ומימון', v: (r) => r.cost.soft + r.cost.finance },
];

export default function MoneyBars({ c, a }: { c: Comparison; a: Assumptions }) {
  const max = Math.max(c.A.revenue.total, c.B.revenue.total, c.A.cost.total, c.B.cost.total, a.budget) * 1.04;
  const pct = (v: number) => `${(v / max) * 100}%`;
  const row = (k: MixKey) => {
    const r = c[k];
    let acc = 0;
    return (
      <div className="mb-row" key={k}>
        <div className="mb-k"><b>{L(k)}</b></div>
        <div className="mb-track">
          <div className="mb-budget" style={{ insetInlineStart: pct(a.budget) }}>{k === 'A' && <span>תקציב <bdi className="num">{mil(a.budget)}</bdi></span>}</div>
          <div className="mb-bar cost" aria-label={`עלות ${mil(r.cost.total)} מיליון`}>
            {PARTS.map((p) => {
              const v = p.v(r), left = acc; acc += v;
              return <span key={p.id} className={`seg s-${p.id}`} style={{ insetInlineStart: pct(left), width: pct(v) }} title={`${p.label}: ${mil(v)} מיליון ₪`}>{v / max > 0.09 ? p.label : ''}</span>;
            })}
            <span className="mb-val" style={{ insetInlineStart: `calc(${pct(r.cost.total)} + 6px)` }}><bdi className="num">{mil(r.cost.total)}</bdi></span>
          </div>
          <div className={`mb-bar rev ${r.holdsProfit ? 'ok' : 'bad'}`} aria-label={`הכנסה ${mil(r.revenue.total)} מיליון`}>
            <span className="seg s-rev" style={{ width: pct(r.revenue.total) }} />
            <span className="tick" style={{ insetInlineStart: pct(r.cost.total * (1 + a.profitMin)) }} title={`רף רווח ${a.profitMin * 100}%`} />
            <span className="mb-val" style={{ insetInlineStart: `calc(${pct(r.revenue.total)} + 6px)` }}><bdi className="num">{mil(r.revenue.total)}</bdi></span>
          </div>
        </div>
      </div>
    );
  };
  return (
    <figure className="money" aria-label="עלות מול הכנסה, במיליוני ₪">
      <div className="mb-plot">
        {row('A')}
        {row('B')}
      </div>
      <figcaption className="mb-legend">
        <span><i className="sw s-cost" />עלות</span>
        <span><i className="sw s-rev" />הכנסה</span>
        <span><i className="sw tick-sw" />רף רווח {a.profitMin * 100}%</span>
        <span className="label">מיליוני ₪</span>
      </figcaption>
    </figure>
  );
}
