// שיטה: על איזה תקן כל שכבה נשענת, ואיך הכלי מודד את האמינות שלו.
import Rich from '../components/Rich';
import { NOTES } from '../data/assumptions';

const LAYERS = [
  { n: '1', t: 'תמהיל ← תושבים', std: 'מקדם נפש ליח"ד, הלמ"ס 2023', rel: 'נפשות לפי גודל הדירה הן **הנחה**. מנורמלות למקדם העיר, כך שהממוצע נשמר.', src: ['מחשבון הפרוגרמות', 'https://pixel-perfect-clone-6624.lovable.app'] },
  { n: '2', t: 'תושבים ← פרוגרמה', std: 'משרד החינוך, הפנים, הבריאות, פיקוד העורף, תמ"א 70', rel: 'הנוסחאות **אחד לאחד** מהמחשבון, כולל הספים של **1,000**, **2,000** ו-**3,000** נפש.', src: ['מחשבון הפרוגרמות', 'https://pixel-perfect-clone-6624.lovable.app'] },
  { n: '3', t: 'שטח ← מגדל', std: 'מנוע הגיאומטריה של גורד שחקים', rel: 'אותו קוד. בדיקה אוטומטית: המסלול המהיר שווה למנוע ב-**1%**, בשטח ובקומות.', src: ['גורד שחקים', 'https://anat1969.github.io/SkySkiper-GH/'] },
  { n: '4', t: 'מגדל ← כדאיות', std: 'רווח יזמי על עלות, כמו בתקן 21 של מועצת שמאי המקרקעין', rel: 'מחירים ועלויות הם **הנחות** לאשדוד. לכן לכל החלטה מוצג מדד יציבות.', src: ['תקן 21, מועצת שמאי המקרקעין', ''] },
];

const STATUS: Record<string, string> = { 'תקן': 'st-std', 'מקובל': 'st-ok', 'הנחה': 'st-as' };

export default function Method() {
  return (
    <main className="method">
      <header className="m-head">
        <div className="crumbs"><a href="#/">בית</a> / שיטה</div>
        <Rich as="h1" className="m-h">{'**ארבע שכבות**, ולכל אחת התקן שלה.'}</Rich>
        <Rich as="p" className="m-s">{'מה שמגיע מתקן מסומן **תקן**. מה שהוא טווח מקצועי, **מקובל**. מה שבחרנו, **הנחה**, ונבדק במדד היציבות.'}</Rich>
      </header>

      <ol className="chain">
        {LAYERS.map((l) => (
          <li key={l.n} className="link-card" data-info>
            <span className="q-n num">{l.n}</span>
            <h3>{l.t}</h3>
            <p className="std">{l.std}</p>
            <Rich as="p" className="rel">{l.rel}</Rich>
            {l.src[1] ? <a className="src" href={l.src[1]} target="_blank" rel="noreferrer">{l.src[0]}</a> : <span className="src">{l.src[0]}</span>}
          </li>
        ))}
      </ol>

      <div className="m-grid">
        <section aria-label="ההנחות">
          <h2 className="col-h">ההנחות, אחת אחת</h2>
          <table className="notes">
            <tbody>
              {NOTES.map((x) => (
                <tr key={x.key}>
                  <th scope="row">{x.label}</th>
                  <td className="num-cell"><bdi>{x.value}</bdi></td>
                  <td><span className={`status ${STATUS[x.status]}`}>{x.status}</span></td>
                  <td className="why">{x.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section aria-label="איך מודדים אמינות">
          <h2 className="col-h">איך הכלי מודד את האמינות שלו</h2>
          <div className="tone tone-insight"><h4>מדד היציבות</h4><Rich as="p">{'כמה **ירידה במחיר הדירה** התמהיל המנצח סופג לפני שהרווח יורד מתחת ל-**15%**. מתחת ל-**8%**: החלטה רגישה.'}</Rich></div>
          <div className="tone tone-neutral"><h4>נקודת ההיפוך</h4><Rich as="p">{'השינוי במחיר שבו **סדר הרווח** בין שני התמהילים מתהפך. רחוק מ-**40%**: לא מוצג.'}</Rich></div>
          <div className="tone tone-problem"><h4>מה לא נכלל</h4><Rich as="p">{'**היטל השבחה**, אגרות ותשלומי פיתוח, מע"מ ולוח זמנים. הם משנים את הסכום, לא את ההשוואה בין תמהילים על אותו מגרש.'}</Rich></div>
        </section>

        <section className="museum" aria-label="ריכוז ידע">
          <blockquote>
            <p>“Form ever follows function.”</p>
            <footer>לואיס סאליבן (Louis Sullivan), The Tall Office Building Artistically Considered, 1896</footer>
          </blockquote>
          <Rich as="p" className="m-ins">{'במגדל מגורים, ==התמהיל הוא הפונקציה==. הגובה, החניון והגן בקומת הקרקע נגזרים ממנו.'}</Rich>
          <p className="haiku">אותה קומה אחרונה<br />ועוד ארבעים דלתות<br />החניון מכריע</p>
          <p className="label">מקורות: מחשבון הפרוגרמות · גורד שחקים · קרובות: ביניינית, חלופה שעוברת בדיקה, אדריכלות ביופילית</p>
        </section>
      </div>
    </main>
  );
}
