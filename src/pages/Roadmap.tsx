import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ProgressBar, StatusBadge } from '../components'
import { stages } from '../data/curriculum'
import { nextLessonId, overallMinutes, overallStats, stageMinutes, stageStats } from '../data/stats'
import { isReady } from '../lessons'
import { formatMinutes, lessonMinutes } from '../time'
import { useProgress } from '../progress'

const phases = [
  { title: '基礎', note: '数学と機械学習の土台', stageIds: ['s0', 's1', 's2'] },
  { title: 'LLMの中核', note: '言語の表現と Transformer', stageIds: ['s3', 's4'] },
  { title: '学習と推論', note: 'モデルを作り、動かす', stageIds: ['s5', 's6'] },
  { title: '調整と応用', note: '使えるモデルにして、使う', stageIds: ['s7', 's8'] },
  { title: 'エージェント開発', note: '第2部:API で LLM を組み込み、エージェントを作る', stageIds: ['s9'] },
]

export default function Roadmap() {
  const p = useProgress()
  const { done, total, percent } = overallStats(p)
  const next = nextLessonId(p)
  const time = overallMinutes(p)

  return (
    <>
      <h1>ロードマップ</h1>
      <p className="lead">上から順に進めるのがおすすめですが、知っている部分は飛ばしても構いません。</p>

      <div className="card">
        <div className="row between">
          <strong>全体の進捗</strong>
          <span>{percent}%({done} / {total} レッスン)</span>
        </div>
        <ProgressBar value={percent} label="全体の進捗" />
        <p className="muted time-line">
          学習時間の目安: 全体で {formatMinutes(time.total, true)} ・ 残り <strong>{formatMinutes(time.remaining, true)}</strong>
        </p>
        <div className="legend muted" aria-hidden>
          <span><span className="check on">✓</span> 完了</span>
          <span><span className="check next" /> 次のレッスン</span>
          <span><span className="check" /> 未完了</span>
        </div>
      </div>

      {phases.map((phase) => (
        <section key={phase.title} aria-labelledby={`phase-${phase.title}`}>
          <h2 id={`phase-${phase.title}`} className="phase-title">
            {phase.title} <small className="muted">{phase.note}</small>
          </h2>
          <ol className="roadmap">
            {phase.stageIds.map((sid) => {
              const s = stages.find((x) => x.id === sid)!
              const index = stages.indexOf(s)
              const st = stageStats(s, p)
              const sm = stageMinutes(s, p)
              const pct = st.total === 0 ? 0 : Math.round((st.done / st.total) * 100)
              return (
                <li key={s.id} className={`roadmap-item status-${st.status}`}>
                  <div
                    className="roadmap-ring"
                    style={{ '--pct': pct } as CSSProperties}
                    role="img"
                    aria-label={`Stage ${index}、進捗 ${pct}%`}
                  >
                    <span>{index}</span>
                  </div>
                  <div className="card roadmap-card">
                    <div className="row between">
                      <Link to={`/stage/${s.id}`} className="stage-link"><strong>{s.title}</strong></Link>
                      <span className="row">
                        <span className="muted">{st.done} / {st.total} ・ {formatMinutes(sm.total, true)}</span>
                        <StatusBadge status={st.status} />
                      </span>
                    </div>
                    <span className="muted">{s.goal}</span>
                    <ul className="chips">
                      {s.lessons.map((l) => {
                        const isDone = !!p.completed[l.id]
                        const isNext = l.id === next
                        const ready = isReady(l.id)
                        const cls = 'lesson-chip' + (isDone ? ' done' : '') + (isNext ? ' next' : '')
                        const inner = (
                          <>
                            <span className={'check' + (isDone ? ' on' : isNext ? ' next' : '')} aria-hidden>
                              {isDone ? '✓' : ''}
                            </span>
                            <span className="grow">{l.title}</span>
                            {isNext && <span className="next-pill">次はここ</span>}
                            {!isNext && !isDone && p.reading[l.id] && <span className="resume-pill">途中</span>}
                            {ready && <span className="muted chip-time">{lessonMinutes(l.id)}分</span>}
                          </>
                        )
                        return (
                          <li key={l.id}>
                            {ready ? (
                              <Link
                                to={`/lesson/${l.id}`}
                                className={cls}
                                title={l.summary}
                                aria-label={`${l.title}${isDone ? '(完了)' : isNext ? '(次のレッスン)' : ''}`}
                              >
                                {inner}
                              </Link>
                            ) : (
                              <span className={cls + ' disabled'}>{inner}</span>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
      ))}
    </>
  )
}
