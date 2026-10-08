import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { findLesson } from '../data/curriculum'
import { progressActions, useProgress } from '../progress'
import { GRADUATE_STREAK, SESSION_SIZE, bankEntries, isDue, shuffle, useBank, useDueKeys, type BankEntry } from '../review'

type Item = BankEntry & { choices: { text: string; correct: boolean }[] }
type Session = {
  mode: 'review' | 'practice'
  items: Item[]
  index: number
  picked: (number | null)[]
  revealed: boolean
  dueAtStart: Set<string>
}

// 選択肢をシャッフルして出題する(位置で正解を覚えてしまわないように)
const toItem = (e: BankEntry): Item => ({
  ...e,
  choices: shuffle(e.q.choices.map((text, i) => ({ text, correct: i === e.q.answer }))),
})

const lessonLabel = (id: string) => {
  const l = findLesson(id)
  return l ? `${l.id} ${l.title}` : id
}

export default function ReviewPage() {
  const p = useProgress()
  const { bank, failed } = useBank()
  const [session, setSession] = useState<Session | null>(null)

  const entries = useMemo(() => (bank ? bankEntries(bank) : []), [bank])
  const byKey = useMemo(() => new Map(entries.map((e) => [e.key, e])), [entries])
  const due = useDueKeys()
  const practicePool = useMemo(() => entries.filter((e) => p.completed[e.lessonId]), [entries, p.completed])

  function start(mode: 'review' | 'practice') {
    const chosen =
      mode === 'review'
        ? due.slice(0, SESSION_SIZE).map((k) => byKey.get(k)!)
        : shuffle(practicePool).slice(0, SESSION_SIZE)
    if (chosen.length === 0) return
    setSession({
      mode,
      items: chosen.map(toItem),
      index: 0,
      picked: chosen.map(() => null),
      revealed: false,
      dueAtStart: new Set(due),
    })
  }

  if (failed) return <p className="notice">問題データを読み込めませんでした。ページを再読み込みしてください。</p>
  if (!bank) return <><h1>復習</h1><p className="muted">読み込み中…</p></>

  if (session && session.index < session.items.length) {
    const item = session.items[session.index]
    const picked = session.picked[session.index]
    const correctIndex = item.choices.findIndex((c) => c.correct)
    const isLast = session.index === session.items.length - 1

    const reveal = () => {
      if (picked === null) return
      progressActions.recordAnswers([{ key: item.key, correct: picked === correctIndex }])
      setSession({ ...session, revealed: true })
    }
    const next = () => setSession({ ...session, index: session.index + 1, revealed: false })

    return (
      <>
        <h1>{session.mode === 'review' ? '復習' : 'ランダム練習'}</h1>
        <ProgressDots total={session.items.length} index={session.index} />
        <section className="card quiz">
          <p className="muted">
            {session.index + 1} / {session.items.length} 問目 ・ {lessonLabel(item.lessonId)}
          </p>
          <fieldset disabled={session.revealed}>
            <legend>{item.q.question}</legend>
            {item.choices.map((c, ci) => {
              const isAnswer = session.revealed && c.correct
              const isWrong = session.revealed && picked === ci && !c.correct
              return (
                <label key={ci} className={isAnswer ? 'correct' : isWrong ? 'wrong' : ''}>
                  <input
                    type="radio"
                    name="review-choice"
                    checked={picked === ci}
                    onChange={() => setSession({ ...session, picked: session.picked.map((v, i) => (i === session.index ? ci : v)) })}
                  />
                  {c.text}
                </label>
              )
            })}
          </fieldset>
          {session.revealed && (
            <div role="status">
              <p><strong>{picked === correctIndex ? '正解です' : '不正解です'}</strong></p>
              <p className="muted">{item.q.explanation}</p>
              <a href={`#/lesson/${item.lessonId}`} target="_blank" rel="noreferrer">レッスンの解説を読む(新しいタブ)</a>
            </div>
          )}
          <div className="row">
            {!session.revealed ? (
              <button onClick={reveal} disabled={picked === null}>答え合わせ</button>
            ) : (
              <button onClick={next}>{isLast ? '結果を見る' : '次の問題へ'}</button>
            )}
            <button className="secondary" onClick={() => setSession(null)}>やめる</button>
          </div>
        </section>
      </>
    )
  }

  if (session) {
    const results = session.items.map((it, i) => ({ it, ok: session.picked[i] === it.choices.findIndex((c) => c.correct) }))
    const score = results.filter((r) => r.ok).length
    const graduated = session.items.filter((it) => session.dueAtStart.has(it.key) && !isDue(p.questions[it.key]))
    const missed = results.filter((r) => !r.ok)
    return (
      <>
        <h1>結果</h1>
        <section className="card">
          <p><strong>{score} / {session.items.length} 問正解</strong></p>
          {session.mode === 'review' && <p>復習リストから卒業した問題: <strong>{graduated.length}</strong> 問</p>}
          {missed.length > 0 ? (
            <>
              <p className="muted">間違えた問題は、復習リストに残ります。解説を読み直してみましょう。</p>
              <ul className="plain">
                {missed.map(({ it }) => (
                  <li key={it.key}>
                    {it.q.question} <Link to={`/lesson/${it.lessonId}`}>{lessonLabel(it.lessonId)} →</Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="muted">全問正解です。</p>
          )}
          <div className="row">
            <button onClick={() => setSession(null)}>復習のトップへ</button>
          </div>
        </section>
      </>
    )
  }

  // メニュー
  return (
    <>
      <h1>復習</h1>
      <p className="lead">
        クイズで間違えた問題を、あとでまとめて解き直せます。復習で {GRADUATE_STREAK} 回連続で正解すると、その問題は復習リストから外れます。
      </p>

      <section className="card">
        <div className="row between">
          <strong>復習が必要な問題: {due.length} 問</strong>
          <button onClick={() => start('review')} disabled={due.length === 0}>
            復習を始める{due.length > SESSION_SIZE ? `(${SESSION_SIZE}問ずつ)` : ''}
          </button>
        </div>
        {due.length === 0 ? (
          <p className="muted">いまは復習が必要な問題はありません。レッスンのクイズで間違えた問題が、ここに溜まります。</p>
        ) : (
          <ul className="plain due-list">
            {due.map((k) => {
              const e = byKey.get(k)!
              const st = p.questions[k]
              return (
                <li key={k}>
                  <div>{e.q.question}</div>
                  <div className="muted">
                    <Link to={`/lesson/${e.lessonId}`}>{lessonLabel(e.lessonId)}</Link>
                    {' ・ '}間違えた回数 {st.wrong}{st.streak > 0 && ` ・ 連続正解 ${st.streak}/${GRADUATE_STREAK}`}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="card">
        <div className="row between">
          <span>
            <strong>ランダム練習</strong>
            <span className="muted block">完了にしたレッスンの問題から、{SESSION_SIZE}問を出題します。</span>
          </span>
          <button className="secondary" onClick={() => start('practice')} disabled={practicePool.length === 0}>
            練習する
          </button>
        </div>
        {practicePool.length === 0 && <p className="muted">レッスンを「完了」にすると、練習できるようになります。</p>}
      </section>
    </>
  )
}

function ProgressDots({ total, index }: { total: number; index: number }) {
  return (
    <div className="dots" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i < index ? 'on' : i === index ? 'now' : ''} />
      ))}
    </div>
  )
}

