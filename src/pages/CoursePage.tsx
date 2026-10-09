import { Link, Navigate, useParams } from 'react-router-dom'
import { ProgressBar, StatusBadge } from '../components'
import { evidenceInfo, findCourse, courseStatus, groups, levelLabel, priorityOf, statusLabel, prerequisites, usedBy } from '../data/catalog'
import { findStage, stageLabel } from '../data/curriculum'
import { stageStats } from '../data/stats'
import { plannedTotal, writtenCount } from '../data/writing'
import CourseLinks from '../ui/CourseLinks'
import { useProgress } from '../progress'

export default function CoursePage() {
  const { id } = useParams()
  const p = useProgress()
  const course = id ? findCourse(id) : undefined
  if (!course) return <Navigate to="/catalog" replace />
  const ev = evidenceInfo[course.evidence]
  const group = groups.find((g) => g.id === course.group)
  const status = courseStatus(course)
  const before = prerequisites(course).map((c) => ({ course: c, note: course.needs?.[c.id] }))
  const after = usedBy(course)

  return (
    <>
      <p className="crumb"><Link to="/catalog">講座一覧</Link> / {group?.title}</p>
      <div className="row between">
        <h1>{course.title}</h1>
        <span className={`badge ${status !== 'outline' ? 'badge-doing' : ''}`}>{statusLabel[status]}</span>
      </div>
      <p className="lead">{course.summary}</p>
      <p className="muted" data-testid="writing-status">
        執筆の状況: 本文 {writtenCount(course)} / 予定 {plannedTotal(course)} レッスン
        {priorityOf(course) && status !== 'open' && ` ・ 執筆の優先度: ${priorityOf(course)!.title}`}
        {status === 'open' && ' ・ すべての段階が公開済み'}
      </p>

      {['llm', 'agents', 'aidev'].includes(course.id) && (
        <Link to="/llm" className="card stage-card">
          <strong>LLM の講座のホーム</strong>
          <span className="muted">序論と Stage 0〜20 の全体像、進捗、学習時間の目安、復習をまとめて見られます。</span>
        </Link>
      )}

      {course.group === 'learning' && (
        <Link to="/map" className="card stage-card">
          <strong>最初に: このサービスの地図</strong>
          <span className="muted">講座のつながりと、この構成の理由、根拠の表示の読み方を、1枚で見ます。</span>
        </Link>
      )}

      <section className="card why-card" aria-label="なぜ学ぶのか">
        <strong>なぜ学ぶのか</strong>
        <p>{course.why}</p>
      </section>

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
            <><strong>この講座の知識を使う講座</strong><CourseLinks list={after} /></>
          )}
          <span className="muted">学ぶ順序の提案で、必須ではありません。</span>
          <Link className="rel-link" to="/map">全体の地図</Link>
        </section>
      )}

      {status === 'outline' && (
        <p className="notice" role="note">
          この講座は<strong>目次の案</strong>です。本文はまだありません。話題の案であり、内容の主張ではありません。
        </p>
      )}
      {status === 'partial' && (
        <p className="notice" role="note">
          この講座は<strong>一部だけ公開中</strong>です。「準備中」の項目は目次の案で、本文はまだありません。話題の案であり、内容の主張ではありません。
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
