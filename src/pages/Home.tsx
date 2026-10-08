import { Link } from 'react-router-dom'
import { ProgressBar, StatusBadge } from '../components'
import { findLesson, stages } from '../data/curriculum'
import { nextLessonId, overallStats, stageStats } from '../data/stats'
import { useDueKeys } from '../review'
import { useProgress } from '../progress'

export default function Home() {
  const p = useProgress()
  const { done, total, percent } = overallStats(p)
  const next = nextLessonId(p)
  const due = useDueKeys().length
  const nextLesson = next ? findLesson(next) : undefined

  return (
    <>
      <h1>LLMのしくみを、段階的に学ぶ</h1>
      <p className="lead">
        前提となる数学から、Transformer、学習、推論、応用まで。プログラミング経験者向けに、9つのステージで
        LLMの内部を理解します。進捗はこのブラウザにだけ保存されます。
      </p>

      <section className="card">
        <div className="row between">
          <strong>全体の進捗</strong>
          <span>{percent}%({done} / {total} レッスン)</span>
        </div>
        <ProgressBar value={percent} label="全体の進捗" />
        <div className="row">
          {nextLesson ? (
            <Link className="button" to={`/lesson/${nextLesson.id}`}>
              {done === 0 ? '学習を始める' : '続きから学ぶ'}:{nextLesson.title}
            </Link>
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
        {stages.map((s, i) => {
          const st = stageStats(s, p)
          const pct = st.total === 0 ? 0 : Math.round((st.done / st.total) * 100)
          return (
            <Link key={s.id} to={`/stage/${s.id}`} className="card stage-card">
              <div className="row between">
                <strong>Stage {i}. {s.title}</strong>
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
