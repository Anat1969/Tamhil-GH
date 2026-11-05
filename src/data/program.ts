// תקני הפרוגרמה, כפי שהם במחשבון הפרוגרמות (Lovable, "יועץ פרוגרמות", src/pages/Index.tsx ו-DeveloperObligation.tsx).
// https://pixel-perfect-clone-6624.lovable.app
// המספרים והמקורות מועתקים כמות שהם. תיקון נעשה במקור, ומועתק לכאן.

export interface City { id: string; name: string; coefficient: number }

// מקדם נפש ליחידת דיור, הלמ"ס 2023 (כפי שמופיע במחשבון).
export const CITIES: City[] = [
  { id: 'ashdod', name: 'אשדוד', coefficient: 3.5 },
  { id: 'tlv', name: 'תל אביב-יפו', coefficient: 2.5 },
  { id: 'jerusalem', name: 'ירושלים', coefficient: 3.4 },
  { id: 'haifa', name: 'חיפה', coefficient: 2.8 },
  { id: 'rishon', name: 'ראשון לציון', coefficient: 3.0 },
  { id: 'petah_tikva', name: 'פתח תקווה', coefficient: 3.0 },
  { id: 'netanya', name: 'נתניה', coefficient: 3.0 },
  { id: 'beersheba', name: 'באר שבע', coefficient: 3.2 },
  { id: 'holon', name: 'חולון', coefficient: 2.9 },
  { id: 'bnei_brak', name: 'בני ברק', coefficient: 4.2 },
  { id: 'ramat_gan', name: 'רמת גן', coefficient: 2.7 },
];

export interface ProgramRow { id: string; label: string; area: number; built: boolean; detail: string; source: string }
export interface Program {
  residents: number;
  rows: ProgramRow[];
  builtPublic: number;   // מ"ר מבונה שהיזם בונה ומוסר (חינוך לגיל הרך, מוסדות, מקלט)
  openSpace: number;     // מ"ר שטח פתוח שהשכונה צריכה
  parkingResidents: number;
  parkingVisitors: number;
}

const r = Math.round;

// אותן נוסחאות כמו calculate() במחשבון. כאן הן מקבלות את מספר התושבים מהתמהיל, ולא מכפל אחיד.
export function program(units: number, residents: number): Program {
  const daycareKids = r(residents * 0.025);
  const kinderKids = r(residents * 0.03);
  const daycare = r(daycareKids * 8);
  const kinder = r(kinderKids * 8);
  const shelter = r(residents / 10);
  const synagogues = Math.max(1, Math.ceil(residents / 2000));
  const synagogue = r(synagogues * Math.max(150, (residents * 0.05) / synagogues));
  const comm = residents >= 1000 ? r(Math.max(500, residents * 0.1)) : 0;
  const clinic = residents >= 2000 ? r(Math.max(300, residents * 0.05)) : 0;
  const lib = residents >= 3000 ? r(Math.max(200, residents * 0.04)) : 0;
  const garden = r(residents * 4);
  const park = r(residents * 7);
  const sport = r(residents * 3);
  const rows: ProgramRow[] = [
    { id: 'daycare', label: 'מעון יום', area: daycare, built: true, detail: `2.5% מהתושבים, 8 מ"ר לילד`, source: 'משרד החינוך' },
    { id: 'kinder', label: 'גן ילדים', area: kinder, built: true, detail: `3% מהתושבים, 8 מ"ר לילד`, source: 'משרד החינוך' },
    { id: 'shelter', label: 'מרחב מוגן ציבורי', area: shelter, built: true, detail: `1 מ"ר לכל 10 נפש`, source: 'פיקוד העורף' },
    { id: 'synagogue', label: 'בית כנסת', area: synagogue, built: true, detail: `1 לכל 2,000 נפש, מינימום 150 מ"ר`, source: 'משרד הפנים' },
    { id: 'comm', label: 'מרכז קהילתי', area: comm, built: true, detail: comm ? `0.1 מ"ר לנפש, מינימום 500` : `מתחת לסף 1,000 נפש`, source: 'משרד הפנים' },
    { id: 'clinic', label: 'מרפאה', area: clinic, built: true, detail: clinic ? `0.05 מ"ר לנפש, מינימום 300` : `מתחת לסף 2,000 נפש`, source: 'משרד הבריאות' },
    { id: 'lib', label: 'ספרייה', area: lib, built: true, detail: lib ? `0.04 מ"ר לנפש, מינימום 200` : `מתחת לסף 3,000 נפש`, source: 'משרד הפנים' },
    { id: 'open', label: 'שטח ציבורי פתוח', area: garden + park + sport, built: false, detail: `גינה 4, פארק 7, ספורט 3 מ"ר לנפש`, source: 'תמ"א 70' },
  ];
  return {
    residents,
    rows,
    builtPublic: rows.filter((x) => x.built).reduce((a, x) => a + x.area, 0),
    openSpace: garden + park + sport,
    parkingResidents: Math.ceil(units * 1.5),
    parkingVisitors: Math.ceil(units * 0.25),
  };
}
