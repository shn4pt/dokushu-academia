import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { findLesson, findStage } from '../data/curriculum'
import { glossary } from '../data/glossary'
import { norm, parseTerms, search, type Section } from '../search'

const suggestions = ['softmax', 'KVキャッシュ', '勾配', 'attention', '損失', 'RAG', 'temperature', '過学習']

function Highlight({ text, terms }: { text: string; terms: string[] }) {
  // 検索語は正規化済みなので、同じ正規化を通した文字列で位置を求め、元の文字列を切り出す
  const normalized = norm(text)
  if (normalized.length !== text.length) return <>{text}</>
  const ranges: [number, number][] = []
  for (const term of terms) {
    for (let i = normalized.indexOf(term); i !== -1; i = normalized.indexOf(term, i + term.length)) {
      ranges.push([i, i + term.length])
    }
  }
  ranges.sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = []
  for (const r of ranges) {
    const last = merged[merged.length - 1]
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1])
    else merged.push([...r])
  }
  const out: React.ReactNode[] = []
  let pos = 0
  merged.forEach(([s, e], i) => {
    out.push(<Fragment key={`t${i}`}>{text.slice(pos, s)}</Fragment>, <mark key={`m${i}`}>{text.slice(s, e)}</mark>)
    pos = e
  })
  out.push(<Fragment key="end">{text.slice(pos)}</Fragment>)
  return <>{out}</>
}

export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const [sections, setSections] = useState<Section[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    import('../data/search-index.json')
      .then((m) => setSections((m.default as { sections: Section[] }).sections))
      .catch(() => setFailed(true))
  }, [])

  const terms = useMemo(() => parseTerms(q), [q])
  const results = useMemo(() => (sections ? search(sections, q) : []), [sections, q])
  const glossaryHits = useMemo(
    () =>
      terms.length === 0
        ? []
        : glossary
            .filter((g) => {
              const hay = norm(`${g.term} ${g.reading ?? ''} ${g.description}`)
              return terms.every((t) => hay.includes(t))
            })
            .slice(0, 5),
    [terms],
  )

  const setQuery = (v: string) => setParams(v ? { q: v } : {}, { replace: true })

  return (
    <>
      <h1>検索</h1>
      <input
        className="text-input"
        type="search"
        enterKeyHint="search"
        // タッチ端末では、開いた直後にキーボードが画面を覆わないよう、自動でフォーカスしない
        autoFocus={!window.matchMedia('(pointer: coarse)').matches}
        value={q}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="キーワードを入力(スペース区切りで AND 検索)"
        aria-label="レッスン内を検索"
      />

      {failed && <p className="notice">検索用のデータを読み込めませんでした。ページを再読み込みしてください。</p>}
      {!sections && !failed && <p className="muted">読み込み中…</p>}

      {sections && terms.length === 0 && (
        <>
          <p className="muted">全28レッスンの本文から検索できます。例:</p>
          <div className="row">
            {suggestions.map((s) => (
              <button key={s} className="secondary" onClick={() => setQuery(s)}>{s}</button>
            ))}
          </div>
        </>
      )}

      {sections && terms.length > 0 && (
        <>
          <p role="status" className="muted">
            {results.length === 0 && glossaryHits.length === 0
              ? `「${q}」に一致するレッスンはありません。別のキーワードや、短い語で試してください。`
              : `${results.length} 件のレッスンで見つかりました`}
          </p>

          {glossaryHits.length > 0 && (
            <section className="card">
              <strong>用語集</strong>
              <ul className="plain">
                {glossaryHits.map((g) => (
                  <li key={g.term}>
                    <strong><Highlight text={g.term} terms={terms} /></strong>
                    {g.reading && <span className="muted"> ({g.reading})</span>}: <Highlight text={g.description} terms={terms} />
                    {g.lessonId && <> <Link to={`/lesson/${g.lessonId}`}>関連レッスン →</Link></>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <ul className="plain">
            {results.map((r) => {
              const lesson = findLesson(r.lessonId)!
              const stage = findStage(lesson.stageId)!
              return (
                <li key={r.lessonId} className="card result">
                  <Link to={`/lesson/${lesson.id}`} className="result-title">
                    {lesson.id} <strong><Highlight text={lesson.title} terms={terms} /></strong>
                  </Link>
                  <span className="muted"> — {stage.title}</span>
                  <ul className="plain">
                    {r.hits.map((h, i) => (
                      <li key={i} className="hit">
                        <Link to={`/lesson/${lesson.id}`} state={h.heading === '概要' ? undefined : { section: h.heading }}>
                          {h.heading === '概要' ? '概要' : <Highlight text={h.heading} terms={terms} />}
                        </Link>
                        <div className="muted"><Highlight text={h.snippet} terms={terms} /></div>
                      </li>
                    ))}
                  </ul>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </>
  )
}
