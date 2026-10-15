import { Link } from './Link'
import { howLabel, historyFor, REPO, sourcesFor, statusHelp, statusLabel } from '../sources'
import { licenseNotes } from '../license'

/** レッスン末尾の「出典と更新記録」。見出し(h3)は、しおりの位置の記録に使われるので、ここでは使わない。 */
export default function SourceNote({ lessonId }: { lessonId: string }) {
  const s = sourcesFor(lessonId)
  const h = historyFor(lessonId)
  const lic = licenseNotes(s.sources)
  const nonCommercial = lic.share.some((x) => x.license.includes('-NC-'))
  const links = (list: typeof lic.share) => list.map((x, i) => (
    <span key={x.name + x.license}>{i > 0 && '、'}『{x.name}』(<a href={x.url} target="_blank" rel="noreferrer">{x.license}</a>)</span>
  ))
  return (
    <>
    {(lic.share.length > 0 || lic.noDerivs.length > 0 || lic.attribution.length > 0) && (
      <div className="license-note muted" data-testid="license-note">
        <strong>利用条件・出典の表示</strong>
        {lic.share.length > 0 && (
          <p>
            この講座の本文は、{links(lic.share)}を、日本語に訳し、要約・再構成した部分を含みます。その部分は、資料と同じ条件(継承)で提供します。
            {nonCommercial && '非営利の目的に限ります(このサイトは、広告も課金もありません)。'}
            出典を示し、変更を示し、同じ条件で共有してください。原文の著者が、この講座を推奨しているわけではありません。
          </p>
        )}
        {lic.noDerivs.length > 0 && (
          <p>{links(lic.noDerivs)}は、内容の要約と短い引用にとどめています。原文を改変した版を配るものではありません。</p>
        )}
        {lic.attribution.length > 0 && (
          <p>出典:{links(lic.attribution)}。日本語で要約・再構成しています(原文のままではありません)。</p>
        )}
        <p>この扱いの方針は、<a href={`${REPO}/blob/main/docs/licenses.md`} target="_blank" rel="noreferrer">docs/licenses.md</a> にあります。</p>
      </div>
    )}
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
    </>
  )
}
