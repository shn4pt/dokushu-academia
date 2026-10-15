// 公開文書(ライセンス・資料の扱い・更新記録・誤りの報告先)の、画面案(ローカル専用。Issue #24、docs/seo/public-docs.md)。
// 本番のアプリ・ルート・リンク・教材・出典・確認日・ライセンスは変更しない。出力は dist-public-docs-mock/(`.gitignore` 対象)。
//   npm run build:public-docs-mock
// 内容の唯一の元は、LICENSE-CONTENT.md・docs/licenses.md・LICENSE(読み取るだけ。転記しない)。ページの末尾に、元ファイルと SHA-256 を示す。
// 更新記録の例は、src/data/lesson-sources.json の人が書いた記録(changes)から作る。コミットの題名は、出さない(非公開の開発の履歴を、公開しない)。
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { marked } from 'marked'

const OUT = process.env.OUT_DIR ?? 'dist-public-docs-mock'
const rel = relative(resolve('dist'), resolve(OUT))
if (rel === '' || (rel !== '..' && !rel.startsWith('..' + sep) && !isAbsolute(rel))) {
  console.error('本番のハッシュ版の出力先(dist)には、出せません。OUT_DIR を変えてください。')
  process.exit(1)
}
rmSync(OUT, { recursive: true, force: true })
const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const sha = (buf) => createHash('sha256').update(buf).digest('hex')
const read = (p) => readFileSync(p)

const css = `:root{--bg:#fff;--fg:#1b1f24;--muted:#57606a;--accent:#1558b0;--line:#d0d7de;--note:#eef4ff}
@media (prefers-color-scheme:dark){:root{--bg:#14171b;--fg:#e6e9ec;--muted:#9aa4af;--accent:#7ab0ff;--line:#353b42;--note:#1d2733}}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.75 system-ui,-apple-system,"Hiragino Sans","Noto Sans JP",sans-serif}
header,main,footer{max-width:46rem;margin:0 auto;padding:0 16px}
header{padding-top:.75rem;padding-bottom:.5rem;border-bottom:1px solid var(--line)}
header strong{display:block}header nav{display:flex;flex-wrap:wrap;gap:.25rem 1rem;font-size:.95rem}
a{color:var(--accent)}h1{font-size:1.45rem;line-height:1.35}h2{font-size:1.15rem;margin-top:1.8rem}
.mock{background:#fff4d6;color:#5b4200;padding:.5rem .75rem;border-radius:6px;font-size:.9rem;margin:.75rem 0}
.src{color:var(--muted);font-size:.85rem;border-top:1px solid var(--line);margin-top:2rem;padding-top:.75rem;overflow-wrap:anywhere}
table{border-collapse:collapse;display:block;overflow-x:auto;font-size:.9rem}th,td{border:1px solid var(--line);padding:.3rem .5rem;vertical-align:top}
pre{overflow-x:auto;background:var(--note);padding:.75rem;border-radius:6px;font-size:.8rem}
code{overflow-wrap:anywhere}.card{border:1px solid var(--line);border-radius:8px;padding:.5rem 1rem;margin:1rem 0}
.pill{display:inline-block;border:1px solid var(--line);border-radius:999px;padding:0 .6rem;font-size:.85rem}.muted{color:var(--muted)}
ul.plain{padding-left:1.1rem}`

const nav = `<header><strong>独習アカデミア <span class="muted">(画面案)</span></strong><nav><a href="/licenses/">ライセンス</a><a href="/licenses/materials/">資料の利用条件</a><a href="/sources/">出典と確認の状況</a><a href="/report/">誤りの報告</a></nav></header>`
function page(path, title, body, sourceLine) {
  const dir = path === '' ? OUT : `${OUT}/${path}`
  mkdirSync(dir, { recursive: true })
  writeFileSync(`${dir}/index.html`, `<!doctype html>
<html lang="ja"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'" />
<meta name="robots" content="noindex" /><title>${esc(title)}(画面案)</title><link rel="stylesheet" href="/mock.css" /></head>
<body>${nav}<main><p class="mock" role="note">画面案です(ローカル専用。本番のサイトではありません)。</p>${body}${sourceLine ? `<p class="src">${sourceLine}</p>` : ''}</main></body></html>\n`)
}
mkdirSync(OUT, { recursive: true })
writeFileSync(`${OUT}/mock.css`, css)

const fromFile = (path) => {
  const buf = read(path)
  return { html: marked.parse(buf.toString('utf8')), line: `この内容は、元のファイル <code>${esc(path)}</code>(SHA-256: <code>${sha(buf).slice(0, 16)}…</code>)から、ビルド時に生成しています。転記はしていません。` }
}

// 1. ライセンス(文章: LICENSE-CONTENT.md、コード: LICENSE)
{
  const c = fromFile('LICENSE-CONTENT.md')
  const code = read('LICENSE')
  page('licenses', 'ライセンス', `${c.html}<h2>コードのライセンス(MIT)</h2><pre>${esc(code.toString('utf8'))}</pre>`, `${c.line} コードの部分は、<code>LICENSE</code>(SHA-256: <code>${sha(code).slice(0, 16)}…</code>)。`)
}
// 2. 資料の利用条件(docs/licenses.md)
{
  const m = fromFile('docs/licenses.md')
  page('licenses/materials', '資料のライセンスとこのサイトの扱い', m.html, m.line)
}
// 3. レッスン末尾の更新記録(例: pm-1)。人が書いた記録(changes)だけ。コミットの題名・リンクは出さない
{
  const sources = JSON.parse(read('src/data/lesson-sources.json'))
  const history = JSON.parse(read('src/data/lesson-history.json'))
  const e = sources['pm-1']
  const h = history['pm-1']
  const changes = (e.changes ?? []).map((c) => `<li><span class="muted">${esc(c.date)}</span> ${esc(c.summary)}</li>`).join('')
  page('lesson-note', '更新記録の表示例(PM-1)', `
<h1>レッスン末尾の「出典と更新記録」(表示例: PM-1)</h1>
<div class="card">
<p><strong>出典と更新記録</strong> <span class="pill">一部確認</span> <span class="muted">確認日 ${esc(e.checkedAt)}</span></p>
<p><strong>更新記録</strong></p>
<ul class="plain"><li><span class="muted">${esc(h.created)}</span> 作成</li>${changes}</ul>
<p class="muted">各項目は、人が書いた記録(<code>src/data/lesson-sources.json</code> の <code>changes</code>)です。確認日は、出典を読み直したときだけ更新します。</p>
<p class="muted">ライセンス: <a href="/licenses/">文章 CC BY-SA 4.0・コード MIT</a>。資料ごとの条件: <a href="/licenses/materials/">資料の利用条件</a>。誤りの報告: <a href="/report/">報告のしかた</a></p>
</div>
<h2>この画面案で、変えている点</h2>
<ul>
<li>現在の表示にある、コミットへのリンク(<code>${esc(h.commits[0].hash)}</code> など ${h.commits.length - 1} 件)は、出さない。新しい開発リポジトリが非公開になると、公開の読者には、リンク切れになるため。</li>
<li>コミットの題名(開発の経過の記述)は、出さない。人が書いた更新記録(上の一覧)だけを、公開の記録とする。</li>
<li>フッターの「ライセンスの詳細」と、末尾の「利用条件」のリンクは、サイト内の公開ページ(<code>/licenses/</code>、<code>/licenses/materials/</code>)に向ける。</li>
<li>「誤りの報告」は、サイト内の案内(<code>/report/</code>)に向ける。</li>
</ul>`, '更新記録の例は、<code>src/data/lesson-sources.json</code> と <code>src/data/lesson-history.json</code>(作成日)から、ビルド時に生成する想定です。')
}
// 4. 誤りの報告先(第一案: 旧公開リポジトリの Issues を継続)
page('report', '誤りの報告', `
<h1>誤りの報告</h1>
<p>教材の誤りや、出典・ライセンスの表示の誤りを見つけたら、お知らせください。このサイトは、AI(Claude Code)が執筆しており、誤りを含むことがあります。</p>
<h2>報告のしかた</h2>
<ol>
<li>GitHub のアカウントがある場合は、<a href="https://github.com/shn4pt/dokushu-academia/issues/new">公開の Issues</a>(旧公開リポジトリ。<strong>公開の場所です</strong>)に、次の内容を書いてください。
<ul class="plain"><li>レッスンの番号(例: pm-1)と、ページの URL</li><li>誤りだと思う箇所(引用は、短く)</li><li>理由と、根拠(資料の URL など)</li></ul></li>
<li><strong>個人情報・API キー・非公開の情報は、書かないでください。</strong>公開の Issues は、誰でも読めます。</li>
</ol>
<h2>報告の後の流れ</h2>
<ul>
<li>作者が、公開の Issues を確認します(確認の頻度は、運営の都合で決まり、即時の対応は約束できません)。</li>
<li>確認して、必要なら、教材を直し、新サイトに反映します。直したときは、レッスン末尾の更新記録に残します。</li>
<li>確認の結果は、公開の Issue に、コメントで書きます。</li>
</ul>
<p class="muted">GitHub のアカウントを持たない方のための、別の報告方法は、まだ決まっていません(決まったら、ここに書きます)。</p>`, '')
console.log(`公開文書の画面案(ローカル専用)を ${OUT}/ に出力しました`)
