import { docs } from 'virtual:public-docs'
import { Link } from '../ui/Link'

// 公開文書(パスの URL 版。Issue #31、docs/seo/public-docs.md)。ライセンス・資料の扱いは、元ファイルから、ビルド時に作る(転記しない)。
// 元ファイルの内容は、そのまま出す(作業経過の整理は、作者が承認した文面ができてから。利用条件・例外・未解決の注意を、落とさない)。
// ページの末尾に、元ファイルと SHA-256 を示す(ハッシュは、目印。本文の一致は、ビルドの検査で、再生成して比べる)。
const SourceLine = ({ path, sha256 }: { path: string; sha256: string }) => (
  <p className="muted source-line" data-source={path} data-sha256={sha256}>
    この内容は、元のファイル <code>{path}</code>(SHA-256: <code>{sha256.slice(0, 16)}…</code>)から、ビルド時に生成しています。
  </p>
)

export function LicensesPage() {
  return (
    <>
      <article className="prose" data-doc="license" dangerouslySetInnerHTML={{ __html: docs.license.html }} />
      <section className="prose">
        <h2>コードのライセンス(MIT)</h2>
        <pre>{docs.code.text}</pre>
      </section>
      <SourceLine {...docs.license} />
      <SourceLine path={docs.code.path} sha256={docs.code.sha256} />
      <p>資料ごとの利用条件は、<Link to="/licenses/materials">資料のライセンスと、このサイトの扱い</Link>にあります。</p>
    </>
  )
}

export function MaterialsPage() {
  return (
    <>
      <article className="prose materials" data-doc="materials" dangerouslySetInnerHTML={{ __html: docs.materials.html }} />
      <SourceLine {...docs.materials} />
      <p>文章とコードのライセンスは、<Link to="/licenses">ライセンス</Link>にあります。</p>
    </>
  )
}

const ISSUES_NEW = 'https://github.com/shn4pt/dokushu-academia/issues/new'

export function ReportPage() {
  return (
    <>
      <h1>誤りの報告</h1>
      <p>教材の誤りや、出典・ライセンスの表示の誤りを見つけたら、お知らせください。このサイトは、AI(Claude Code)が執筆しており、誤りを含むことがあります。</p>
      <h2>報告のしかた</h2>
      <ol>
        <li>
          GitHub のアカウントがある場合は、<a href={ISSUES_NEW} target="_blank" rel="noreferrer">公開の Issues</a>(旧公開リポジトリ。<strong>公開の場所です</strong>)に、次の内容を書いてください。
          <ul className="plain">
            <li>レッスンの番号(例: pm-1)と、ページの URL</li>
            <li>誤りだと思う箇所(引用は、短く)</li>
            <li>理由と、根拠(資料の URL など)</li>
          </ul>
        </li>
        <li><strong>個人情報・API キー・非公開の情報は、書かないでください。</strong>公開の Issues は、誰でも読めます。保存データ(進捗のファイルなど)も、添付しないでください。</li>
      </ol>
      <h2>報告の後の流れ</h2>
      <ul>
        <li>作者が、公開の Issues を確認します。確認の頻度は、運営の都合で決まり、即時の対応は約束できません。</li>
        <li>確認して、必要なら、教材を直し、新サイトに反映します。直したときは、レッスン末尾の更新記録に残します。</li>
        <li>確認の結果は、公開の Issue に、コメントで書きます。</li>
      </ul>
      <p className="muted">GitHub のアカウントを持たない方のための、別の報告方法は、まだ決まっていません(決まったら、ここに書きます)。</p>
    </>
  )
}
