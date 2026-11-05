import { describe, it, expect } from 'vitest';
import { evaluate, fastTotals, compare, bestMix } from '../src/lib/engine';
import { DEFAULTS } from '../src/data/assumptions';
import { MIX_A, MIX_B, PRESETS } from '../src/data/mixes';

const show = (r: ReturnType<typeof evaluate>) => ({ units: r.units, res: r.residents, pub: r.program.builtPublic, pf: r.podiumFloors, bf: r.bodyFloors, floors: r.floors, h: r.height, gfa: r.gfa, park: r.parking, cost: Math.round(r.cost.total / 1e6), rev: Math.round(r.revenue.total / 1e6), margin: +(r.margin * 100).toFixed(1), holds: r.holds, drop: +(r.priceDrop * 100).toFixed(1) });

describe('engine', () => {
  it('prints presets', () => {
    for (const p of PRESETS) { const c = compare(p.A, p.B, DEFAULTS); console.log(p.id, c.winner, c.flipAt, JSON.stringify(show(c.A)), JSON.stringify(show(c.B))); }
  });
  it('fast path equals the SkySkiper geometry', () => {
    for (const m of [MIX_A, MIX_B, ...PRESETS.flatMap((p) => [p.A, p.B])]) {
      const r = evaluate(m, DEFAULTS), f = fastTotals(m, DEFAULTS);
      expect(Math.abs(f.gfa - r.gfa) / r.gfa).toBeLessThan(0.01);
      expect(f.floors).toBe(r.floors);
      expect(f.holds).toBe(r.holds);
    }
  });
  it('best mix holds in the full engine', () => {
    const b = bestMix(MIX_A, DEFAULTS);
    console.log('best', JSON.stringify(b?.units), b && JSON.stringify(show(evaluate(b, DEFAULTS))));
    if (b) expect(evaluate(b, DEFAULTS).holds).toBe(true);
  });
});

import { budgetHeight } from '../src/lib/engine';
describe('budget line', () => {
  it('sits below the tower that breaks the budget and above the one that holds', () => {
    const a = evaluate(MIX_A, DEFAULTS), b = evaluate(MIX_B, DEFAULTS);
    const ha = budgetHeight(MIX_A, DEFAULTS)!, hb = budgetHeight(MIX_B, DEFAULTS)!;
    console.log('budget line', ha, a.height, hb, b.height);
    expect(a.holdsBudget).toBe(false);
    expect(ha).toBeLessThan(a.height);
    expect(hb).toBeGreaterThanOrEqual(b.height);
  });
  it('height from fast path matches geometry', () => {
    for (const m of [MIX_A, MIX_B]) expect(Math.abs(fastTotals(m, DEFAULTS).height - evaluate(m, DEFAULTS).height)).toBeLessThan(0.2);
  });
});
