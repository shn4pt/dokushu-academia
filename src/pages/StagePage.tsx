import { Link, Navigate, useParams } from 'react-router-dom'
import { ProgressBar, StatusBadge } from '../components'
import { findLesson, findStage, lessonNo, stageLabel, stages } from '../data/curriculum'
import { stageMinutes, stageStats } from '../data/stats'
import { isReady } from '../lessons'
import { formatMinutes, lessonMinutes } from '../time'
import { useProgress } from '../progress'

export default function StagePage() {
  const { id } = useParams()
  const p = useProgress()
  const stage = id ? findStage(id) : undefined
  if (!stage) return <Navigate to="/roadmap" replace />

  const index = stages.indexOf(stage)
  const prev = index > 0 ? stages[index - 1] : undefined
  const prevStats = prev ? stageStats(prev, p) : undefined
  const st = stageStats(stage, p)
  const sm = stageMinutes(stage, p)
  const pct = st.total === 0 ? 0 : Math.round((st.done / st.total) * 100)

  return (
    <>
      <p className="crumb"><Link to="/roadmap">ロードマップ</Link> / {stageLabel(stage)}</p>
      <div className="row between">
        <h1>{stage.title}</h1>
        <StatusBadge status={st.status} />
      </div>
      <p className="lead">{stage.goal}</p>
      {sm.total > 0 && (
        <p className="muted time-line">
          所要時間の目安: 全体で {formatMinutes(sm.total, true)} ・ 残り <strong>{formatMinutes(sm.remaining, true)}</strong>
        </p>
      )}
      {stage.why && (
        <section className="card why-card">
          <strong>なぜ学ぶのか</strong>
          <p>{stage.why}</p>
          {stage.uses && stage.uses.length > 0 && (
            <>
              <span className="muted">このステージの知識を使う、先のレッスン</span>
              <ul className="plain uses">
                {stage.uses.map((u) => (
                  <li key={u.concept}>
                    <strong>{u.concept}</strong> →{' '}
                    {u.lessonIds.map((id, k) => {
                      const target = findLesson(id)
                      return (
                        <span key={id}>
                          {k > 0 && '、'}
                          {target ? <Link to={`/lesson/${id}`}>{lessonNo(target)} {target.title}</Link> : id}
                        </span>
                      )
                    })}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
      <ProgressBar value={pct} label={`${stage.title}の進捗`} />

      {prev && prevStats && prevStats.status !== 'done' && prevStats.status !== 'empty' && (
        <p className="notice">
          前提として、<Link to={`/stage/${prev.id}`}>{stageLabel(prev)}「{prev.title}」</Link>
          を先に学ぶことをおすすめします。
        </p>
      )}

      <ul className="lesson-list">
        {stage.lessons.map((l) => {
          const ready = isReady(l.id)
          const done = !!p.completed[l.id]
          const body = (
            <>
              <span className={'check' + (done ? ' on' : '')} aria-hidden>{done ? '✓' : ''}</span>
              <span className="grow">
                <strong>{lessonNo(l)} {l.title}</strong>
                <span className="muted block">{l.summary}</span>
              </span>
              {ready && <span className="muted chip-time">{formatMinutes(lessonMinutes(l.id))}</span>}
              {!ready && <span className="badge badge-empty">準備中</span>}
              {ready && !done && p.reading[l.id] && <span className="resume-pill">途中</span>}
            </>
          )
          return (
            <li key={l.id}>
              {ready ? (
                <Link to={`/lesson/${l.id}`} className="card lesson-item">{body}</Link>
              ) : (
                <div className="card lesson-item disabled">{body}</div>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}
