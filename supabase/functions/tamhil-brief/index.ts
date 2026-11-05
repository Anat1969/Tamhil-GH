// Tamhil-GH: "איזה תמהיל עדיף". מנסח החלטה מתוך תוצאות המנוע בלבד.
// Gemini החינמי (GEMINI_API_KEY) קודם, Claude (ANTHROPIC_API_KEY) רק כגיבוי. פלט JSON מובנה, מגבלת קצב.
// כל טקסט לפי תקן הזיקוק: https://github.com/Anat1969/Claude-GH/blob/main/docs/ai-text-standard.md
import Anthropic from 'npm:@anthropic-ai/sdk';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

// מגבלת קצב: 8 בקשות בדקה לכל כתובת.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 60000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 8;
}

const SYSTEM = `את/ה אדריכל/ית ושמאי/ת בכיר/ה שמכין/ה המלצה קצרה ליזם ולוועדה בעיריית אשדוד (Ashdod).
קיבלת שני תמהילי שטחים לאותו מגרש ברחוב רוגוזין. כל תמהיל כבר חושב במנוע: תושבים ופרוגרמה ציבורית לפי מחשבון הפרוגרמות, קומות וגובה לפי מנוע גורד שחקים, ועלות מול הכנסה.
המשימה: לזקק מה החישוב אומר ולהמליץ איזה תמהיל להביא. לא לחשב מחדש ולא לשנות מספר.

זקק, אל תתאר. עברית טבעית, קצרה ומקצועית, בגוף שלישי. בלי סימני קריאה, בלי אימוג'י, בלי מילים ריקות.
מבנה קבוע לכל טקסט, בהיררכיה:
1. insight: שורת תובנה עד 8 מילים, כמו כותרת שמבטאת את העיקר. מסתיימת בנקודה.
2. detail: משפט הסבר אחד, עד 20 מילים, שמפרט את התובנה.
הבלטות ב-**כוכביות כפולות**: בשורת התובנה המושג המרכזי בלבד. במשפט ההסבר 2 עד 3 הבלטות, לפרמטרים, מספרים ומושגי מפתח. לא מבליטים מילות קישור ולא משפט שלם.

השדות:
- headline: איזה תמהיל מחזיק תקציב, בשורה אחת.
- mixes: לכל תמהיל key (A או B) ו-text: מה מחזיק אותו ומה מפיל אותו (חניה, ציבור מבונה, גובה, רווח).
- recommendation: איזה תמהיל להביא, ובאיזה תנאי (מחיר, חניה או תקציב).
- steps: בדיוק 3 צעדים לפני ההחלטה, כל אחד עד 12 מילים, עם הבלטה אחת.
עובדות: רק מה שמופיע בנתונים. לא ממציאים מספרים, תקנות, שמות או מחירים.
דיוק:
- תמהיל "מחזיק תקציב" רק כש-holdsBudget ו-holdsProfit שניהם true.
- מספרים תמיד בספרות (340, 22.6%, 153 מ'), לעולם לא במילים. סכומים במיליוני ₪ כפי שהם בנתונים.
- תמהילים בשמם העברי: "תמהיל א" (A), "תמהיל ב" (B). לא אותיות לטיניות.
- priceDropPct הוא כמה ירידה במחיר המגורים התמהיל סופג לפני שהרווח יורד מתחת לרף. שלילי פירושו שצריך עלייה במחיר.`;

const PART = { type: 'object', additionalProperties: false, required: ['insight', 'detail'], properties: { insight: { type: 'string' }, detail: { type: 'string' } } };
const SCHEMA = {
  type: 'object', additionalProperties: false, required: ['headline', 'mixes', 'recommendation', 'steps'],
  properties: {
    headline: PART,
    mixes: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['key', 'text'], properties: { key: { type: 'string', enum: ['A', 'B'] }, text: PART } } },
    recommendation: PART,
    steps: { type: 'array', items: { type: 'string' } },
  },
};
const G_PART = { type: 'OBJECT', required: ['insight', 'detail'], properties: { insight: { type: 'STRING' }, detail: { type: 'STRING' } } };
const G_SCHEMA = {
  type: 'OBJECT', required: ['headline', 'mixes', 'recommendation', 'steps'],
  properties: {
    headline: G_PART,
    mixes: { type: 'ARRAY', items: { type: 'OBJECT', required: ['key', 'text'], properties: { key: { type: 'STRING', enum: ['A', 'B'] }, text: G_PART } } },
    recommendation: G_PART,
    steps: { type: 'ARRAY', items: { type: 'STRING' } },
  },
};

const GEMINI_MODELS = [...new Set([Deno.env.get('GEMINI_MODEL') ?? 'gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'])];

async function viaGemini(key: string, user: string) {
  let last: unknown;
  for (const model of GEMINI_MODELS) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: { responseMimeType: 'application/json', responseSchema: G_SCHEMA, temperature: 0.3 },
        }),
        signal: AbortSignal.timeout(25000),
      });
      if (!r.ok) throw Object.assign(new Error(`Gemini ${model} ${r.status}`), { status: r.status });
      const j = await r.json();
      const text = j?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
      return JSON.parse(text);
    } catch (err) {
      last = err;
      const st = (err as { status?: number }).status;
      if (st === 400 || st === 401 || st === 403) break;
    }
  }
  throw last;
}

async function viaClaude(key: string, user: string) {
  const client = new Anthropic({ apiKey: key });
  const response = await client.beta.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 3000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: SYSTEM,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    messages: [{ role: 'user', content: user }],
  } as never);
  if (response.stop_reason === 'refusal') throw new Error('הבקשה נדחתה');
  const text = response.content.filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('');
  return JSON.parse(text);
}

const clip = (s: unknown, n: number) => String(s ?? '').slice(0, n);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'POST בלבד' }, 405);
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anon';
  if (limited(ip)) return json({ error: 'יותר מדי בקשות. נסו שוב בעוד דקה.' }, 429);

  let body: { site?: unknown; rules?: unknown; winner?: unknown; flipAtPct?: unknown; mixes?: unknown[] };
  try { body = await req.json(); } catch { return json({ error: 'גוף הבקשה אינו JSON' }, 400); }
  const mixes = (Array.isArray(body.mixes) ? body.mixes : []).slice(0, 2);
  if (mixes.length < 2) return json({ error: 'צריך שני תמהילים לניסוח' }, 400);
  const user = `מגרש: ${clip(JSON.stringify(body.site ?? {}), 400)}\nכללים: ${clip(JSON.stringify(body.rules ?? {}), 200)}\nהמנצח לפי המנוע: ${clip(body.winner ?? 'אין', 4)}\nנקודת היפוך במחיר (%): ${clip(body.flipAtPct ?? 'אין', 12)}\n\nהתמהילים (JSON):\n${clip(JSON.stringify(mixes), 8000)}`;

  const gk = Deno.env.get('GEMINI_API_KEY');
  const ak = Deno.env.get('ANTHROPIC_API_KEY');
  const errors: string[] = [];
  if (gk) {
    try { return json({ ...(await viaGemini(gk, user)), engine: 'gemini' }); } catch (e) { errors.push(String((e as Error).message ?? e)); }
  }
  if (ak) {
    try { return json({ ...(await viaClaude(ak, user)), engine: 'claude' }); } catch (e) { errors.push(String((e as Error).message ?? e)); }
  }
  return json({ error: `אין מנוע זמין כרגע (${errors.join('; ') || 'חסר מפתח'})` }, 503);
});
