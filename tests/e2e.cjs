// בדיקת קצה לקצה: npm run build && node tests/e2e.cjs
// vite preview, ai-menu מעותק מקומי (הסביבה לא מגיעה ל-vercel.app), ופונקציית ה-Edge מדומה.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const PORT = 4379;
const BASE = `http://localhost:${PORT}/`;
const MENU = fs.readFileSync(__dirname + '/ai-menu.local.js', 'utf8');
const fails = [];
const ok = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) fails.push(msg); };
const BRIEF = {
  headline: { insight: 'תמהיל ב **מחזיק תקציב**.', detail: 'תמהיל א חורג ב-**29.3** מיליון ₪.' },
  mixes: [{ key: 'A', text: { insight: 'רווח טוב, **חריגה** בתקציב.', detail: 'רווח **25.1%**.' } }, { key: 'B', text: { insight: 'עומד **בתקציב** וברווח.', detail: '**150** דירות.' } }],
  recommendation: { insight: 'להביא את **תמהיל ב**.', detail: 'עומד ב-**340** מיליון ₪.' },
  steps: ['לבדוק **חניה**', 'לאמת **פרוגרמה**', 'לאשר **תקציב**'],
  engine: 'gemini',
};

(async () => {
  const srv = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.route('**/appofapp-gh.vercel.app/ai-menu.js', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: MENU }));
    await p.route('**/fonts.googleapis.com/**', (r) => r.abort());
    const calls = [];
    let mode = 'ok';
    await p.route('**/functions/v1/tamhil-brief', async (r) => {
      calls.push(JSON.parse(r.request().postData() || '{}'));
      if (mode === 'ok') await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(BRIEF) });
      else await r.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'אין מנוע זמין כרגע' }) });
    });

    // בית
    await p.goto(BASE, { waitUntil: 'networkidle' });
    const h1 = await p.locator('h1').innerText();
    ok(/40/.test(h1) && /יותר/.test(h1), 'בית: התובנה המחושבת היא 40 דירות יותר (' + h1.replace(/\s+/g, ' ') + ')');
    ok(await p.locator('.home-tones .tone').count() === 3, 'בית: בעיה, פתרון, תובנה');
    ok(await p.locator('.home .towers .fl').count() > 60, 'בית: שני המגדלים בחתך, קומה אחר קומה');
    ok(await p.locator('ai-menu').evaluate((el) => !!el.shadowRoot?.querySelector('.logo')), 'כפתור הלוגו A&I בסרגל');
    ok(!(await p.locator('header >> text=העתקת קישור').first().isVisible().catch(() => false)), 'אין כפתורי פיתוח חופשיים בסרגל');
    ok(await p.locator('html').getAttribute('dir') === 'rtl', 'RTL');

    // השוואה
    await p.locator('.map-card').first().click();
    await p.waitForTimeout(800);
    ok((await p.locator('.lens-h').innerText()).includes('תמהיל ב'), 'השוואה: הכותרת עונה שתמהיל ב מחזיק תקציב');
    ok(await p.locator('.col-q .q').count() === 4, 'השוואה: ארבע שאלות עם מספר גדול');
    ok((await p.locator('.col-q .q').nth(1).locator('.q-big').innerText()).includes('153'), 'השוואה: גובה תמהיל א 153 מ׳ מהמנוע של גורד שחקים');
    ok(await p.locator('.budget-line').count() === 2, 'השוואה: קו תקציב על שני המגדלים');
    ok(await p.locator('.over').count() === 1, 'השוואה: קומות מעל קו התקציב מסומנות רק בתמהיל שחורג');
    ok(await p.locator('.col-focus .ins').count() === 2, 'השוואה: תובנה מחושבת מתחת לכל גרף');
    ok(await p.locator('.dock').isVisible(), 'השוואה: סרגל כפתורים קבוע');

    // עריכת תמהיל: הורדת 2 חדרים בתמהיל א עד שהוא מחזיק
    const inA = p.locator('.mix tbody tr').first().locator('input').first();
    await inA.fill('20');
    await p.waitForTimeout(400);
    ok(/a=20\./.test(await p.evaluate(() => location.hash)), 'עריכה: המצב נשמר בכתובת');
    const after = await p.locator('.lens-h').innerText();
    ok(after !== '' && !/א לא/.test(after), 'עריכה: הכותרת מתעדכנת (' + after + ')');

    // התמהיל שמחזיק
    await p.goto(BASE + '#/compare', { waitUntil: 'networkidle' });
    await p.evaluate(() => localStorage.clear());
    await p.goto(BASE + '#/compare?a=70.90.40.10.1200.0&b=10.40.70.30.1200.0', { waitUntil: 'networkidle' });
    await p.waitForTimeout(500);
    ok(await p.locator('.best').isVisible(), 'התמהיל שמחזיק מוצע');
    await p.locator('.best button').click();
    await p.waitForTimeout(500);
    ok((await p.locator('.lens-h').innerText()).includes('שניהם מחזיקים'), 'אחרי החלפה: שני התמהילים מחזיקים');

    // השוואות מוכנות
    await p.locator('.dock .chip', { hasText: 'מגורים מול עירוב שימושים' }).click();
    await p.waitForTimeout(400);
    ok(/b=10\.35\.60\.25\.1800\.2400/.test(await p.evaluate(() => location.hash)), 'השוואה מוכנה: עירוב שימושים נטען');

    // ניסוח
    await p.locator('.dock .primary').click();
    await p.waitForSelector('.brief');
    ok(calls.length === 1 && calls[0].mixes?.length === 2 && typeof calls[0].mixes[0].costMillion === 'number', 'ניסוח: נשלחים מספרי המנוע בלבד');
    ok((await p.locator('.brief-h').innerText()).includes('מחזיק תקציב'), 'ניסוח: הכותרת מוצגת');
    ok(await p.locator('.brief mark, .brief strong').count() > 3, 'ניסוח: ** מוצג כהדגשה');
    await p.locator('.brief-x').click();
    mode = 'fail';
    await p.locator('.dock .primary').click();
    await p.waitForSelector('.brief .tone-problem');
    ok((await p.locator('.brief .tone-problem').innerText()).includes('המספרים במסך'), 'ניסוח: כשל מוצג בבירור, המספרים לא תלויים בו');

    // שיטה
    await p.goto(BASE + '#/method', { waitUntil: 'networkidle' });
    ok(await p.locator('.chain .link-card').count() === 4, 'שיטה: ארבע שכבות עם תקן');
    ok(await p.locator('.notes tr').count() >= 8, 'שיטה: כל ההנחות עם מעמד');
    ok(await p.locator('.museum blockquote').isVisible(), 'שיטה: ציטוט עם מקור');

    // נייד
    const m = await b.newPage({ viewport: { width: 390, height: 844 } });
    await m.route('**/appofapp-gh.vercel.app/ai-menu.js', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: MENU }));
    await m.route('**/fonts.googleapis.com/**', (r) => r.abort());
    for (const h of ['/', '/compare', '/method']) {
      await m.goto(BASE + '#' + h, { waitUntil: 'networkidle' });
      await m.waitForTimeout(600);
      ok(!(await m.evaluate(() => document.documentElement.scrollWidth > innerWidth)), `נייד ${h}: בלי גלילה אופקית`);
    }
    await m.goto(BASE + '#/compare', { waitUntil: 'networkidle' });
    await m.locator('.panes .chip', { hasText: 'מגדלים' }).click();
    ok(await m.locator('.pane-towers .towers').isVisible(), 'נייד: מעבר לחלק המגדלים');

    ok(errors.length === 0, 'בלי שגיאות JavaScript ' + errors.join(' | '));
  } finally {
    await b.close();
    srv.kill();
  }
  console.log(fails.length ? `\n${fails.length} FAILED` : '\nALL PASS');
  process.exit(fails.length ? 1 : 0);
})();
