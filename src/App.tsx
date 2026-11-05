import { useEffect, useMemo, useState } from 'react';
import AIMenu, { type MenuItem } from './components/AIMenu';
import { go, useRoute } from './lib/route';
import Home from './pages/Home';
import Studio from './pages/Studio';
import Method from './pages/Method';

const NAV: [string, string][] = [['/', 'בית'], ['/compare', 'השוואה'], ['/method', 'שיטה']];
interface BIPEvent extends Event { prompt: () => Promise<void> }

export default function App() {
  const { path } = useRoute();
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
          <AIMenu items={items} status="" />
        </div>
      </header>
      {page}
    </div>
  );
}
