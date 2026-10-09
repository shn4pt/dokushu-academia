import { useState } from 'react'
import { Link } from 'react-router-dom'
import { lessonNo, stageLabel, stages } from '../data/curriculum'
import { isReady } from '../lessons'
import { REPO, sourcesFor, statusHelp, statusLabel, type SourceStatus } from '../sources'

const order: SourceStatus[] = ['verified', 'partial', 'original', 'unverified']

export default function SourcesPage() {
  const [filter, setFilter] = useState<SourceStatus | 'all'>('all')
  const lessons = stages.flatMap((st) => st.lessons.filter((l) => isReady(l.id)).map((l) => ({ st, l, s: sourcesFor(l.id) })))
  const count = (k: SourceStatus) => lessons.filter((x) => x.s.status === k).length
  return (
    <>
      <h1>出典と確認の状況</h1>

      <section className="card">
        <p><strong>このアプリは、AI(Claude Code)が執筆しました。</strong></p>
        <p>
          何を作るか、どの方針にするか、いつ公開するかは、人(依頼者)が決めています。文章とコードは、ほぼすべて AI が書きました。
          AI は、もっともらしい誤りを書くことがあります(8-3)。そのため、内容を原典や公式のドキュメントと照合し、その結果を、レッスンごとに記録しています。
        </p>
        <ul>
          <li>確認した資料、確認日、確認した版を、各レッスンの末尾の「出典と更新記録」に載せています。</li>
          <li>確認が終わっていないレッスンは、隠さず「未確認」と表示します。</li>
          <li>「原典・公式で確認」は、本文の<strong>主な</strong>事実を確かめたという意味で、すべての文が正しいという保証ではありません。誤りを見つけたら、<a href={`${REPO}/issues`} target="_blank" rel="noreferrer">リポジトリ</a>でお知らせください。</li>
          <li>Claude Code や API の仕様は版によって変わります。確認日から時間がたっている場合は、公式の最新の情報を確かめてください。</li>
        </ul>
      </section>

      <h2>確認の状況</h2>
      <dl className="source-legend">
        {order.map((k) => (
          <div key={k}>
            <dt><span className={`status-pill ${k}`}>{statusLabel[k]}</span> {count(k)} レッスン</dt>
            <dd className="muted">{statusHelp[k]}</dd>
          </div>
        ))}
      </dl>

      <label className="row">
        表示:
        <select className="sel-input" value={filter} onChange={(e) => setFilter(e.target.value as SourceStatus | 'all')} aria-label="確認の状況で絞り込む">
          <option value="all">すべて({lessons.length})</option>
          {order.map((k) => <option key={k} value={k}>{statusLabel[k]}({count(k)})</option>)}
        </select>
      </label>

      <ul className="plain source-list">
        {lessons.filter((x) => filter === 'all' || x.s.status === filter).map(({ st, l, s }) => (
          <li key={l.id}>
            <div><Link to={`/lesson/${l.id}`}>{lessonNo(l)} {l.title}</Link> <span className="muted">({stageLabel(st)})</span></div>
            <div className="source-meta">
              <span className={`status-pill ${s.status}`}>{statusLabel[s.status]}</span>
              <span className="muted">確認日 {s.checkedAt ?? '—'}</span>
              <span className="muted">資料 {s.sources.length} 件</span>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
