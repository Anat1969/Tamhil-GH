// ניסוח ההחלטה: Gemini החינמי דרך פונקציית Edge, Claude רק כגיבוי. המפתחות לא מגיעים לדפדפן.
// תקן הזיקוק: https://github.com/Anat1969/Claude-GH/blob/main/docs/ai-text-standard.md
import type { Comparison, Result } from './engine';
import { cityOf } from './engine';
import type { Assumptions } from '../data/assumptions';

export const SUPABASE_URL = 'https://ktqmwpbzcnzkhjskqisy.supabase.co';
export const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0cW13cGJ6Y256a2hqc2txaXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxODM4OTgsImV4cCI6MjEwNTc1OTg5OH0.uPKn4hrLk16jhDoajMjPl4OmV5j1b3bMIECVmOdhWGI';
export const FN = `${SUPABASE_URL}/functions/v1/tamhil-brief`;

export interface Part { insight: string; detail: string }
export interface Brief { headline: Part; mixes: { key: 'A' | 'B'; text: Part }[]; recommendation: Part; steps: string[]; engine: 'gemini' | 'claude' }

const M = (n: number) => Math.round(n / 1e5) / 10;
const pack = (r: Result) => ({
  key: r.mix.key, letter: r.mix.key === 'A' ? 'א' : 'ב', name: r.mix.name,
  units: r.mix.units, totalUnits: r.units, commercialM2: r.mix.commercial, officeM2: r.mix.office,
  residents: r.residents, publicBuiltM2: r.program.builtPublic, openSpaceM2: r.program.openSpace, parking: r.parking,
  floors: r.floors, heightM: r.height, gfaM2: r.gfa,
  costMillion: M(r.cost.total), revenueMillion: M(r.revenue.total), parkingCostMillion: M(r.cost.parking),
  marginPct: Math.round(r.margin * 1000) / 10, holdsBudget: r.holdsBudget, holdsProfit: r.holdsProfit, overBudgetMillion: M(r.overBudget),
  priceDropPct: Math.round(r.priceDrop * 1000) / 10,
});

export function briefPayload(c: Comparison, a: Assumptions) {
  return {
    site: { city: cityOf(a.cityId).name, street: 'רוגוזין', siteM2: a.siteW * a.siteD, neighborsHeightM: 12 },
    rules: { budgetMillion: M(a.budget), profitMinPct: a.profitMin * 100 },
    winner: c.winner, flipAtPct: c.flipAt == null ? null : Math.round(c.flipAt * 1000) / 10,
    mixes: [pack(c.A), pack(c.B)],
  };
}

export async function requestBrief(c: Comparison, a: Assumptions, signal?: AbortSignal): Promise<Brief> {
  const r = await fetch(FN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
    body: JSON.stringify(briefPayload(c, a)),
    signal,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? `השרת החזיר ${r.status}`);
  return j as Brief;
}
