import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { allLessons, findLesson, findStage } from '../data/curriculum'
import { norm } from '../search'
import { isReady, loadLessonContent } from '../lessons'
import type { LessonContent, QuizQuestion } from '../lessons/types'
import { progressActions, useProgress } from '../progress'

function Quiz({ lessonId, questions }: { lessonId: string; questions: QuizQuestion[] }) {
  const p = useProgress()
  const [picked, setPicked] = useState<(number | null)[]>(() => questions.map(() => null))
  const [submitted, setSubmitted] = useState(false)

  const score = picked.filter((a, i) => a === questions[i].answer).length
  const best = p.quiz[lessonId]

  function submit() {
    setSubmitted(true)
    progressActions.recordQuiz(lessonId, score, questions.length)
  }

  function retry() {
    setPicked(questions.map(() => null))
    setSubmitted(false)
  }

  return (
    <section className="card quiz">
      <h3>確認クイズ</h3>
      {questions.map((q, qi) => (
        <fieldset key={qi} disabled={submitted}>
          <legend>Q{qi + 1}. {q.question}</legend>
          {q.choices.map((c, ci) => {
            const isAnswer = submitted && ci === q.answer
            const isWrong = submitted && picked[qi] === ci && ci !== q.answer
            return (
              <label key={ci} className={isAnswer ? 'correct' : isWrong ? 'wrong' : ''}>
                <input
                  type="radio"
                  name={`q${qi}`}
                  checked={picked[qi] === ci}
                  onChange={() => setPicked(picked.map((v, i) => (i === qi ? ci : v)))}
                />
                {c}
              </label>
            )
          })}
          {submitted && <p className="muted">{q.explanation}</p>}
        </fieldset>
      ))}
      <div className="row">
        {!submitted ? (
          <button onClick={submit} disabled={picked.some((a) => a === null)}>答え合わせ</button>
        ) : (
          <>
            <strong>{score} / {questions.length} 問正解</strong>
            <button className="secondary" onClick={retry}>もう一度</button>
          </>
        )}
        {best && <span className="muted">自己ベスト: {best.best} / {best.total}</span>}
      </div>
    </section>
  )
}

export default function LessonPage() {
  const { id } = useParams()
  const location = useLocation()
  const p = useProgress()
  const lesson = id ? findLesson(id) : undefined
  const [loaded, setLoaded] = useState<{ id: string; content: LessonContent } | null>(null)
  const ready = !!id && isReady(id)

  useEffect(() => {
    if (!id || !isReady(id)) return
    progressActions.visit(id)
    window.scrollTo(0, 0)
    let cancelled = false
    loadLessonContent(id).then((content) => {
      if (!cancelled) setLoaded({ id, content })
    })
    return () => {
      cancelled = true
    }
  }, [id])

  // 検索結果から来た場合は、該当する見出しまでスクロールする
  const targetSection = (location.state as { section?: string } | null)?.section
  const shown = loaded?.id === id
  useEffect(() => {
    if (!shown || !targetSection) return
    const heading = [...document.querySelectorAll('.prose h3')].find((h) => norm(h.textContent ?? '') === norm(targetSection))
    if (!heading) return
    const frame = requestAnimationFrame(() => {
      heading.scrollIntoView({ block: 'start' })
      heading.classList.add('flash')
    })
    const timer = setTimeout(() => heading.classList.remove('flash'), 2000)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [shown, targetSection])

  if (!lesson || !ready) return <Navigate to="/roadmap" replace />
  if (!loaded || loaded.id !== lesson.id) return <p className="muted">読み込み中…</p>
  const content = loaded.content

  const stage = findStage(lesson.stageId)!
  const readyLessons = allLessons.filter((l) => isReady(l.id))
  const idx = readyLessons.findIndex((l) => l.id === lesson.id)
  const prev = readyLessons[idx - 1]
  const next = readyLessons[idx + 1]
  const done = !!p.completed[lesson.id]
  const { Body } = content

  return (
    <article key={lesson.id}>
      <p className="crumb">
        <Link to="/roadmap">ロードマップ</Link> / <Link to={`/stage/${stage.id}`}>{stage.title}</Link>
      </p>
      <h1>{lesson.id} {lesson.title}</h1>
      <p className="lead">{lesson.summary}</p>

      <div className="prose"><Body /></div>

      <Quiz key={lesson.id} lessonId={lesson.id} questions={content.quiz} />

      <div className="row complete">
        <button
          className={done ? 'secondary' : ''}
          onClick={() => progressActions.setCompleted(lesson.id, !done)}
        >
          {done ? '✓ 完了済み(取り消す)' : 'このレッスンを完了にする'}
        </button>
      </div>

      <nav className="row between pager">
        {prev ? <Link to={`/lesson/${prev.id}`}>← {prev.title}</Link> : <span />}
        {next ? <Link to={`/lesson/${next.id}`}>{next.title} →</Link> : <span />}
      </nav>
    </article>
  )
}
