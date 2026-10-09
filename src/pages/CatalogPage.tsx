import { Link } from 'react-router-dom'
import { ProgressBar } from '../components'
import { courseStageIds, courses, evidenceInfo, groups, isAvailable, plannedCount } from '../data/catalog'
import { findLesson, findStage } from '../data/curriculum'
import { nextLessonId, overallStats, stageStats } from '../data/stats'
import { formatMinutes, lessonMinutes } from '../time'
import { useProgress } from '../progress'

export default function CatalogPage() {
  const p = useProgress()
  const { done } = overallStats(p)
  const next = nextLessonId(p)
  const nextLesson = next ? findLesson(next) : undefined
  const position = next ? p.reading[next] : undefined
  return (
    <>
      <h1>講座一覧</h1>
      <p className="lead">
        社会人が、隙間時間に1レッスンずつ、学問と一次情報に基づいて学び直すための講座です。各講座は、基礎 → 実践 → 応用の段階で並んでいます。
        どの記述にも、根拠の種類と確認の程度が見えるようにします。
      </p>
      <p className="notice" role="note">
        <strong>構成案です。</strong>「公開中」の講座以外は目次の案だけで、本文はまだありません。題名は話題の案で、本文を書くときに出典を確認して決め直します。
      </p>
      {nextLesson && (
        <section className="card" aria-label="続きから学ぶ">
          <div className="row">
            <Link className="button" to={`/lesson/${nextLesson.id}`} state={{ resume: true }}>
              {done === 0 && !position ? '学習を始める' : '続きから学ぶ'}:{nextLesson.title}
            </Link>
            <span className="muted">
              {formatMinutes(lessonMinutes(nextLesson.id))}
              {position && ` ・ 前回は「${position.section}」まで読みました`}
            </span>
          </div>
        </section>
      )}
      {groups.map((g) => (
        <section key={g.id} aria-labelledby={`group-${g.id}`}>
          <h2 id={`group-${g.id}`}>{g.title}</h2>
          <p className="muted">{g.note}</p>
          <div className="course-list">
            {courses.filter((c) => c.group === g.id).map((c) => {
              const available = isAvailable(c)
              let done = 0
              let total = 0
              for (const id of courseStageIds(c)) {
                const s = findStage(id)
                if (!s) continue
                const st = stageStats(s, p)
                done += st.done
                total += st.total
              }
              const pct = total === 0 ? 0 : Math.round((done / total) * 100)
              return (
                <Link key={c.id} to={`/course/${c.id}`} className="card course-card">
                  <div className="row between">
                    <strong>{c.title}</strong>
                    <span className={`badge ${available ? 'badge-doing' : ''}`}>{available ? '公開中' : '目次のみ'}</span>
                  </div>
                  <span className="muted">{c.summary}</span>
                  <span className="evidence-tag">根拠: {evidenceInfo[c.evidence].label}</span>
                  {available ? (
                    <>
                      <ProgressBar value={pct} label={`${c.title}の進捗`} />
                      <span className="muted">{done} / {total} レッスン</span>
                    </>
                  ) : (
                    <span className="muted">目次の案 {plannedCount(c)} 件</span>
                  )}
                </Link>
              )
            })}
          </div>
        </section>
      ))}
    </>
  )
}
