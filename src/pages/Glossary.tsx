import { useState } from 'react'
import { Link } from 'react-router-dom'
import { glossary } from '../data/glossary'

export default function Glossary() {
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const items = glossary.filter((t) =>
    [t.term, t.reading ?? '', t.description].some((s) => s.toLowerCase().includes(needle)),
  )
  return (
    <>
      <h1>用語集</h1>
      <input
        className="text-input"
        placeholder="用語を検索"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="用語を検索"
      />
      <dl className="glossary">
        {items.map((t) => (
          <div key={t.term} className="card">
            <dt>
              {t.term}
              {t.reading && <span className="muted"> ({t.reading})</span>}
            </dt>
            <dd>
              {t.description}
              {t.lessonId && <> <Link to={`/lesson/${t.lessonId}`}>関連レッスン →</Link></>}
            </dd>
          </div>
        ))}
      </dl>
      {items.length === 0 && <p className="muted">該当する用語がありません。</p>}
    </>
  )
}
