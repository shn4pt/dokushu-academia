import { Link } from 'react-router-dom'
import { entries } from '../data/course-entry'
import { findLesson } from '../data/curriculum'

/** 講座の目次の冒頭: こんな場面で読む / 学ぶと持ち帰れること / 前提と範囲。目次に進む前に、役立つ場面を把握できるようにする。 */
export default function CourseEntryCards({ courseId }: { courseId: string }) {
  const e = entries[courseId]
  if (!e) return null
  return (
    <>
      <section className="card entry-card" aria-label="こんな場面で読む">
        <strong>こんな場面で読む</strong>
        <p>{e.when}</p>
        <span className="muted">考える助けになる問い</span>
        <ul className="entry-list">
          {e.questions.map((q) => <li key={q}>{q}</li>)}
        </ul>
      </section>

      <section className="card entry-card" aria-label="学ぶと持ち帰れること">
        <strong>学ぶと持ち帰れること</strong>
        <ul className="entry-list">
          {e.gains.map((g) => (
            <li key={g.text}>
              {g.text}
              <span className="plan-chips">
                {g.lessons.map((id) => {
                  const l = findLesson(id)
                  return l ? <Link key={id} className="chip" to={`/lesson/${id}`} title={l.title}>{l.label ?? id}</Link> : null
                })}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card entry-card" aria-label="前提と範囲">
        <strong>前提と、この講座の範囲</strong>
        <p>{e.scope}</p>
        <span className="muted">AI と一人で取り組む場面との関係{e.solo.kind === 'indirect' ? '(間接的)' : ''}</span>
        <p>{e.solo.text}</p>
      </section>
    </>
  )
}
