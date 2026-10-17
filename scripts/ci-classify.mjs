// 変更されたファイルの一覧から、CI で何を実行するかを決める(Issue #32、docs/seo/ci-plan.md)。**ローカルの設計・検証用。workflow には、つないでいない**。
//   node scripts/ci-classify.mjs <基準の ref>      例: node scripts/ci-classify.mjs origin/main  (git diff --no-renames <基準>...HEAD の一覧を分類する。**--no-renames が要る**: 移動(rename)は、既定では移動先だけが出て、移動元のコード・ライセンス入力の削除を見落とす)
//   git diff --no-renames --name-only a...b | node scripts/ci-classify.mjs -   (標準入力から読む)
// 安全側の規則: 「文書だけ」と**確定できたときだけ**、テストを省く。ビルドやテストが読むファイル(ライセンス類など)、未知のパス、空の一覧は、すべて、完全な検査にする。
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

// ビルドやテストが、読み取るファイル(文書に見えて、検査の入力になっているもの)
const CONSUMED = new Set(['LICENSE', 'LICENSE-CONTENT.md', 'docs/licenses.md'])
const ROOT_DOCS = new Set(['README.md'])
// 検査(e2e)が、構造を読む草案。変更したら、検査の結果が変わるので、完全な検査にする(読み取る検査を足したら、ここに足す)
const CONSUMED_PREFIX = ['docs/seo/ci-plan-draft/']

/** 1 つのファイルの分類。 'docs' | 'ci' | 'code'(未知のパスも code) */
export function classifyFile(path) {
  const p = path.replace(/\\/g, '/').replace(/^\.\//, '')
  if (p.startsWith('.github/workflows/')) return 'ci'
  if (CONSUMED.has(p) || CONSUMED_PREFIX.some((x) => p.startsWith(x))) return 'code'
  if (p.startsWith('docs/') || p.startsWith('reviews/') || ROOT_DOCS.has(p)) return 'docs'
  return 'code'
}

/**
 * 変更の一覧から、実行の決定を作る。
 *  - 空の一覧(取得に失敗した場合を含む)は、完全な検査(safe default)。
 *  - 文書だけ → fullTests: false(ビルドとテストを省く。公開用の dist は、変わらないので、デプロイも省ける)。
 *  - それ以外 → fullTests: true。workflow の変更は、reason に明示する(検査の仕組み自体が変わるため)。
 */
export function decide(files) {
  const list = files.map((f) => f.trim()).filter(Boolean)
  if (list.length === 0) return { fullTests: true, deploy: true, classes: [], reason: '変更の一覧が空(取得失敗の可能性)のため、完全な検査にする(安全側)' }
  const classes = [...new Set(list.map(classifyFile))].sort()
  if (classes.length === 1 && classes[0] === 'docs') return { fullTests: false, deploy: false, classes, reason: '文書だけの変更(ビルドやテストが読むファイルを含まない)。公開用の成果物は変わらない' }
  return { fullTests: true, deploy: true, classes, reason: classes.includes('ci') ? 'workflow を変更しているため、完全な検査にする(検査の仕組み自体が変わる)' : 'コード・データ・設定、または検査が読むファイルを含むため、完全な検査にする' }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const arg = process.argv[2]
  let out = ''
  if (arg === '-') out = (await new Promise((r) => { let d = ''; process.stdin.on('data', (c) => (d += c)); process.stdin.on('end', () => r(d)) }))
  else if (arg) out = execFileSync('git', ['diff', '--no-renames', '--name-only', `${arg}...HEAD`], { encoding: 'utf8' })
  else { console.error('使い方: node scripts/ci-classify.mjs <基準の ref> | -'); process.exit(2) }
  const r = decide(out.split('\n'))
  console.log(JSON.stringify(r, null, 2))
}
