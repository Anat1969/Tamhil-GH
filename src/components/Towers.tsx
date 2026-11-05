// המוקד: שני מגדלים בחתך חזיתי, באותו קנה מידה, מול הבניינים של רוגוזין. קו התקציב חותך כל מגדל בגובה שבו הכסף נגמר.
import { useMemo, useState } from 'react';
import type { Comparison, Result, MixKey } from '../lib/engine';
import { NEIGHBOR_HEIGHT } from '../lib/engine';
import { L, n0, verdictText } from '../lib/insights';
import type { Assumptions } from '../data/assumptions';

export type Use = 'res' | 'com' | 'off' | 'pub' | 'mech';
export const USES: { id: Use; label: string }[] = [
  { id: 'res', label: 'מגורים' },
  { id: 'com', label: 'מסחר' },
  { id: 'off', label: 'משרדים' },
  { id: 'pub', label: 'ציבור' },
  { id: 'mech', label: 'טכני' },
];

interface Floor { y0: number; y1: number; x0: number; x1: number; use: Use; i: number }

// קומות הפודיום מתחלקות לפי השטח: מסחר בקרקע, משרדים מעליו, ציבור למעלה.
function podiumUses(r: Result): Use[] {
  const plate = r.podiumArea / r.podiumFloors || 1;
  const order: [Use, number][] = [['com', r.mix.commercial], ['off', r.mix.office], ['pub', r.program.builtPublic]];
  const out: Use[] = [];
  for (let f = 0; f < r.podiumFloors; f++) {
    const mid = (f + 0.5) * plate;
    let cum = 0, use: Use = 'pub';
    for (const [u, area] of order) { cum += area; if (mid <= cum) { use = u; break; } }
    out.push(use);
  }
  return out;
}

function floorsOf(r: Result, cx: number, s: number, ground: number): Floor[] {
  const pod = podiumUses(r);
  return r.slabs.filter((sl) => sl.kind !== 'void').map((sl, i) => {
    const xs = sl.points.map((p) => p[0]);
    const use: Use = sl.mass === 'base' ? pod[sl.floor] ?? 'pub' : sl.mass === 'crown' ? 'mech' : 'res';
    return { y0: ground - sl.z1 * s, y1: ground - sl.z0 * s, x0: cx + Math.min(...xs) * s, x1: cx + Math.max(...xs) * s, use, i };
  });
}

const VW = 1000, VH = 620;

export default function Towers({ c, a, lines, compact = false }: { c: Comparison; a: Assumptions; lines: Record<MixKey, number | null>; compact?: boolean }) {
  const [focus, setFocus] = useState<Use | null>(null);
  const maxH = Math.max(c.A.height, c.B.height, ...(Object.values(lines).filter((x) => x != null && x < Math.max(c.A.height, c.B.height) * 1.25) as number[]), 40);
  const s = Math.min((VH - 120) / maxH, VW / 300);
  const ground = VH - 34;
  const span = 300 * s;
  const x0 = (VW - span) / 2;
  // קריאה מימין לשמאל: תמהיל א מימין
  const cxA = x0 + 205 * s, cxB = x0 + 95 * s;
  const fA = useMemo(() => floorsOf(c.A, cxA, s, ground), [c.A, cxA, s, ground]);
  const fB = useMemo(() => floorsOf(c.B, cxB, s, ground), [c.B, cxB, s, ground]);
  const key = `${c.A.floors}-${c.B.floors}-${c.A.podiumFloors}-${c.B.podiumFloors}`;
  const nb = NEIGHBOR_HEIGHT * s;

  const tower = (r: Result, k: MixKey, cx: number, floors: Floor[]) => {
    const top = ground - r.height * s;
    const v = verdictText(r, a);
    const line = lines[k];
    const ly = line != null ? ground - line * s : null;
    const half = (a.podiumW / 2) * s;
    const labTop = Math.min(top, ly != null && ly > 20 ? ly - 4 : top);
    const out = k === 'A' ? 1 : -1; // הצד החיצוני: ימין לא, שמאל לב
    return (
      <g key={k} className={`tw tw-${k}`}>
        {floors.map((f) => (
          <rect key={f.i} className={`fl u-${f.use}${focus && focus !== f.use ? ' dim' : ''}`} x={f.x0} y={f.y0 + 0.4} width={f.x1 - f.x0} height={Math.max(0.6, f.y1 - f.y0 - 0.8)}
            style={{ animationDelay: `${Math.min(f.i * 14, 900)}ms` }} />
        ))}
        {ly != null && ly > top && (
          <rect className="over" x={cx - half} y={top} width={half * 2} height={ly - top} fill="url(#hatch)" />
        )}
        {ly != null && ly > 20 && (
          <g className="budget-line">
            <line x1={cx - half - 14} x2={cx + half + 14} y1={ly} y2={ly} />
            <text direction="rtl" x={out > 0 ? cx + half + 18 : cx - half - 18} y={ly - 6} textAnchor={out > 0 ? 'end' : 'start'} className="bl-t">קו התקציב</text>
            <text direction="rtl" x={out > 0 ? cx + half + 18 : cx - half - 18} y={ly + 14} textAnchor={out > 0 ? 'end' : 'start'} className="bl-t">{n0(line!)} מ׳</text>
          </g>
        )}
        {/* מידה, בצד הפנימי */}
        <g className="dim-line">
          <line x1={cx - out * (half + 10)} x2={cx - out * (half + 10)} y1={top} y2={ground} />
          <line x1={cx - out * (half + 5)} x2={cx - out * (half + 15)} y1={top} y2={top} />
          <text direction="rtl" x={cx - out * (half + 16)} y={top + (ground - top) / 2} textAnchor={out > 0 ? 'start' : 'end'} className="dim-t">{n0(r.height)} מ׳</text>
          <text direction="rtl" x={cx - out * (half + 16)} y={top + (ground - top) / 2 + 18} textAnchor={out > 0 ? 'start' : 'end'} className="dim-s">{r.floors} קומות</text>
        </g>
        <text direction="rtl" x={cx} y={Math.max(18, labTop - 28)} textAnchor="middle" className="tw-name">תמהיל {L(k)}</text>
        <text direction="rtl" x={cx} y={Math.max(34, labTop - 10)} textAnchor="middle" className={`tw-v ${v.tone}`}>{v.short}</text>
      </g>
    );
  };

  return (
    <figure className={`towers${compact ? ' compact' : ''}`} aria-label="שני המגדלים בחתך, באותו קנה מידה">
      <svg viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMax meet" key={key} direction="ltr">
        <defs>
          <pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="7" stroke="var(--breach)" strokeWidth="1.6" opacity=".55" />
          </pattern>
        </defs>
        {/* רוגוזין: הבניינים סביב המגרש, 12 מ' */}
        {[x0 - 4 * s, x0 + 140 * s, x0 + 262 * s].map((x, i) => (
          <rect key={i} className="nb" x={x} y={ground - nb} width={i === 1 ? 20 * s : 40 * s} height={nb} />
        ))}
        <text direction="rtl" x={x0 + 150 * s} y={ground - nb - 6} textAnchor="middle" className="nb-t">רוגוזין 12 מ׳</text>
        {tower(c.A, 'A', cxA, fA)}
        {tower(c.B, 'B', cxB, fB)}
        <line x1={0} x2={VW} y1={ground} y2={ground} className="ground" />
        {/* קנה מידה */}
        <g className="scale">
          <line x1={VW - 20 - 50 * s} x2={VW - 20} y1={ground + 18} y2={ground + 18} />
          <text direction="rtl" x={VW - 20 - 25 * s} y={ground + 30} textAnchor="middle">50 מ׳</text>
        </g>
      </svg>
      <figcaption className="legend" aria-label="מקרא שימושים">
        {USES.map((u) => (
          <button key={u.id} className={`lg press chip${focus === u.id ? ' is-on' : ''}`} onMouseEnter={() => setFocus(u.id)} onMouseLeave={() => setFocus(null)} onFocus={() => setFocus(u.id)} onBlur={() => setFocus(null)} aria-pressed={focus === u.id}>
            <i className={`sw u-${u.id}`} />{u.label}
          </button>
        ))}
        <span className="lg-note"><i className="sw hatch" />מעל קו התקציב</span>
      </figcaption>
    </figure>
  );
}
