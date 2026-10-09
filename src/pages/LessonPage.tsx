import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { allLessons, findLesson, findStage, lessonNo } from '../data/curriculum'
import { questionKey } from '../review'
import { formatMinutes, lessonTime } from '../time'
import { currentSection, findHeading, scrollToHeading } from '../reading'
import { isReady, loadLessonContent } from '../lessons'
import type { LessonContent, QuizQuestion } from '../lessons/types'
import SourceNote from '../ui/SourceNote'
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
    progressActions.recordAnswers(
      questions.map((q, i) => ({ key: questionKey(lessonId, q.question), correct: picked[i] === q.answer })),
    )
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
  const fromResume = !!(location.state as { resume?: boolean } | null)?.resume
  const shown = loaded?.id === id
  useEffect(() => {
    if (!shown || !targetSection) return
    const heading = findHeading(targetSection)
    if (!heading) return
    const frame = requestAnimationFrame(() => scrollToHeading(heading))
    return () => cancelAnimationFrame(frame)
  }, [shown, targetSection])

  // しおり: 開いたときに、前回の位置があれば案内する(ホームの「続きから」からなら自動で移動する)
  const readingRef = useRef(p.reading)
  readingRef.current = p.reading
  const completedRef = useRef(p.completed)
  completedRef.current = p.completed
  const [resume, setResume] = useState<{ section: string; mode: 'prompt' | 'resumed' } | null>(null)
  useEffect(() => {
    setResume(null)
    if (!shown || !id || targetSection) return
    const section = readingRef.current[id]?.section
    if (!section || completedRef.current[id]) return
    const heading = findHeading(section)
    if (!heading) return // 本文の見出しが変わって、位置が分からなくなった場合は何もしない
    if (fromResume) {
      const frame = requestAnimationFrame(() => scrollToHeading(heading))
      setResume({ section, mode: 'resumed' })
      return () => cancelAnimationFrame(frame)
    }
    setResume({ section, mode: 'prompt' })
  }, [shown, id])

  useEffect(() => {
    if (resume?.mode !== 'resumed') return
    const timer = setTimeout(() => setResume(null), 8000)
    return () => clearTimeout(timer)
  }, [resume])

  // しおり: 最も先まで読み進めた見出しを、スクロールに合わせて保存する(見出しが進んだときだけ書き込まれる)
  useEffect(() => {
    if (!shown || !id) return
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        if (completedRef.current[id]) return // 読み終えたレッスンでは記録しない
        const pos = currentSection()
        if (pos) progressActions.setReading(id, pos.section, pos.index)
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [shown, id])

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
  const time = lessonTime(lesson.id)

  return (
    <article key={lesson.id}>
      <p className="crumb">
        <Link to="/roadmap">ロードマップ</Link> / <Link to={`/stage/${stage.id}`}>{stage.title}</Link>
      </p>
      <h1>{lessonNo(lesson)} {lesson.title}</h1>
      <p className="lead">{lesson.summary}</p>
      {time && (
        <p className="muted time-line" title="本文の文字数、数式、デモ、クイズの数から見積もった目安です">
          所要時間の目安: <strong>{formatMinutes(time.total)}</strong>
          (本文 {time.reading}分{time.demo > 0 && ` ・ デモ ${time.demo}分`} ・ クイズ {time.quiz}分)
        </p>
      )}

      {resume?.mode === 'prompt' && (
        <div className="card resume-banner" role="status">
          <span>前回は「{resume.section}」まで読みました。</span>
          <span className="row">
            <button
              onClick={() => {
                const heading = findHeading(resume.section)
                if (heading) scrollToHeading(heading)
                setResume(null)
              }}
            >
              続きから読む
            </button>
            <button
              className="secondary"
              onClick={() => {
                progressActions.clearReading(lesson.id)
                setResume(null)
              }}
            >
              最初から
            </button>
          </span>
        </div>
      )}

      <div className="prose"><Body /></div>

      <SourceNote lessonId={lesson.id} />

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
      {resume?.mode === 'resumed' && (
        <div className="resume-toast" role="status">
          <span>前回の続き(「{resume.section}」)から表示しています。</span>
          <button
            className="secondary"
            onClick={() => {
              window.scrollTo(0, 0)
              progressActions.clearReading(lesson.id)
              setResume(null)
            }}
          >
            先頭から読む
          </button>
          <button className="secondary" aria-label="閉じる" onClick={() => setResume(null)}>×</button>
        </div>
      )}
    </article>
  )
}
