import { Link } from 'react-router-dom'
import { howLabel, historyFor, REPO, sourcesFor, statusHelp, statusLabel } from '../sources'

/** レッスン末尾の「出典と更新記録」。見出し(h3)は、しおりの位置の記録に使われるので、ここでは使わない。 */
export default function SourceNote({ lessonId }: { lessonId: string }) {
  const s = sourcesFor(lessonId)
  const h = historyFor(lessonId)
  return (
    <details className="source-note">
      <summary>
        出典と更新記録
        <span className={`status-pill ${s.status}`}>{statusLabel[s.status]}</span>
        {s.checkedAt && <span className="muted"> 確認日 {s.checkedAt}</span>}
      </summary>
      <p className="muted">{statusHelp[s.status]}</p>
      {s.note && <p>{s.note}</p>}
      {s.versions && <p><strong>確認した版:</strong>{s.versions}</p>}
      {s.sources.length > 0 && (
        <>
          <p><strong>参考にした資料</strong></p>
          <ul className="plain">
            {s.sources.map((x) => (
              <li key={x.title}>
                {x.url ? <a href={x.url} target="_blank" rel="noreferrer">{x.title}</a> : x.title}
                <br />
                <span className="muted">{x.use} ／ {howLabel[x.how]}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {(s.changes?.length || h) && (
        <>
          <p><strong>更新記録</strong></p>
          <ul className="plain">
            {h && <li><span className="muted">{h.created}</span> 作成</li>}
            {s.changes?.map((c) => <li key={c.date + c.summary}><span className="muted">{c.date}</span> {c.summary}</li>)}
            {h && h.commits.slice(0, -1).reverse().length > 0 && (
              <li className="muted">
                そのほかのコミット:
                {h.commits.slice(0, -1).map((c) => (
                  <span key={c.hash}> <a href={`${REPO}/commit/${c.hash}`} target="_blank" rel="noreferrer">{c.date} {c.subject}</a>;</span>
                ))}
              </li>
            )}
          </ul>
        </>
      )}
      <p className="muted">このレッスンは AI(Claude Code)が執筆しました。<Link to="/sources">出典と確認の状況の一覧</Link></p>
    </details>
  )
}
