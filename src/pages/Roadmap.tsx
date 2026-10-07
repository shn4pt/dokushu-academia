import { Link } from 'react-router-dom'
import { StatusBadge } from '../components'
import { stages } from '../data/curriculum'
import { stageStats } from '../data/stats'
import { useProgress } from '../progress'

export default function Roadmap() {
  const p = useProgress()
  return (
    <>
      <h1>ロードマップ</h1>
      <p className="lead">上から順に進めるのがおすすめですが、知っている部分は飛ばしても構いません。</p>
      <ol className="roadmap">
        {stages.map((s, i) => {
          const st = stageStats(s, p)
          return (
            <li key={s.id} className={`roadmap-item status-${st.status}`}>
              <div className="roadmap-dot" aria-hidden>{i}</div>
              <Link to={`/stage/${s.id}`} className="card">
                <div className="row between">
                  <strong>{s.title}</strong>
                  <StatusBadge status={st.status} />
                </div>
                <span className="muted">{s.goal}</span>
              </Link>
            </li>
          )
        })}
      </ol>
    </>
  )
}
