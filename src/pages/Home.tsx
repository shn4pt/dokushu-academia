import { Link } from 'react-router-dom'
import { ProgressBar, StatusBadge } from '../components'
import { findLesson, llmStages, stageLabel } from '../data/curriculum'
import { nextLessonId, overallMinutes, overallStats, stageStats } from '../data/stats'
import { useDueKeys } from '../review'
import { formatMinutes, lessonMinutes } from '../time'
import { useProgress } from '../progress'

export default function Home() {
  const p = useProgress()
  const { done, total, percent } = overallStats(p)
  const next = nextLessonId(p)
  const due = useDueKeys().length
  const time = overallMinutes(p)
  const nextLesson = next ? findLesson(next) : undefined
  const position = next ? p.reading[next] : undefined

  return (
    <>
      <p className="crumb"><Link to="/catalog">講座一覧</Link> / LLM の講座</p>
      <h1>LLMのしくみを、段階的に学ぶ</h1>
      <p className="lead">
        プログラミング経験者向けに、序論と{llmStages.length - 1}のステージで学びます。第1部では、前提となる数学から Transformer、学習、推論まで、
        LLM の内部を理解します。第2部では、Claude API を使って、ツールを使うエージェントの機能を設計・実装・評価できるようになります。
        第3部では、AI を使った開発のやり方を、補完から AI ネイティブな開発まで段階的に進化させる方法を学びます。
        進捗はこのブラウザにだけ保存されます。
      </p>

      <section className="card">
        <div className="row between">
          <strong>全体の進捗</strong>
          <span>{percent}%({done} / {total} レッスン)</span>
        </div>
        <ProgressBar value={percent} label="全体の進捗" />
        <p className="muted time-line">
          学習時間の目安: 全体で {formatMinutes(time.total, true)} ・ 残り <strong>{formatMinutes(time.remaining, true)}</strong>
        </p>
        <div className="row">
          {nextLesson ? (
            <>
              <Link className="button" to={`/lesson/${nextLesson.id}`} state={{ resume: true }}>
                {done === 0 && !position ? '学習を始める' : '続きから学ぶ'}:{nextLesson.title}
              </Link>
              <span className="muted">
                {formatMinutes(lessonMinutes(nextLesson.id))}
                {position && ` ・ 前回は「${position.section}」まで読みました`}
              </span>
            </>
          ) : (
            <span>公開中のレッスンはすべて完了しました。</span>
          )}
        </div>
      </section>

      {due > 0 && (
        <section className="card">
          <div className="row between">
            <span><strong>復習が必要な問題が {due} 問あります</strong><span className="muted block">間違えた問題を、2回連続で正解できるまで復習します。</span></span>
            <Link className="button" to="/review">復習する</Link>
          </div>
        </section>
      )}

      <h2>ステージ別</h2>
      <div className="stage-list">
        {llmStages.map((s) => {
          const st = stageStats(s, p)
          const pct = st.total === 0 ? 0 : Math.round((st.done / st.total) * 100)
          return (
            <Link key={s.id} to={`/stage/${s.id}`} className="card stage-card">
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
    </>
  )
}
