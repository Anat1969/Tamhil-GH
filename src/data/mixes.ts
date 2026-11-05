// שני תמהילים לפתיחה: אותו מגרש ברוגוזין, אשדוד (Ashdod). דירות קטנות מול דירות משפחתיות.
import type { Mix } from '../lib/engine';

export const MIX_A: Mix = { key: 'A', name: 'דירות קטנות', units: { r2: 70, r3: 90, r4: 40, r5: 10 }, commercial: 1200, office: 0 };
export const MIX_B: Mix = { key: 'B', name: 'דירות משפחתיות', units: { r2: 10, r3: 40, r4: 70, r5: 30 }, commercial: 1200, office: 0 };

export interface Preset { id: string; name: string; hint: string; A: Mix; B: Mix }
export const PRESETS: Preset[] = [
  { id: 'size', name: 'קטנות מול משפחתיות', hint: 'אותו מגרש, גודל דירה שונה', A: MIX_A, B: MIX_B },
  { id: 'mixed', name: 'מגורים מול עירוב שימושים', hint: 'משרדים במקום שלוש קומות דירות', A: { ...MIX_B, key: 'A', name: 'מגורים בלבד' }, B: { key: 'B', name: 'עירוב שימושים', units: { r2: 10, r3: 35, r4: 60, r5: 25 }, commercial: 1800, office: 2400 } },
  { id: 'tall', name: 'מגדל גבוה מול מגדל בינוני', hint: 'יותר דירות, יותר קומות', A: { key: 'A', name: 'מגדל גבוה', units: { r2: 40, r3: 80, r4: 80, r5: 30 }, commercial: 1200, office: 0 }, B: { key: 'B', name: 'מגדל בינוני', units: { r2: 20, r3: 45, r4: 50, r5: 15 }, commercial: 1200, office: 0 } },
];
