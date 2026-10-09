import { Link } from 'react-router-dom'
import type { Course } from '../data/catalog'

/** 講座へのリンクの並び。スマホで押しやすいよう、1つずつ独立した部品にする。 */
export default function CourseLinks({ list }: { list: Course[] }) {
  return (
    <ul className="rel-links">
      {list.map((c) => (
        <li key={c.id}><Link className="rel-link" to={`/course/${c.id}`}>{c.title}</Link></li>
      ))}
    </ul>
  )
}
