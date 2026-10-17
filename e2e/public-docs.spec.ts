import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { marked } from 'marked'

// 公開文書の画面案(ローカル専用。Issue #24、docs/seo/public-docs.md)の生成物の検査(ブラウザなし)。
// 画面案は、一時ディレクトリに生成する。本番の dist・アプリ・リンク・出典・確認日・ライセンスには触れない。
const out = join(mkdtempSync(join(tmpdir(), 'public-docs-')), 'out')
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex').slice(0, 16)
const html = (p: string) => readFileSync(join(out, p, 'index.html'), 'utf8')

test.beforeAll(() => {
  const r = spawnSync('node', ['scripts/build-public-docs-mock.mjs'], { env: { ...process.env, OUT_DIR: out }, encoding: 'utf8' })
  expect(r.status, r.stderr).toBe(0)
})

test('内容の唯一の元は元ファイル: 本文は元ファイルから生成され、ページに元ファイルと SHA-256 を示す', () => {
  expect(html('licenses')).toContain(sha('LICENSE-CONTENT.md'))
  expect(html('licenses')).toContain(sha('LICENSE'))
  expect(html('licenses/materials')).toContain(sha('docs/licenses.md'))
  expect(html('licenses')).toContain('CC BY-SA 4.0')
  expect(html('licenses/materials')).toContain('CC BY-NC-SA') // 原典由来の例外・非営利の条件が、そのまま出る
  expect(html('licenses/materials')).toContain('CC BY-NC-ND')
  expect(html('licenses')).toContain('MIT License')
})

test('本文の対応: 元ファイルの変換結果が、生成物の本文にそのまま含まれる(ハッシュの表示だけでは検出できない本文の差を見る)', () => {
  expect(html('licenses')).toContain(marked.parse(readFileSync('LICENSE-CONTENT.md', 'utf8')) as string)
  expect(html('licenses/materials')).toContain(marked.parse(readFileSync('docs/licenses.md', 'utf8')) as string)
  // 本文を 1 文字変えると、一致しない(この検査が、差を検出できること)
  expect(html('licenses')).not.toContain((marked.parse(readFileSync('LICENSE-CONTENT.md', 'utf8')) as string).replace('CC BY-SA 4.0', 'CC BY-SA 9.9'))
})

test('更新記録の例: 人が書いた記録を出し、コミットへのリンク・コミットの題名を出さない', () => {
  const h = html('lesson-note')
  expect(h).toContain('確認日')
  expect(h).toContain('新しく追加した') // changes の記録
  expect(h).not.toMatch(/github\.com\/[^"]*\/commit\//)
  const history = JSON.parse(readFileSync('src/data/lesson-history.json', 'utf8')) as Record<string, { commits: { hash: string; subject: string }[] }>
  for (const c of history['pm-1'].commits) {
    expect(h.includes(`/commit/${c.hash}`), c.hash).toBe(false)
    expect(h.includes(c.subject), c.subject).toBe(false) // 開発の経過の記述は、公開しない
  }
})

test('内部リンクは、画面案のすべてのページ(/sources/ は、本番にある画面のダミー)に解決する。画面案に、本番のリンクの変更はない', () => {
  const pages = ['licenses', 'licenses/materials', 'lesson-note', 'report', 'sources']
  const known = new Set(pages.map((p) => `/${p}/`))
  for (const p of pages) {
    for (const m of html(p).matchAll(/href="(\/[^"]*)"/g)) {
      if (m[1] === '/mock.css') continue
      expect(known.has(m[1]), `${p}: ${m[1]}`).toBe(true)
    }
    expect(existsSync(join(out, p, 'index.html'))).toBe(true)
  }
})

test('報告先: 実在の連絡先(メール・氏名)を創作せず、公開の場である旨と、個人情報を書かない注意を示す', () => {
  const h = html('report')
  expect(h).not.toMatch(/mailto:|[\w.+-]+@[\w-]+\.[\w.]+/)
  expect(h).toContain('公開の場所です')
  expect(h).toContain('個人情報・API キー・非公開の情報は、書かないでください')
  expect(h).toContain('まだ決まっていません')
})

test('出力先の別名(dist)は拒否される', () => {
  for (const o of ['dist', './dist', 'dist/sub']) {
    const r = spawnSync('node', ['scripts/build-public-docs-mock.mjs'], { env: { ...process.env, OUT_DIR: o }, encoding: 'utf8' })
    expect(r.status, o).toBe(1)
  }
})
