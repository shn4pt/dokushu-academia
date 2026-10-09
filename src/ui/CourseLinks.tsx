import { Link } from 'react-router-dom'
import type { Course } from '../data/catalog'

type Item = Course | { course: Course; note?: string }
const norm = (i: Item) => ('course' in i ? i : { course: i, note: undefined })

/** 講座へのリンクの並び。スマホで押しやすいよう、1つずつ独立した部品にする。理由(note)があれば、リンクの下に添える。 */
export default function CourseLinks({ list }: { list: Item[] }) {
  const items = list.map(norm)
  const withNotes = items.some((i) => i.note)
  return (
    <ul className={withNotes ? 'rel-links rel-notes' : 'rel-links'}>
      {items.map(({ course, note }) => (
        <li key={course.id}>
          <Link className="rel-link" to={`/course/${course.id}`}>{course.title}</Link>
          {note && <span className="muted block">{note}</span>}
        </li>
      ))}
    </ul>
  )
}
