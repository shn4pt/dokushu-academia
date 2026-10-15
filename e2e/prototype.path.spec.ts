import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import vm from 'node:vm'
import { expect, test } from './fixtures'
import { bank } from './lessons'

// パスの URL 版(試作。Issue #15、docs/seo/plan.md §5)の検査。
// 前提: `npm run build:path`(dist-path/、ベース /dokushu-academia/)と `npm run build:path:root`(dist-path-root/、ベース /)の出力。
// 配信は scripts/serve-static.mjs(GitHub Pages に近い挙動の再現。GitHub Pages 自体の挙動の確認ではない)。
// 文章の全文は固定せず、構造・ステータス・メタ情報・引き継ぎ・進捗の保護を確かめる。

const B = '/dokushu-academia'
const ORIGIN = 'https://shn4pt.github.io'
const ROOT = 'http://localhost:4175' // ルート配下のビルド(ベース /)
const PAGES = [
  { path: `${B}/catalog/`, h1: '講座一覧', canonical: `${ORIGIN}${B}/catalog/` },
  { path: `${B}/course/pm/`, h1: 'プロダクトマネジメント', canonical: `${ORIGIN}${B}/course/pm/` },
  { path: `${B}/lesson/pm-1/`, h1: 'PM の仕事の全体像', canonical: `${ORIGIN}${B}/lesson/pm-1/` },
]

const attr = (html: string, re: RegExp) => re.exec(html)?.[1]
const titleOf = (html: string) => attr(html, /<title>([^<]*)<\/title>/)
const canonicalOf = (html: string) => attr(html, /<link rel="canonical" href="([^"]+)"/)

/** ブラウザ上の head のメタ情報(件数つき。重複を検出する) */
const readMeta = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const q = (s: string) => [...document.head.querySelectorAll(s)]
    return {
      title: document.title,
      titleTags: q('title').length,
      description: q('meta[name="description"]').map((e) => e.getAttribute('content')),
      canonical: q('link[rel="canonical"]').map((e) => e.getAttribute('href')),
      ogUrl: q('meta[property="og:url"]').map((e) => e.getAttribute('content')),
      ogTitle: q('meta[property="og:title"]').map((e) => e.getAttribute('content')),
      robots: q('meta[name="robots"]').map((e) => e.getAttribute('content')),
    }
  })

const recoverable = (page: import('@playwright/test').Page) => page.evaluate(() => (window as unknown as { __recoverableErrors?: string[] }).__recoverableErrors ?? [])

test.describe('生成した 3 ページ: 通常の URL の直接取得', () => {
  for (const p of PAGES) {
    test(`${p.path}: 200 で、本文・内部リンク・固有のメタ情報を含む`, async ({ request }) => {
      const res = await request.get(p.path)
      expect(res.status()).toBe(200)
      expect(res.headers()['content-type']).toContain('text/html')
      const html = await res.text()
      expect(html).toContain('data-ssr="1"')
      expect(html).toContain(p.h1)
      expect(html).not.toContain('読み込み中')
      expect(titleOf(html)).toBeTruthy()
      expect(attr(html, /<meta name="description" content="([^"]+)"/)).toBeTruthy()
      expect(canonicalOf(html)).toBe(p.canonical)
      expect(attr(html, /<meta property="og:url" content="([^"]+)"/)).toBe(p.canonical)
      expect(attr(html, /<meta property="og:title" content="([^"]+)"/)).toBe(titleOf(html))
      expect(html).not.toContain('name="robots"') // 公開ページに noindex を付けない
      expect(html).not.toMatch(/href="#\//) // ハッシュのリンクがない
      expect(html).toContain(`href="${B}/`) // ベース付きの通常のリンクがある
    })
  }

  test('3 ページの title は、すべて異なる', async ({ request }) => {
    const titles = await Promise.all(PAGES.map(async (p) => titleOf(await (await request.get(p.path)).text())))
    expect(new Set(titles).size).toBe(PAGES.length)
  })

  test('PM-1: 本文・出典・クイズの問い・本文中の内部リンクが、HTML にある', async ({ request }) => {
    const html = await (await request.get(`${B}/lesson/pm-1/`)).text()
    for (const t of ['大口顧客の要望', '3 つの要点', '演習', '出典と更新記録', 'この講座の出典と限界', '確認クイズ']) expect(html, t).toContain(t)
    // 本文中の内部リンクは、ベース付きの、末尾スラッシュの形(アプリ内の移動用の data-route つき)
    expect(html).toMatch(/<a href="\/dokushu-academia\/lesson\/pm-2\/" data-route="\/lesson\/pm-2"/)
    // クイズの問題文と選択肢は、HTML にある(解説は、回答後)
    const q = bank['pm-1'][0]
    expect(html).toContain(q.question.slice(0, 20))
    // 個人の進捗・キーを含まない
    expect(html).not.toContain('llm-learning:')
    expect(html).not.toContain('sk-ant')
  })

  test('講座の目次: 入口のカードと、レッスンへの通常のリンクがある', async ({ request }) => {
    const html = await (await request.get(`${B}/course/pm/`)).text()
    expect(html).toContain('こんな場面で読む')
    expect(html).toContain(`href="${B}/lesson/pm-1/"`)
  })

  test('講座一覧: 20 講座のカードと、各講座への通常のリンクがある', async ({ request }) => {
    const html = await (await request.get(`${B}/catalog/`)).text()
    expect(html.match(/class="card course-card"/g)?.length).toBe(20)
    expect(html).toContain(`href="${B}/course/pm/"`)
  })

  test('/ と /index.html は、講座一覧と同じ内容で、canonical は /catalog/', async ({ request }) => {
    for (const p of [`${B}/`, `${B}/index.html`]) {
      const html = await (await request.get(p)).text()
      expect(canonicalOf(html), p).toBe(`${ORIGIN}${B}/catalog/`)
      expect(html, p).toContain('講座一覧')
    }
  })
})

test.describe('JS なしの表示', () => {
  test('PM-1: 本文・出典・通常のリンクを読め、対話部品に JS が要ることが表示される', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1000, height: 900 } })
    const page = await ctx.newPage()
    await page.goto(`${B}/lesson/pm-1/`)
    await expect(page.locator('article h1')).toContainText('PM の仕事の全体像')
    await expect(page.locator('h3', { hasText: '大口顧客の要望' })).toBeVisible()
    await expect(page.locator('.source-note')).toContainText('出典と更新記録')
    await expect(page.locator(`a[href="${B}/lesson/pm-2/"]`).first()).toBeAttached()
    await expect(page.locator('.notice', { hasText: 'JavaScript が有効なときに操作できます' })).toBeVisible()
    await ctx.close()
  })
  test('講座一覧と講座の目次: 本文とリンクを読める', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false })
    const page = await ctx.newPage()
    await page.goto(`${B}/catalog/`)
    await expect(page.locator('h1')).toContainText('講座一覧')
    await expect(page.locator('.course-card')).toHaveCount(20)
    await page.goto(`${B}/course/pm/`)
    await expect(page.getByLabel('こんな場面で読む')).toBeVisible()
    await ctx.close()
  })
})

test.describe('生成していないページと、見つからないページ', () => {
  test('生成していない PM-2 の直接アクセス: 試作の限界として、404 のステータスで、アプリがブラウザで描画する', async ({ page, request }) => {
    const res = await request.get(`${B}/lesson/pm-2/`)
    expect(res.status()).toBe(404) // 試作の限界: HTML を生成していないので、配信側は 404.html を 404 で返す
    const html = await res.text()
    expect(html).not.toContain('data-ssr="1"') // 殻(本文なし)
    expect(html).toContain('name="robots" content="noindex"')
    await page.goto(`${B}/lesson/pm-2/`)
    await expect(page.locator('article h1')).toContainText('課題と解決策を分ける') // ブラウザで描画される(再読み込みでも読める)
    expect(await recoverable(page)).toEqual([])
  })

  test('PM-1 から PM-2 へのアプリ内の移動: ページ全体を取得し直さず、URL とメタ情報が変わる', async ({ page }) => {
    await page.goto(`${B}/lesson/pm-1/`)
    await page.evaluate(() => ((window as unknown as { __marker: number }).__marker = 1))
    await page.locator('.pager a', { hasText: '→' }).click()
    await expect(page.locator('article h1')).toContainText('課題と解決策を分ける')
    await expect(page).toHaveURL(`http://localhost:4174${B}/lesson/pm-2/`)
    expect(await page.evaluate(() => (window as unknown as { __marker?: number }).__marker)).toBe(1) // 全体を再取得していない
    const m = await readMeta(page)
    expect(m.canonical).toEqual([`${ORIGIN}${B}/lesson/pm-2/`])
    expect(m.title).toContain('PM-2')
    // 本文中の内部リンクも、ブラウザ内の移動
    await page.goto(`${B}/lesson/pm-1/`)
    await page.evaluate(() => ((window as unknown as { __marker: number }).__marker = 2))
    await page.locator('.prose a[data-route="/lesson/pm-2"]').first().click()
    await expect(page.locator('article h1')).toContainText('課題と解決策を分ける')
    expect(await page.evaluate(() => (window as unknown as { __marker?: number }).__marker)).toBe(2)
  })

  test('存在しない URL・存在しない ID: 404 のステータスで、「見つかりません」と、講座一覧へのリンクを示す', async ({ page, request }) => {
    for (const p of [`${B}/nothing/`, `${B}/lesson/nothing/`, `${B}/course/nothing/`]) {
      expect((await request.get(p)).status(), p).toBe(404)
      await page.goto(p)
      await expect(page.locator('h1')).toContainText('見つかりません')
      await expect(page.getByRole('link', { name: '講座一覧へ' })).toBeVisible()
      expect((await readMeta(page)).robots).toEqual(['noindex'])
    }
  })

  test('スラッシュなしのパスは、スラッシュ付きへ 301(GitHub Pages に近い配信の再現)', async ({ request }) => {
    const res = await request.get(`${B}/lesson/pm-1`, { maxRedirects: 0 })
    expect(res.status()).toBe(301)
    expect(res.headers()['location']).toBe(`${B}/lesson/pm-1/`)
  })
})

test.describe('旧ハッシュ URL の救済', () => {
  for (const [from, to] of [
    ['#/lesson/pm-1', `${B}/lesson/pm-1/`],
    ['#/course/pm', `${B}/course/pm/`],
    ['#/catalog', `${B}/catalog/`],
    ['#/lesson/nothing', `${B}/lesson/nothing/`],
  ]) {
    test(`${from} → ${to}`, async ({ page }) => {
      await page.goto(`${B}/${from}`)
      await expect(page).toHaveURL(`http://localhost:4174${to}`)
    })
  }
  test('未知の ID は、「見つかりません」になる', async ({ page }) => {
    await page.goto(`${B}/#/lesson/nothing`)
    await expect(page.locator('h1')).toContainText('見つかりません')
  })
  // 生成した legacy-redirect.js を、Node の vm で実行して、転送先を確かめる(外部へはアクセスしない)
  for (const [dir, base] of [['dist-path', '/dokushu-academia/'], ['dist-path-root', '/']] as const) {
    const run = (hash: string, pathname: string = base) => {
      let to: string | null = null
      const location = { hash, pathname, origin: 'http://localhost', replace: (u: string) => { to = u } }
      vm.runInNewContext(readFileSync(`${dir}/legacy-redirect.js`, 'utf8'), { location, URL })
      return to
    }
    test(`${dir}: 旧ハッシュ URL の転送は、サイト内に限り、検索語を壊さない`, () => {
      expect(run('#/lesson/pm-1')).toBe(`${base}lesson/pm-1/`)
      expect(run('#/lesson/nothing')).toBe(`${base}lesson/nothing/`)
      expect(run('#/catalog/')).toBe(`${base}catalog/`)
      expect(run('#/search?q=PM')).toBe(`${base}search/?q=PM`)
      expect(run('#/search?q=%E5%95%86%E5%93%81%2F')).toBe(`${base}search/?q=%E5%95%86%E5%93%81%2F`)
      expect(run('#/lesson/pm-1#top')).toBe(`${base}lesson/pm-1/#top`)
      expect(run('#/')).toBe(base)
      // 転送しない
      expect(run('#//example.com')).toBeNull()
      expect(run('#//example.com/')).toBeNull()
      expect(run('#/\\example.com')).toBeNull()
      expect(run('#/a\\b')).toBeNull()
      expect(run('#/../../x')).toBeNull()
      expect(run('#/%2e%2e/x')).toBeNull()
      expect(run('#/a/./b')).toBeNull()
      expect(run('#/lesson/pm-1', `${base}lesson/pm-1/`)).toBeNull() // ルートでないときは何もしない
      expect(run('#top')).toBeNull()
    })
  }
  test('見出しへの通常の # は、教材の移転と誤認しない', async ({ page }) => {
    await page.goto(`${B}/lesson/pm-1/#top`)
    await expect(page).toHaveURL(`http://localhost:4174${B}/lesson/pm-1/#top`)
    await expect(page.locator('article h1')).toContainText('PM の仕事の全体像')
  })
})

test.describe('引き継ぎ(ハイドレーション)と進捗', () => {
  const progress = {
    version: 1,
    completed: { 'e-1': '2026-10-02T00:00:00.000Z', 'st-1': '2026-10-02T00:00:00.000Z' },
    quiz: { 'pm-1': { best: 4, total: 5 } },
    questions: { 'pm-1:abc': { right: 1, wrong: 2, streak: 0, last: 'wrong', at: '2026-10-02T00:00:00.000Z' } },
    reading: { 'pm-1': { section: '3 つの要点', index: 1, at: '2026-10-03T00:00:00.000Z' } },
    lastVisited: 'pm-2',
  }
  const KEY = 'llm-learning:progress'

  for (const p of PAGES) {
    for (const withProgress of [false, true]) {
      test(`${p.path}: ${withProgress ? '進捗あり' : '進捗なし'}で、引き継ぎの警告・回復可能なエラーがない`, async ({ page }) => {
        if (withProgress) await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [KEY, JSON.stringify(progress)])
        await page.goto(p.path)
        await expect(page.locator('#root[data-ssr="1"]')).toBeAttached()
        await expect(page.locator('h1').first()).toContainText(p.h1)
        // 引き継ぎの完了を、状態で待つ(進捗あり: 保存済みの進捗の表示。進捗なし: アプリが管理する印(html の data-hydrated))。console.error は、フィクスチャーが失敗にする
        if (withProgress) await expect(page.locator('.site-header')).toContainText(/進捗 [1-9]\d*%/) // 保存済みの進捗へ更新された
        else await expect(page.locator('.site-header')).toContainText('進捗 0%')
        await expect(page.locator('html')).toHaveAttribute('data-hydrated', '1') // アプリの効果(HydrationMark)が走った印。React の内部名には頼らない
        await page.waitForLoadState('networkidle')
        expect(await recoverable(page)).toEqual([])
      })
    }
  }

  test('PM-1: 進捗あり(直接アクセス、再読み込み、完了、クイズ、折りたたみ、続きから読む)。保存済みの記録が消えない', async ({ page }) => {
    await page.addInitScript(([k, v]) => localStorage.getItem(k) === null && localStorage.setItem(k, v), [KEY, JSON.stringify(progress)])
    await page.goto(`${B}/lesson/pm-1/`)
    await expect(page.getByRole('status').filter({ hasText: '前回は「3 つの要点」まで読みました' })).toBeVisible() // 読み位置から再開
    await page.getByRole('button', { name: '続きから読む' }).click()

    // 折りたたみ(演習の回答例)
    const details = page.locator('.prose details').filter({ hasText: '回答例を見る' })
    await details.locator('summary').click()
    await expect(details.locator('table')).toBeVisible()

    // クイズ: 5 問すべてに答える(正解は、アプリが生成するクイズの集計から読む)
    const qs = bank['pm-1']
    const fieldsets = page.locator('.quiz fieldset')
    await expect(fieldsets).toHaveCount(qs.length)
    for (let i = 0; i < qs.length; i++) await fieldsets.nth(i).locator('input[type=radio]').nth(qs[i].answer).check()
    await page.locator('.quiz').getByRole('button', { name: '答え合わせ' }).click()
    await expect(page.locator('.quiz')).toContainText(`${qs.length} / ${qs.length} 問正解`)

    // 完了にする
    await page.getByRole('button', { name: 'このレッスンを完了にする' }).click()
    await expect(page.getByRole('button', { name: /完了済み/ })).toBeVisible()

    const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), KEY)
    // 保存済みの読了・クイズ・復習の記録が、消えたり、初期化されたりしていない(正常な更新と区別する)
    expect(saved.completed['e-1']).toBe(progress.completed['e-1'])
    expect(saved.completed['st-1']).toBe(progress.completed['st-1'])
    expect(saved.completed['pm-1']).toBeTruthy()
    expect(saved.quiz['pm-1'].best).toBeGreaterThanOrEqual(progress.quiz['pm-1'].best)
    expect(saved.questions['pm-1:abc'].wrong).toBeGreaterThanOrEqual(progress.questions['pm-1:abc'].wrong)
    expect(saved.questions['pm-1:abc'].right).toBeGreaterThanOrEqual(progress.questions['pm-1:abc'].right)
    // 正常な閲覧処理による更新は、許す: 最終訪問は pm-1 に、読了後の読み位置は不要になる
    expect(saved.lastVisited).toBe('pm-1')

    // 再読み込みしても、保存した状態が反映される(引き継ぎ後に、保存済みの進捗へ更新される)
    await page.reload()
    await expect(page.getByRole('button', { name: /完了済み/ })).toBeVisible()
    expect(await recoverable(page)).toEqual([])
  })

  test('進捗なしで、講座一覧を読むだけでは、保存データのキーを作らない(初期値で書き込まない)', async ({ page }) => {
    await page.goto(`${B}/catalog/`)
    await page.waitForTimeout(300)
    expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBeNull()
  })
})

test.describe('ページ移動時のメタ情報と noindex', () => {
  const steps = async (page: import('@playwright/test').Page) => {
    const m = await readMeta(page)
    // 重複しない
    expect(m.titleTags).toBe(1)
    for (const k of ['description', 'canonical', 'ogUrl', 'ogTitle', 'robots'] as const) expect(m[k].length, k).toBeLessThanOrEqual(1)
    return m
  }

  test('講座一覧 → 講座 → PM-1 → PM-2: タイトル・説明・canonical・og:url・robots が、現在のルートと一致し、重複しない', async ({ page }) => {
    await page.goto(`${B}/catalog/`)
    let m = await steps(page)
    expect(m.canonical).toEqual([`${ORIGIN}${B}/catalog/`])
    await page.locator('.course-card', { hasText: 'プロダクトマネジメント' }).click()
    await expect(page.locator('h1')).toContainText('プロダクトマネジメント')
    m = await steps(page)
    expect(m.canonical).toEqual([`${ORIGIN}${B}/course/pm/`])
    expect(m.ogUrl).toEqual(m.canonical)
    expect(m.robots).toEqual([])
    await page.getByLabel('学ぶと持ち帰れること').getByRole('link', { name: /PM-1/ }).click()
    await expect(page.locator('article h1')).toContainText('PM の仕事の全体像')
    m = await steps(page)
    expect(m.canonical).toEqual([`${ORIGIN}${B}/lesson/pm-1/`])
    expect(m.title).toContain('PM-1')
    expect(m.ogTitle).toEqual([m.title])
    await page.locator('.pager a', { hasText: '→' }).click()
    await expect(page.locator('article h1')).toContainText('課題と解決策を分ける')
    m = await steps(page)
    expect(m.canonical).toEqual([`${ORIGIN}${B}/lesson/pm-2/`])
    expect(m.title).toContain('PM-2')
  })

  test('進捗 → PM-1 → 進捗、戻る・進む: noindex は、個人ページだけにあり、公開教材に残らない', async ({ page }) => {
    await page.goto(`${B}/progress/`) // 殻(初期 HTML に noindex がある)
    const html = await (await page.request.get(`${B}/progress/`)).text()
    expect(html).toContain('name="robots" content="noindex"')
    let m = await steps(page)
    expect(m.robots).toEqual(['noindex'])
    await page.getByRole('link', { name: '学び方にも、根拠がある' }).first().click() // 進捗画面のレッスンの一覧から、公開教材へ
    await expect(page.locator('article h1')).toContainText('学び方にも、根拠がある')
    m = await steps(page)
    expect(m.robots).toEqual([]) // 公開教材に、noindex が残らない
    expect(m.canonical).toEqual([`${ORIGIN}${B}/lesson/ln-1/`])
    await page.locator('.site-header a', { hasText: /^進捗/ }).click()
    await expect(page.locator('h1')).toContainText('進捗')
    m = await steps(page)
    expect(m.robots).toEqual(['noindex'])
    await page.goBack()
    await expect(page.locator('article h1')).toContainText('学び方にも、根拠がある')
    m = await steps(page)
    expect(m.robots).toEqual([])
    expect(m.canonical).toEqual([`${ORIGIN}${B}/lesson/ln-1/`])
    await page.goForward()
    await expect(page.locator('h1')).toContainText('進捗')
    m = await steps(page)
    expect(m.robots).toEqual(['noindex'])
  })

  test('生成した公開ページから、noindex の殻へ移動し、戻っても、タグが重複しない', async ({ page }) => {
    await page.goto(`${B}/lesson/pm-1/`)
    await page.locator('.site-header a', { hasText: /^進捗/ }).click()
    await expect(page.locator('h1')).toContainText('進捗')
    let m = await steps(page)
    expect(m.robots).toEqual(['noindex'])
    await page.goBack()
    m = await steps(page)
    expect(m.robots).toEqual([])
    expect(m.canonical).toEqual([`${ORIGIN}${B}/lesson/pm-1/`])
  })
})

test.describe('生成物の整合: ベース・オリジン、サイトマップ、CSP', () => {
  const sitemapLocs = (xml: string) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])

  test('サイトマップは、生成した公開ページ(3 件)だけで、絶対 URL', async ({ request }) => {
    const xml = await (await request.get(`${B}/sitemap.xml`)).text()
    expect(sitemapLocs(xml)).toEqual(PAGES.map((p) => p.canonical))
    expect(xml).not.toContain('pm-2')
    expect(xml).not.toContain('progress')
  })

  test('プロジェクト配下(ベース /dokushu-academia/): アセット・リンク・canonical・サイトマップが、同じベースとオリジンで一貫している', async ({ page, request }) => {
    const failed: string[] = []
    page.on('response', (r) => r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`))
    await page.goto(`${B}/lesson/pm-1/`)
    await expect(page.locator('article h1')).toBeVisible()
    expect(failed).toEqual([]) // 深い URL でも、アセットが解決する
    const html = await (await request.get(`${B}/lesson/pm-1/`)).text()
    for (const m of html.matchAll(/(?:src|href)="(\/[^"]*assets\/[^"]+)"/g)) expect(m[1].startsWith(`${B}/assets/`), m[1]).toBe(true)
    const manifest = JSON.parse(readFileSync('dist-path/prerender-manifest.json', 'utf8')) as { base: string; origin: string; pages: { canonical: string | null; ssr: boolean }[] }
    expect(manifest.base).toBe(`${B}/`)
    for (const p of manifest.pages) if (p.canonical) expect(p.canonical.startsWith(manifest.origin + manifest.base), p.canonical).toBe(true)
  })

  test('ルート配下(ベース /): 深い URL のアセット・リンク・canonical が解決し、引き継ぎも通る', async ({ page, request }) => {
    const failed: string[] = []
    page.on('response', (r) => r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`))
    await page.goto(`${ROOT}/lesson/pm-1/`)
    await expect(page.locator('article h1')).toContainText('PM の仕事の全体像')
    expect(failed).toEqual([])
    expect(await recoverable(page)).toEqual([])
    const html = await (await request.get(`${ROOT}/lesson/pm-1/`)).text()
    expect(canonicalOf(html)).toBe(`${ORIGIN}/lesson/pm-1/`)
    expect(html).toContain('href="/course/pm/"')
    expect(html).not.toMatch(/(?:href|src)="\/dokushu-academia\//) // プロジェクト配下のベースが、混ざらない(出典の GitHub への外部リンクは、別)
    const xml = await (await request.get(`${ROOT}/sitemap.xml`)).text()
    expect(sitemapLocs(xml)).toEqual([`${ORIGIN}/catalog/`, `${ORIGIN}/course/pm/`, `${ORIGIN}/lesson/pm-1/`])
    // 旧ハッシュ URL の救済も、ルート配下で動く
    await page.goto(`${ROOT}/#/course/pm`)
    await expect(page).toHaveURL(`${ROOT}/course/pm/`)
  })

  test('CSP の保護が維持され、インラインの実行スクリプトがない(旧ハッシュ URL の転送は、外部ファイル)', async ({ request }) => {
    const csp = (h: string) => attr(h, /<meta http-equiv="Content-Security-Policy" content="([^"]+)"/)
    const reference = existsSync('dist/index.html') ? csp(readFileSync('dist/index.html', 'utf8')) : undefined
    for (const p of [...PAGES.map((x) => x.path), `${B}/`, `${B}/progress/`, `${B}/404.html`]) {
      const html = await (await request.get(p)).text()
      expect(csp(html), p).toContain("script-src 'self'")
      expect(csp(html), p).toContain("connect-src 'self' https://api.anthropic.com")
      if (reference) expect(csp(html), p).toBe(reference) // 本番のハッシュ版と同じ
      // インラインの実行スクリプト(src なし)がない
      expect(html.match(/<script(?![^>]*\bsrc=)[^>]*>/g) ?? [], p).toEqual([])
      expect(html, p).toContain(`<script src="${B}/legacy-redirect.js"></script>`)
    }
  })

  test('殻(進捗、404)は、noindex で、本文を持たない。生成ページは、noindex がない', async ({ request }) => {
    for (const p of [`${B}/progress/`, `${B}/404.html`]) {
      const html = await (await request.get(p)).text()
      expect(html, p).toContain('name="robots" content="noindex"')
      expect(html, p).not.toContain('data-ssr="1"')
    }
  })
})

test.describe('境界: 本番のハッシュ版に、試作の出力が混ざらない', () => {
  test('出力先の別名(./dist、dist/、絶対パス、dist 配下)は、ビルド開始前に拒否され、dist を消さない', () => {
    const before = existsSync('dist/index.html')
    for (const out of ['dist', './dist', 'dist/', `${process.cwd()}/dist`, 'dist/sub', 'dist/../dist']) {
      const r = spawnSync('node', ['scripts/build-path.mjs'], { env: { ...process.env, OUT_DIR: out }, encoding: 'utf8' })
      expect(r.status, out).toBe(1)
      expect(r.stderr, out).toContain('出せません')
    }
    expect(existsSync('dist/index.html')).toBe(before)
  })
  test('ハッシュ版の出力(dist)には、パスの URL の HTML・サイトマップがない', () => {
    test.skip(!existsSync('dist'), 'ハッシュ版のビルド(npm run build)がない')
    expect(existsSync('dist/lesson')).toBe(false)
    expect(existsSync('dist/catalog')).toBe(false)
    expect(existsSync('dist/sitemap.xml')).toBe(false)
    expect(existsSync('dist/legacy-redirect.js')).toBe(false)
  })
  test('本番のビルドとデプロイの設定は、ハッシュ版のまま(dist を配り、パス版を含まない)', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> }
    expect(pkg.scripts.build).toBe('tsc --noEmit && vite build')
    expect(pkg.scripts.build).not.toContain('path')
    const deploy = readFileSync('.github/workflows/deploy.yml', 'utf8')
    expect(deploy).toContain('run: npm run build')
    expect(deploy).toContain('path: dist')
    expect(deploy).not.toContain('dist-path')
    expect(deploy).not.toContain('build:path')
  })
})

test.describe('スマホ幅 390px', () => {
  for (const p of PAGES) {
    test(`${p.path}: 横にはみ出さず、本文が読める`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
      const page = await ctx.newPage()
      await page.goto(p.path)
      await expect(page.locator('h1').first()).toContainText(p.h1)
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)
      await ctx.close()
    })
  }
})

// アプリ内リンクの形と移動(Issue #19): 共通部品(src/ui/Link)により、href がスラッシュ付きの正規 URL になり、クリックは、ページ全体を取得し直さない移動になる。
test.describe('内部リンクの末尾スラッシュ', () => {
  const hrefs = (page: import('@playwright/test').Page) =>
    page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href') ?? '').filter((h) => h.startsWith('/') && !h.startsWith('//')))
  const notSlashed = (list: string[]) => list.filter((h) => !/\.[a-z0-9]+$/i.test(h.split(/[?#]/)[0]) && !h.split(/[?#]/)[0].endsWith('/'))

  for (const [label, origin, base] of [['プロジェクト配下(ベース /dokushu-academia/)', 'http://localhost:4174', `${B}/`], ['ルート配下(ベース /)', ROOT, '/']] as const) {
    test(`${label}: 3 ページのアプリ内リンクは、ベースを保ち、スラッシュで終わる`, async ({ page }) => {
      for (const route of ['catalog', 'course/pm', 'lesson/pm-1']) {
        await page.goto(`${origin}${base}${route}/`)
        await expect(page.locator('html')).toHaveAttribute('data-hydrated', '1')
        const all = await hrefs(page)
        const internal = base === '/' ? all : all.filter((h) => h.startsWith(base))
        expect(internal.length, route).toBeGreaterThan(5)
        if (base !== '/') expect(all.filter((h) => !h.startsWith(base)), `${route}: ベース外の内部リンク`).toEqual([])
        expect(notSlashed(internal), `${route}: スラッシュで終わらないリンク`).toEqual([])
      }
    })
  }

  test('通常クリックは、ページ全体を取得し直さず(SPA の移動)、戻る・進むが動き、メタ情報が替わる', async ({ page }) => {
    await page.goto(`${B}/catalog/`)
    await expect(page.locator('html')).toHaveAttribute('data-hydrated', '1')
    await page.evaluate(() => ((window as unknown as { __alive: number }).__alive = 1))
    const card = page.locator('a.course-card[href$="/course/pm/"]')
    await expect(card).toHaveAttribute('href', `${B}/course/pm/`)
    await card.click()
    await expect(page).toHaveURL(`http://localhost:4174${B}/course/pm/`)
    await expect(page.locator('h1').first()).toContainText('プロダクトマネジメント')
    expect(await page.evaluate(() => (window as unknown as { __alive?: number }).__alive)).toBe(1) // 読み込み直していない
    await page.goBack()
    await expect(page).toHaveURL(`http://localhost:4174${B}/catalog/`)
    await page.goForward()
    await expect(page).toHaveURL(`http://localhost:4174${B}/course/pm/`)
    expect(await page.evaluate(() => (window as unknown as { __alive?: number }).__alive)).toBe(1)
    expect(await page.evaluate(() => document.querySelector('link[rel="canonical"]')?.getAttribute('href'))).toBe(`${ORIGIN}${B}/course/pm/`)
  })

  test('修飾キー付きのクリックは、新しいタブで、同じ形の URL を開く(現在のタブは動かない)', async ({ page, context }) => {
    await page.goto(`${B}/catalog/`)
    await expect(page.locator('html')).toHaveAttribute('data-hydrated', '1')
    const popup = context.waitForEvent('page')
    await page.locator('a.course-card[href$="/course/pm/"]').click({ modifiers: ['ControlOrMeta'] })
    const p2 = await popup
    await p2.waitForLoadState()
    expect(p2.url()).toBe(`http://localhost:4174${B}/course/pm/`)
    await expect(page).toHaveURL(`http://localhost:4174${B}/catalog/`)
  })
})
