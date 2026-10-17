import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { marked } from 'marked'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// 本番ビルドにだけ付ける Content Security Policy。
// 学習用に API キーをブラウザで扱うため、通信先を自サイトと Claude API に限定する。
const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'", // KaTeX の数式が style 属性を使う
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.anthropic.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ')

// パスの URL 版(試作。Issue #15): VITE_SITE_MODE=path のときだけ、ベースと出力先を切り替える。
// 通常のビルド(本番のハッシュ版)は、base './'、出力先 dist のまま。
const pathMode = process.env.VITE_SITE_MODE === 'path'

// 公開文書(パスの URL 版。Issue #31、docs/seo/public-docs.md): ライセンス・資料の扱いを、**元ファイルから、ビルド時に**作る(転記しない)。
//  - 仮想モジュール `virtual:public-docs`: 元ファイル(LICENSE-CONTENT.md・docs/licenses.md・LICENSE)の本文(Markdown → HTML)と SHA-256。
//  - `src/data/lesson-history.json` の読み込みを、公開用の内容(作成日だけ。コミットのハッシュ・題名を含まない)に差し替える。
//    非公開のコミットの題名・ハッシュが、公開の配布物(HTML・JavaScript)に入らないようにするため。ハッシュ版(本番)は、従来のまま。
const sha = (buf: Buffer) => createHash('sha256').update(buf).digest('hex')
function publicDocs(): Plugin {
  const VIRTUAL = 'virtual:public-docs'
  const RESOLVED = '\0' + VIRTUAL
  return {
    name: 'public-docs',
    resolveId: (id) => (id === VIRTUAL ? RESOLVED : null),
    load(id) {
      if (id === RESOLVED) {
        const doc = (path: string) => {
          const buf = readFileSync(path)
          return { path, sha256: sha(buf), html: marked.parse(buf.toString('utf8')) as string }
        }
        const code = readFileSync('LICENSE')
        return `export const docs = ${JSON.stringify({ license: doc('LICENSE-CONTENT.md'), materials: doc('docs/licenses.md'), code: { path: 'LICENSE', sha256: sha(code), text: code.toString('utf8') } })}`
      }
      if (pathMode && id.replace(/\\/g, '/').endsWith('/src/data/lesson-history.json')) {
        const full = JSON.parse(readFileSync(id, 'utf8')) as Record<string, { created: string }>
        const pub = Object.fromEntries(Object.entries(full).map(([k, v]) => [k, { created: v.created, commits: [] }]))
        return JSON.stringify(pub) // .json のまま(JSON の文字列を返す。vite の JSON 処理が、これを読む)
      }
      return null
    },
  }
}

export default defineConfig({
  base: pathMode ? (process.env.SITE_BASE ?? '/dokushu-academia/') : './',
  build: pathMode ? { outDir: process.env.OUT_DIR ?? 'dist-path' } : {},
  plugins: [
    react(),
    publicDocs(),
    {
      name: 'content-security-policy',
      apply: 'build',
      transformIndexHtml: (html) =>
        html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`),
    },
  ],
})
