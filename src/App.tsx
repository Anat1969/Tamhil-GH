import { useEffect, useMemo, useState } from 'react';
import AIMenu, { type MenuItem } from './components/AIMenu';
import { go, useRoute } from './lib/route';
import Home from './pages/Home';
import Studio from './pages/Studio';
import Method from './pages/Method';
import Chain from './components/Chain';
import { useStudio } from './lib/state';
import { programaLink, skyFor } from './lib/links';
import Strip from './components/Strip';
import { encodeDossier, stepUrl, newDossier, type Dossier } from './lib/dossier';
import { setParams } from './lib/route';

const n = (x: number) => Math.round(x).toLocaleString('he-IL');
const NAV: [string, string][] = [['/', 'בית'], ['/compare', 'השוואה'], ['/method', 'שיטה']];
interface BIPEvent extends Event { prompt: () => Promise<void> }

export default function App() {
  const { path } = useRoute();
  // השרשרת בסרגל העליון, בכל דף: חזרה לפרוגרמה עם התמהיל שמחזיק, והמשך למגדל שלו
  const { cmp: c, a, dossier: d0 } = useStudio();
  const lk = c.winner ?? c.closer;
  const lead = c[lk];
  const L = (k: string) => (k === 'A' ? 'א' : 'ב');
  const sky = skyFor(lead, a, `תמהיל ${L(lk)} · ${lead.mix.name}`);
  // תיק הפרויקט: התמהיל מוסיף את התוצאה שלו, ומעביר לפרוגרמה (כאחוזים) ולמגדל
  const u = lead.mix.units, tu = u.r2 + u.r3 + u.r4 + u.r5 || 1;
  const pcts = [u.r2, u.r3, u.r4, u.r5].map((x) => Math.round((x / tu) * 100));
  const d: Dossier | null = d0 && { ...d0, mix: { winner: `תמהיל ${L(lk)}, ${lead.mix.name}`, units: lead.units, holds: lead.holds, marginPct: Math.round(lead.margin * 1000) / 10, overM: Math.round(lead.overBudget / 1e6), floors: lead.floors, height: Math.round(lead.height), counts: [u.r2, u.r3, u.r4, u.r5] } };
  const chainLinks = d
    ? { taba: stepUrl('taba', d), program: stepUrl('program', d, { m: pcts.join('.') }), tower: sky }
    : { taba: stepUrl('taba', newDossier('city')), program: programaLink(lead.mix, a.cityId), tower: sky };
  const setRole = (r: Dossier['role']) => d && setParams({ d: encodeDossier({ ...d, role: r }) });
  const tabaFloors = d?.lot.floors ?? 0;
  const strip = d && (
    <Strip d={d} here="mix" onRole={setRole}
      came={[
        { k: 'בתב"ע', v: `מגרש **${n(d.lot.areaM2)}** מ"ר · **${n(d.lot.units)}** יח"ד · עד **${d.lot.floors}** קומות` },
        ...(d.prog ? [{ k: 'מהפרוגרמה', v: `ציבור נדרש **${n(d.prog.pubM2)}** מ"ר · העמדה ${d.prog.alt} **${d.prog.score}**` }] : []),
        { k: 'תקציב', v: `**${n(a.budget / 1e6)}** מיליון ₪ (13,800 למ"ר זכויות, הנחה)` },
      ]}
      found={[
        { k: 'מחזיק תקציב', v: c.winner ? `**תמהיל ${L(c.winner)}**, רווח **${(c[c.winner].margin * 100).toFixed(1)}%**` : '**אף אחד**', tone: c.winner ? 'ok' : 'bad' },
        // גובה מול התב"ע: קומות פודיום וגוף, בלי 3 קומות הכתר הטכני. שטח מגורים ברוטו מול זכויות המגורים בטבלה 5.
        ...(['A', 'B'] as const).map((k) => {
          const fl = c[k].podiumFloors + c[k].bodyFloors, over = fl > tabaFloors, overRes = c[k].grossRes > d.lot.res * 1.001;
          return { k: `תמהיל ${L(k)} מול התב"ע`, v: `${over ? `**${fl}** קומות, חורג ב-**${fl - tabaFloors}**` : `**${fl}** מתוך **${tabaFloors}** קומות`}${overRes ? ` · מגורים **${n(c[k].grossRes)}** מ"ר, מעל הזכויות` : ''}`, tone: (over || overRes ? 'bad' : 'ok') as 'bad' | 'ok' };
        }),
      ]} />
  );
  const [install, setInstall] = useState<BIPEvent | null>(null);
  useEffect(() => {
    const on = (e: Event) => { e.preventDefault(); setInstall(e as BIPEvent); };
    addEventListener('beforeinstallprompt', on);
    return () => removeEventListener('beforeinstallprompt', on);
  }, []);
  const items = useMemo<MenuItem[]>(() => [
    { label: 'מקור: מחשבון פרוגרמות', hint: 'תקני הפרוגרמה', onSelect: () => open('https://pixel-perfect-clone-6624.lovable.app', '_blank') },
    { label: 'מקור: גורד שחקים', hint: 'מנוע המגדל', onSelect: () => open('https://anat1969.github.io/SkySkiper-GH/', '_blank') },
    { label: 'הדפסת ההשוואה', hint: 'A4 או PDF', onSelect: () => { if (!location.hash.startsWith('#/compare')) go('/compare'); setTimeout(() => print(), 300); } },
    ...(install ? [{ label: 'התקנת האפליקציה', onSelect: () => install.prompt() }] : []),
    { label: 'איפוס התמהילים', hint: 'חזרה להשוואה הראשונה', onSelect: () => { try { localStorage.removeItem('tamhil:v1'); } catch { /* */ } location.hash = '#/compare'; location.reload(); } },
  ], [install]);
  const studio = path.startsWith('/compare');
  const page = studio ? <Studio /> : path.startsWith('/method') ? <Method /> : <Home />;
  return (
    <div className={studio ? 'app-shell studio-shell' : 'app-shell'}>
      <header className="topbar">
        <div className="topbar-in">
          <a className="brand" href="#/" aria-label="איזה תמהיל עדיף, לדף הבית">
            <img src="/icon.svg" alt="" width={26} height={26} />
            <span>איזה תמהיל עדיף</span>
          </a>
          <nav className="tabs" aria-label="ניווט">
            {NAV.map(([p, l]) => (
              <button key={p} className="tab" aria-current={(p === '/' ? path === '/' : path.startsWith(p)) ? 'page' : undefined} onClick={() => go(p, p === '/compare' ? Object.fromEntries(new URLSearchParams(location.hash.split('?')[1] ?? '')) : undefined)}>{l}</button>
            ))}
          </nav>
          <Chain role={d?.role ?? 'city'} current="mix" links={chainLinks} />
          <AIMenu items={items} status="" />
        </div>
        {strip}
      </header>
      {page}
    </div>
  );
}
