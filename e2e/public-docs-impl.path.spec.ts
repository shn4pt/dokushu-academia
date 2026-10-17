import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { marked } from 'marked'
import { expect, test } from './fixtures'

// 公開文書と、公開用の更新記録(パスの URL 版。Issue #31、docs/seo/public-docs.md)の検査。
// 前提: `npm run build:path`(dist-path/、ベース /dokushu-academia/)と `npm run build:path:root`(dist-path-root/、ベース /)。
const B = '/dokushu-academia'
const ROOT = 'http://localhost:4175'
const read = (p: string) => readFileSync(p, 'utf8')
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })

const DOCS = [
  { route: 'licenses', file: 'LICENSE-CONTENT.md', marker: 'data-doc="license"' },
  { route: 'licenses/materials', file: 'docs/licenses.md', marker: 'data-doc="materials"' },
]

test.describe('公開文書は、元ファイルから生成される(ベース 2 種類)', () => {
  for (const [label, origin] of [['プロジェクト配下', `http://localhost:4174${B}`], ['ルート配下', ROOT]] as const) {
    for (const d of DOCS) {
      test(`${label} /${d.route}/: 元ファイルの変換結果が、本文にそのまま含まれ、SHA-256 の目印が元ファイルと一致する(初期 HTML。JS なし)`, async ({ request }) => {
        const html = await (await request.get(`${origin}/${d.route}/`)).text()
        expect(html).toContain(marked.parse(read(d.file)) as string) // ハッシュの表示だけでなく、本文の対応を見る
        expect(html).toContain(`data-source="${d.file}" data-sha256="${sha(d.file)}"`)
        expect(html).toContain(d.marker)
      })
    }
    test(`${label} /licenses/: コードのライセンス(MIT)も、元ファイル LICENSE から生成される`, async ({ request }) => {
      const html = await (await request.get(`${origin}/licenses/`)).text()
      expect(html).toContain('MIT License')
      expect(html).toContain(`data-source="LICENSE" data-sha256="${sha('LICENSE')}"`)
    })
  }

  test('元の文書は、変更されていない(原文のまま。利用条件・例外・限界・未解決の注意を、落とさない)', async ({ request }) => {
    const html = await (await request.get(`http://localhost:4174${B}/licenses/materials/`)).text()
    for (const must of ['CC BY-NC-SA', 'CC BY-NC-ND', '残っている確認', '非営利の目的に限る', 'このサイトは、広告も課金もない(2026-10-12 時点)']) {
      expect(html, must).toContain(must)
    }
    const lic = await (await request.get(`http://localhost:4174${B}/licenses/`)).text()
    expect(lic).toContain('CC BY-SA 4.0')
    expect(lic).toContain('https://shn4pt.github.io/dokushu-academia/') // 帰属表示の URL は、元ファイルのまま(変更は、作者の判断と別の承認)
  })

  test('JS 無効のブラウザでも、ライセンス・資料の扱い・報告先が読める', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto(`http://localhost:4174${B}/licenses/`)
    await expect(page.locator('h1').first()).toContainText('講座の文章のライセンス')
    await page.goto(`http://localhost:4174${B}/licenses/materials/`)
    expect(await page.locator('main').innerText()).toContain('CC BY-NC-SA')
    await page.goto(`http://localhost:4174${B}/report/`)
    await expect(page.locator('h1')).toContainText('誤りの報告')
    await context.close()
  })
})

// 履歴の漏えいの検出(題名・ハッシュ)。ブラウザなしの純粋な関数にして、ダミーの入力で、検出できることを確かめる
const findHistoryLeaks = (text: string, subjects: string[], hashes: string[]) => {
  const found: string[] = []
  for (const s of subjects) if (text.includes(s)) { found.push(`題名「${s.slice(0, 30)}」`); break }
  for (const h of hashes) if (new RegExp(`(?<![0-9a-f])${h}(?![0-9a-f])`).test(text)) { found.push(`ハッシュ ${h}`); break }
  return found
}

// 公開の配布物に、題名と同じ文が、すでに公開の本文として含まれる、既知の一致(場所と理由つき)。**これ以外の一致は、除外しない**(短い題名も、除外しない)
const KNOWN_PUBLIC_COINCIDENCES = [
  { subject: '原典との照合に基づき、レッスンの記述を修正', file: 'src/lessons/CaseStudy.tsx', reason: 'ケーススタディの公開の本文に、同じ文が書かれている(コミットの題名の公開ではない)' },
]

test.describe('公開の配布物に、非公開のコミットの情報を入れない', () => {
  type History = Record<string, { created: string; commits: { hash: string; subject: string }[] }>
  const history = JSON.parse(read('src/data/lesson-history.json')) as History
  const commits = Object.values(history).flatMap((h) => h.commits)
  const allowed = new Set(KNOWN_PUBLIC_COINCIDENCES.map((k) => k.subject))
  const subjects = [...new Set(commits.map((c) => c.subject))].filter((s) => !allowed.has(s)) // 短い題名も含める
  const hashes = [...new Set(commits.map((c) => c.hash))]
  // 出典の記録(lesson-sources.json)に、もともと書かれているリポジトリへのリンク(blob は完全一致のみ許す)
  const recordedBlobLinks = new Set(read('src/data/lesson-sources.json').match(/https:\/\/github\.com\/shn4pt\/dokushu-academia\/blob\/[^"\s]+/g) ?? [])

  test('検出の自己検査: ダミーの題名(短いものを含む)・ハッシュを、検出できる。除外は、既知の一致(場所と理由つき)だけ', () => {
    expect(findHistoryLeaks('....ダミーの題名ABC....', ['ダミーの題名ABC'], [])).toHaveLength(1)
    expect(findHistoryLeaks('a fix b', ['fix'], [])).toHaveLength(1) // 短い題名も、黙って除外しない
    expect(findHistoryLeaks('x abcdef1 y', [], ['abcdef1'])).toHaveLength(1)
    expect(findHistoryLeaks('x abcdef12 y', [], ['abcdef1'])).toHaveLength(0) // 16 進数の一部は、ハッシュとは扱わない(誤検出を避ける)
    // 既知の一致は、実在し、場所が正しい(古くなった・不正な除外を、許さない)
    for (const k of KNOWN_PUBLIC_COINCIDENCES) {
      expect(read(k.file), k.file).toContain(k.subject)
      expect(commits.some((c) => c.subject === k.subject), k.subject).toBe(true)
      expect(k.reason.length).toBeGreaterThan(10)
    }
    // 未公開の実装・コメント・設定の中にあるだけの文は、除外されない(除外は、上の一覧だけ)
    expect(subjects.includes('原典との照合に基づき、レッスンの記述を修正')).toBe(false)
    expect(subjects.length).toBeGreaterThan(50)
  })

  for (const dir of ['dist-path', 'dist-path-root']) {
    test(`${dir}: HTML・JavaScript・JSON のどこにも、コミットの題名・ハッシュ・コミットへのリンクがない`, () => {
      const files = walk(dir).filter((f) => /\.(html|js|json|css|xml|txt)$/.test(f))
      expect(files.length).toBeGreaterThan(100)
      const offenders: string[] = []
      for (const f of files) {
        const text = read(f)
        if (/github\.com\/shn4pt\/dokushu-academia\/commit\//.test(text)) offenders.push(`${f}: コミットへのリンク`)
        for (const m of text.match(/https?:\/\/github\.com\/shn4pt\/dokushu-academia\/blob\/[^"'\s)`<\\]+/g) ?? []) {
          if (!recordedBlobLinks.has(m)) offenders.push(`${f}: 記録にないリポジトリのファイルへのリンク ${m}`)
        }
        for (const l of findHistoryLeaks(text, subjects, hashes)) offenders.push(`${f}: ${l}`)
      }
      expect(offenders).toEqual([])
    })

    test(`${dir}: 公開用の履歴データは、作成日だけ(コミットの一覧が空)。全 172 レッスン分が、作成日として残る`, () => {
      const js = walk(dir).filter((f) => f.endsWith('.js')).map(read).join('\n')
      expect(js.match(/created:\s*["'`]\d{4}-\d{2}-\d{2}["'`]\s*,\s*commits:\s*\[\s*\]/g)?.length ?? 0).toBe(Object.keys(history).length)
      expect(js).not.toMatch(/commits:\s*\[\s*\{/) // 空でないコミットの一覧が、ない
      expect(js).not.toMatch(/\bsubject:\s*["'`]/) // コミットの題名のキーが、ない
    })
  }

  test('(対照)ハッシュ版の dist には、従来どおり、コミットの題名が含まれる(この検査が、差を検出できること)', () => {
    test.skip(!existsSync('dist'), 'ハッシュ版のビルド(npm run build)がない')
    const text = walk('dist').filter((f) => f.endsWith('.js')).map(read).join('\n')
    expect(subjects.some((s) => text.includes(s))).toBe(true)
  })

  test('作成日は、公開データとして残る(更新記録の「作成」が出る)。出典の記録の changes も出る', async ({ request }) => {
    const html = await (await request.get(`http://localhost:4174${B}/lesson/pm-1/`)).text()
    expect(html).toContain('2026-10-10')
    expect(html).toContain('作成')
    expect(html).toContain('新しく追加した')
    expect(html).not.toContain('そのほかのコミット')
  })
})

test.describe('リンクの置き換え(サイト内の公開ページへ)', () => {
  test('フッターのライセンス・レッスン末尾の利用条件・出典ページの報告先は、サイト内のページへ向く(リポジトリへのリンクは、報告先の 1 か所だけ)', async ({ request }) => {
    const catalog = await (await request.get(`http://localhost:4174${B}/catalog/`)).text()
    expect(catalog).toContain(`href="${B}/licenses/"`)
    expect(catalog).not.toContain('blob/main/LICENSE-CONTENT.md')
    const lesson = await (await request.get(`http://localhost:4174${B}/lesson/pm-1/`)).text()
    expect(lesson).toContain(`href="${B}/licenses/materials/"`)
    expect(lesson).not.toContain('blob/main/docs/licenses.md')
    const sources = await (await request.get(`http://localhost:4174${B}/sources/`)).text()
    expect(sources).toContain(`href="${B}/report/"`)
    expect(sources).not.toContain('github.com/shn4pt/dokushu-academia/issues"')
    const report = await (await request.get(`http://localhost:4174${B}/report/`)).text()
    expect(report).toContain('https://github.com/shn4pt/dokushu-academia/issues/new')
    for (const [name, html] of [['catalog', catalog], ['lesson', lesson], ['sources', sources]] as const) {
      expect(html.match(/github\.com\/shn4pt\/dokushu-academia/g) ?? [], name).toEqual([])
    }
  })

  test('報告先: 実在の連絡先を創作せず、公開の場である旨と、個人情報・API キー・保存データを書かない注意がある', async ({ request }) => {
    const html = await (await request.get(`http://localhost:4174${B}/report/`)).text()
    expect(html).not.toMatch(/mailto:|[\w.+-]+@[\w-]+\.[\w.]+/)
    expect(html).toContain('公開の場所です')
    expect(html).toContain('個人情報・API キー・非公開の情報は、書かないでください')
    expect(html).toContain('保存データ(進捗のファイルなど)も、添付しないでください')
    expect(html).toContain('まだ決まっていません')
  })

  test('SPA の移動: フッターのリンクで、ライセンスのページへ。タイトル・canonical が替わり、戻れる', async ({ page }) => {
    await page.goto(`${B}/catalog/`)
    await expect(page.locator('html')).toHaveAttribute('data-hydrated', '1')
    await page.evaluate(() => ((window as unknown as { __alive: number }).__alive = 1))
    await page.locator('[data-testid="license-footer"] a').click()
    await expect(page).toHaveURL(`http://localhost:4174${B}/licenses/`)
    await expect(page.locator('h1').first()).toContainText('講座の文章のライセンス')
    expect(await page.title()).toContain('ライセンス')
    expect(await page.evaluate(() => document.querySelector('link[rel="canonical"]')?.getAttribute('href'))).toBe(`https://shn4pt.github.io${B}/licenses/`)
    expect(await page.evaluate(() => (window as unknown as { __alive?: number }).__alive)).toBe(1) // 読み込み直していない
    await page.goBack()
    await expect(page).toHaveURL(`http://localhost:4174${B}/catalog/`)
  })

  test('フォントの幅が違う環境(等幅フォントで、幅が広い場合)でも、390px で、公開文書の 4 ページが横にはみ出さない', async ({ page }) => {
    // CI の環境(フォントが違う)で、長い URL がはみ出した不具合の再発を、ローカルでも検出するための検査
    await page.setViewportSize({ width: 390, height: 900 })
    for (const p of ['licenses', 'licenses/materials', 'report', 'sources']) {
      await page.goto(`${B}/${p}/`)
      await expect(page.locator('html')).toHaveAttribute('data-hydrated', '1')
      await page.addStyleTag({ content: 'main, main * { font-family: Menlo, "Courier New", monospace !important; }' })
      expect(await page.evaluate(() => document.documentElement.scrollWidth), `${p} (等幅)`).toBeLessThanOrEqual(390)
    }
  })

  test('1000px と 390px で、公開文書の 4 ページが、横にはみ出さない', async ({ page }) => {
    for (const w of [1000, 390]) {
      await page.setViewportSize({ width: w, height: 900 })
      for (const p of ['licenses', 'licenses/materials', 'report', 'sources']) {
        await page.goto(`${B}/${p}/`)
        await expect(page.locator('html')).toHaveAttribute('data-hydrated', '1')
        expect(await page.evaluate(() => document.documentElement.scrollWidth), `${p} @${w}`).toBeLessThanOrEqual(w)
      }
    }
  })
})
