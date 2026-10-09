import { Link, Navigate, useParams } from 'react-router-dom'
import { ProgressBar, StatusBadge } from '../components'
import { evidenceInfo, findCourse, followers, groups, isAvailable, levelLabel, prerequisites } from '../data/catalog'
import { findStage, stageLabel } from '../data/curriculum'
import { stageStats } from '../data/stats'
import CourseLinks from '../ui/CourseLinks'
import { useProgress } from '../progress'

export default function CoursePage() {
  const { id } = useParams()
  const p = useProgress()
  const course = id ? findCourse(id) : undefined
  if (!course) return <Navigate to="/catalog" replace />
  const ev = evidenceInfo[course.evidence]
  const group = groups.find((g) => g.id === course.group)
  const available = isAvailable(course)
  const before = prerequisites(course)
  const after = followers(course)

  return (
    <>
      <p className="crumb"><Link to="/catalog">講座一覧</Link> / {group?.title}</p>
      <div className="row between">
        <h1>{course.title}</h1>
        <span className={`badge ${available ? 'badge-doing' : ''}`}>{available ? '公開中' : '目次のみ'}</span>
      </div>
      <p className="lead">{course.summary}</p>

      {course.group === 'learning' && (
        <Link to="/map" className="card stage-card">
          <strong>最初に: このサービスの地図</strong>
          <span className="muted">講座のつながりと、この構成の理由、根拠の表示の読み方を、1枚で見ます。</span>
        </Link>
      )}

      <section className="card why-card">
        <strong>この講座の根拠の基準: {ev.label}</strong>
        <p>{ev.basis}。{ev.note}</p>
      </section>

      {(before.length > 0 || after.length > 0) && (
        <section className="card" aria-label="講座の関係">
          {before.length > 0 && (
            <><strong>先に学ぶとよい講座</strong><CourseLinks list={before} /></>
          )}
          {after.length > 0 && (
            <><strong>この講座のあとに</strong><CourseLinks list={after} /></>
          )}
          <span className="muted">学ぶ順序の提案で、必須ではありません。</span>
          <Link className="rel-link" to="/map">全体の地図</Link>
        </section>
      )}

      {!available && (
        <p className="notice" role="note">
          この講座は<strong>目次の案</strong>です。本文はまだありません。話題の案であり、内容の主張ではありません。
        </p>
      )}

      {course.tiers.map((t) => (
        <section key={t.level} className="tier" aria-labelledby={`tier-${t.level}`}>
          <h2 id={`tier-${t.level}`}>{levelLabel[t.level]}</h2>
          <p className="muted">{t.scope}</p>
          {t.stageIds && (
            <div className="stage-list">
              {t.stageIds.map((sid) => {
                const s = findStage(sid)
                if (!s) return null
                const st = stageStats(s, p)
                const pct = st.total === 0 ? 0 : Math.round((st.done / st.total) * 100)
                return (
                  <Link key={sid} to={`/stage/${sid}`} className="card stage-card">
                    <div className="row between">
                      <strong>{stageLabel(s)}. {s.title}</strong>
                      <StatusBadge status={st.status} />
                    </div>
                    <ProgressBar value={pct} label={`${s.title}の進捗`} />
                    <span className="muted">{st.total === 0 ? '公開準備中' : `${st.done} / ${st.total} レッスン`}</span>
                  </Link>
                )
              })}
            </div>
          )}
          {t.planned && (
            <ul className="plain planned">
              {t.planned.map((title) => (
                <li key={title} className="card planned-item"><span>{title}</span><span className="badge">準備中</span></li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </>
  )
}
