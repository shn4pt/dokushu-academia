import { Link } from 'react-router-dom'
import CourseLinks from '../ui/CourseLinks'
import { courses, evidenceInfo, groups, isAvailable, layers, prerequisites } from '../data/catalog'

export default function MapPage() {
  const open = courses.filter(isAvailable).length
  const withPrereq = courses.filter((c) => c.requires?.length)
  return (
    <>
      <p className="crumb"><Link to="/catalog">講座一覧</Link> / 地図</p>
      <h1>このサービスの地図</h1>
      <p className="lead">
        {courses.length} の講座が、どうつながり、なぜこの並びになっているかを、1枚で見ます。いま本文があるのは {open} 講座で、残りは目次の案です。
      </p>
      <p className="notice" role="note">
        <strong>このサービス独自の整理です。</strong>
        領域の分け方は、大学の学部の区分を参考にしましたが、特定の分類表に照らして作ったものではありません。
        「先に学ぶとよい講座」も、学ぶ順序の提案で、必須の条件ではありません。ほかの整理の仕方もあります。
      </p>

      <h2>全体図</h2>
      <p className="muted">下の層が土台で、上に進むほど、学んだことを組み合わせて使います。講座の名前から、目次に移れます。</p>
      <div className="map" role="group" aria-label="領域と講座の全体図">
        {[...layers].reverse().map((layer) => (
          <section key={layer.id} className={`map-layer map-${layer.id}`} aria-labelledby={`layer-${layer.id}`}>
            <h3 id={`layer-${layer.id}`}>{layer.title}<span className="muted"> ・ {layer.note}</span></h3>
            <div className="map-groups">
              {layer.groupIds.map((gid) => {
                const g = groups.find((x) => x.id === gid)
                return (
                  <div key={gid} className="map-group">
                    <strong>{g?.title}</strong>
                    <ul className="plain">
                      {courses.filter((c) => c.group === gid).map((c) => (
                        <li key={c.id}>
                          <Link to={`/course/${c.id}`} className={isAvailable(c) ? 'chip chip-open' : 'chip'}>{c.title}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>
      <p className="muted">太い枠の講座は、本文がある(公開中)講座です。</p>

      <h2>なぜ、この構成なのか</h2>
      <ul>
        <li><strong>学問のまとまりで分ける</strong>:領域は、大学の学部の区分を参考にしました。基礎論(学問)から応用(実務)へ、道筋をつなぎやすくするためです。たとえば、経済学(あとから追加予定)のような基礎論から、経営・戦略のような応用へ、領域をまたいで進めます。</li>
        <li><strong>土台に「学び方」を置く</strong>:根拠の読み方を最初に学ぶと、このサービスの根拠の表示の意味が分かり、どの講座の記述も、自分で確かめながら読めます。</li>
        <li><strong>実践を別の層にする</strong>:プロダクトマネジメントは、特定の学問ではなく、複数の領域を統合する実務です。学問の領域の上に置いて、「学んだことをどう組み合わせるか」を扱います。</li>
        <li><strong>根拠の基準は、領域によって変える</strong>:実証・論文が根拠になる領域と、教科書や事例が根拠になる領域、条文や基準そのものが根拠になる領域があります。講座ごとに、基準を目次に示します。</li>
        <li><strong>法令は「全体像と考え方」に限る</strong>:法令や基準は変わり、個別の判断は専門家に確認すべきなので、条文と確認した日を示し、個別の事案は扱いません。</li>
      </ul>

      <h2>先に学ぶとよい講座</h2>
      <table className="calc text">
        <thead><tr><th>講座</th><th>先に学ぶとよい講座</th></tr></thead>
        <tbody>
          {withPrereq.map((c) => (
            <tr key={c.id}>
              <td><Link className="rel-link" to={`/course/${c.id}`}>{c.title}</Link></td>
              <td><CourseLinks list={prerequisites(c)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted">表にない講座は、ほかの講座を先に学ばなくても、読み始められます。</p>

      <h2>根拠の表示の読み方</h2>
      <table className="calc text">
        <thead><tr><th>根拠の種類</th><th>何を根拠にするか</th><th>注意</th></tr></thead>
        <tbody>
          {Object.values(evidenceInfo).map((e) => (
            <tr key={e.label}><td>{e.label}</td><td>{e.basis}</td><td>{e.note}</td></tr>
          ))}
        </tbody>
      </table>
      <p>
        レッスンごとに、出典と確認の程度(原文を読んで確認、一部を確認、このサービス独自の整理、未確認)を公開しています。<Link to="/sources">出典と確認の状況</Link>で、一覧を見られます。
      </p>

      <h2>読み方の2通り</h2>
      <ul>
        <li><strong>隙間時間に1レッスンずつ</strong>:1レッスンは、短く読み切れる単位です。進捗が残るので、続きから再開できます。</li>
        <li><strong>体系を順にじっくり</strong>:講座の目次を、基礎 → 実践 → 応用の順にたどります。上の「先に学ぶとよい講座」を参考にします。</li>
      </ul>
    </>
  )
}
