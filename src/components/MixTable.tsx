// עריכת התמהיל: שורה לכל סוג דירה, עמודה לכל תמהיל. כל שינוי מחשב מחדש את כל המסך.
import type { Mix } from '../lib/engine';
import { sumUnits } from '../lib/engine';
import { UNITS, UNIT_TYPES, type UnitType } from '../data/assumptions';
import { n0 } from '../lib/insights';

type Field = UnitType | 'commercial' | 'office';
const ROWS: { f: Field; label: string; sub: string; step: number }[] = [
  ...UNIT_TYPES.map((t) => ({ f: t as Field, label: UNITS[t].label, sub: `${UNITS[t].net} מ"ר`, step: 5 })),
  { f: 'commercial', label: 'מסחר', sub: 'מ"ר', step: 200 },
  { f: 'office', label: 'משרדים', sub: 'מ"ר', step: 200 },
];
const get = (m: Mix, f: Field) => (f === 'commercial' ? m.commercial : f === 'office' ? m.office : m.units[f]);
const put = (m: Mix, f: Field, v: number): Mix => {
  const x = Math.max(0, Math.min(f === 'commercial' || f === 'office' ? 20000 : 400, Math.round(v)));
  if (f === 'commercial') return { ...m, commercial: x };
  if (f === 'office') return { ...m, office: x };
  return { ...m, units: { ...m.units, [f]: x } };
};

export default function MixTable({ A, B, onChange }: { A: Mix; B: Mix; onChange: (p: { A?: Mix; B?: Mix }) => void }) {
  const cell = (m: Mix, r: (typeof ROWS)[number]) => {
    const v = get(m, r.f);
    const set = (nv: number) => onChange({ [m.key]: put(m, r.f, nv) });
    return (
      <td className="stepper">
        <button className="press st" aria-label={`פחות ${r.label}, תמהיל ${m.key === 'A' ? 'א' : 'ב'}`} onClick={() => set(v - r.step)}>−</button>
        <input className="st-in num" inputMode="numeric" aria-label={`${r.label}, תמהיל ${m.key === 'A' ? 'א' : 'ב'}`} value={v} onChange={(e) => set(Number(e.target.value.replace(/\D/g, '')) || 0)} />
        <button className="press st" aria-label={`יותר ${r.label}, תמהיל ${m.key === 'A' ? 'א' : 'ב'}`} onClick={() => set(v + r.step)}>+</button>
      </td>
    );
  };
  return (
    <table className="mix">
      <thead>
        <tr><th /><th><b>תמהיל א</b><small>{A.name}</small></th><th><b>תמהיל ב</b><small>{B.name}</small></th></tr>
      </thead>
      <tbody>
        {ROWS.map((r) => (
          <tr key={r.f} className={r.f === 'commercial' ? 'sep' : ''}>
            <th scope="row">{r.label}<small>{r.sub}</small></th>
            {cell(A, r)}
            {cell(B, r)}
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr><th scope="row">דירות</th><td><bdi className="num">{n0(sumUnits(A))}</bdi></td><td><bdi className="num">{n0(sumUnits(B))}</bdi></td></tr>
      </tfoot>
    </table>
  );
}
