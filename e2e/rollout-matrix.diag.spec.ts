import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { APPROVED_LESSONS, APPROVED_PAGES } from '../scripts/lib/rollout-scope.mjs'

// 全展開のローカル検証基盤(Issue #33 の A、docs/seo/rollout.md §3)の、検証マトリクス。
// **承認済みの範囲だけ**(既存の 3 ページ+7 件+対照 pm-1 = 10 ページ。scripts/lib/rollout-scope.mjs)。全 172 教材は、対象外(B は未承認)。
// 前提: `npm run build:path:diag`(本番相当)または `build:path:diag:dev`(開発用)の出力(dist-path-diag/、ベース /)。実行: npx playwright test --project=diag
// 引き継ぎ(hydrate)・警告・回復可能なエラーは、レッスンについて、hydrate.diag.spec.ts が確かめる。ここでは、ページ(講座一覧・講座)の引き継ぎと、
//   A1(初期 HTML)・A2(内部リンク)・A6(JS なし)・A7(メタ情報)・A8(戻る・進む)・部品の操作・進捗の保護を、対象 ID ごとに記録する(annotation `rollout`)。
type Plan = { list: { route: string; mode: string; noindex: boolean; sitemap: boolean; canonical: string | null }[]; problems: string[] }
const OUT = 'dist-path-diag'
const KEY = 'llm-learning:progress'
const ORIGIN = 'https://shn4pt.github.io'

const TARGETS = [...new Set([...APPROVED_PAGES, ...APPROVED_LESSONS.map((id: string) => `/lesson/${id}`)])]
const lessonIdOf = (route: string) => /^\/lesson\/([^/]+)$/.exec(route)?.[1]

let plan: Plan
test.beforeAll(() => {
  // 生成の一覧は、既存のデータから作る(手書きにしない)。ここでは、ページを生成しない
  plan = JSON.parse(execFileSync('node', ['scripts/rollout-plan.mjs', '--json'], { encoding: 'utf8', maxBuffer: 20_000_000 })) as Plan
  expect(plan.problems).toEqual([])
})
const planOf = (route: string) => plan.list.find((p) => p.route === route)!
const buildKind = () => (JSON.parse(readFileSync(`${OUT}/build-info.json`, 'utf8')) as { kind: string }).kind
const record = (data: Record<string, unknown>) => test.info().annotations.push({ type: 'rollout', description: JSON.stringify({ build: buildKind(), ...data }) })

const progressFull = {
  version: 1,
  completed: { 'e-1': '2026-10-02T00:00:00.000Z' },
  quiz: { 'pm-1': { best: 4, total: 5 } },
  questions: { 'protect-q1': { right: 2, wrong: 1, streak: 1, last: 'right', at: '2026-10-02T00:00:00.000Z' } }, // 非空: 保存後も残ること
  reading: { 'e-1': { section: '保護の確認', index: 3, at: '2026-10-02T00:00:00.000Z' } }, // 別のレッスンのしおり: 残ること
  lastVisited: 'pm-2', // 訪問に応じて、このレッスンの ID へ更新される(更新を確かめる。保護の対象ではない)
}

for (const route of TARGETS) {
  const id = lessonIdOf(route)
  const label = id ?? route

  test(`[${label}] 行列: 初期 HTML・内部リンク・JS なし・メタ情報・戻る進む`, async ({ page, browser, request }) => {
    expect(plan.list.some((p) => p.route === route && p.mode === 'generate'), `${route} が、生成の一覧にある`).toBe(true)
    const url = `${route}/`
    const res = await request.get(url)
    expect(res.status(), 'A1: 有効な URL は 200').toBe(200)
    const html = await res.text()
    const p = planOf(route)

    // A1 初期 HTML(JS を実行しない)
    expect(html, 'A1: h1').toMatch(/<h1[ >]/)
    expect(html, 'A1: 本文入りの HTML').toContain('data-ssr="1"')
    if (id) expect(html, 'A1: 出典と更新記録').toContain('class="source-note"')
    const mdPath = id ? `src/content/${id}.md` : null
    let headings: string | null = 'n/a(TSX または一覧)'
    if (mdPath && existsSync(mdPath)) {
      const expected = readFileSync(mdPath, 'utf8').split('\n').filter((l) => /^### /.test(l)).length
      const got = (html.match(/<h3[ >]/g) ?? []).length
      headings = `${got}/${expected}`
      expect(got, 'A1: 本文の見出しの数が、元の Markdown と一致').toBeGreaterThanOrEqual(expected)
    }

    // A7 メタ情報(一覧との一致)
    const robots = /<meta name="robots" content="noindex"/.test(html)
    expect(robots, 'A7: noindex が、一覧と一致').toBe(p.noindex)
    const canonical = /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1] ?? null
    expect(canonical, 'A7: canonical が、一覧と一致').toBe(p.canonical === null ? null : `${ORIGIN}${p.canonical === '/' ? '' : p.canonical}/`)
    expect(html, 'A7: title').toMatch(/<title>[^<]+<\/title>/)

    // 現在のページの、ナビゲーションの強調(NavLink の active・aria-current)は、初期 HTML と、引き継ぎの後で、同じ(本番の React は、属性の食い違いを直さないので、初期 HTML の誤りが、そのまま残る)
    if (route === '/catalog') {
      expect(html, 'A1: 現在のページのナビゲーションが強調されている(初期 HTML)').toMatch(/<a [^>]*aria-current="page"[^>]*href="\/catalog\/"|<a [^>]*href="\/catalog\/"[^>]*aria-current="page"/)
    }

    // A2 内部リンク: すべて、末尾スラッシュ付き(または、ファイル)で、一覧にあるルートへ向く。未生成の(計画上の)ページは、別に数える
    const hrefs = [...html.matchAll(/<a [^>]*href="(\/[^"#?]*)/g)].map((m) => m[1]).filter((h) => !h.startsWith('//'))
    const generated: string[] = []
    const plannedOnly: string[] = []
    const unknown: string[] = []
    for (const h of new Set(hrefs)) {
      if (/\.[a-z0-9]+$/i.test(h)) continue
      expect(h.endsWith('/'), `A2: 末尾スラッシュ ${h}`).toBe(true)
      const r = h === '/' ? '/' : h.replace(/\/$/, '')
      if (!plan.list.some((x) => x.route === r)) unknown.push(h)
      else if (existsSync(`${OUT}${h === '/' ? '' : h}/index.html`) || h === '/') generated.push(h)
      else plannedOnly.push(h)
    }
    expect(unknown, 'A2: 一覧にない(未知の)リンク先').toEqual([])

    // A6a 本文の存在(JS を実行しない取得)は、上の A1。A6b JS 無効のブラウザでの表示
    const ctx = await browser.newContext({ javaScriptEnabled: false })
    const nojs = await ctx.newPage()
    await nojs.goto(url)
    const h1text = (await nojs.locator('h1').first().innerText()).trim()
    expect(h1text.length, 'A6b: JS 無効でも h1 が読める').toBeGreaterThan(0)
    expect((await nojs.locator('main').innerText()).length, 'A6b: JS 無効でも本文が白紙でない').toBeGreaterThan(200)
    await ctx.close()

    // A8 戻る・進む(生成済みの別ページ /sources/ へ、枠のリンクで移動し、戻る)
    await page.goto(url)
    await expect(page.locator('html')).toHaveAttribute('data-hydrated', '1')
    if (route === '/catalog') {
      expect(await page.locator('.site-header nav a[aria-current="page"]').count(), '引き継ぎの後も、ナビゲーションが強調されている').toBeGreaterThan(0)
      expect(await page.locator('.site-header a.brand.active').count(), 'ブランドのリンクの class(active)が、引き継ぎの後も、同じ').toBe(1)
    }
    if (route !== '/sources') {
      const titleBefore = await page.title()
      await page.locator('.site-footer a[href$="/sources/"]').first().click()
      await expect(page).toHaveURL(/\/sources\/$/)
      await expect.poll(() => page.title(), { message: 'A8: 移動でタイトルが替わる' }).not.toBe(titleBefore)
      await page.goBack()
      await expect(page).toHaveURL(new RegExp(`${route.replace(/\//g, '\\/')}\\/$`))
      await expect.poll(() => page.title(), { message: 'A8: 戻るで、タイトルが戻る' }).toBe(titleBefore)
      await page.goForward()
      await expect(page).toHaveURL(/\/sources\/$/)
    }
    record({ id: label, kind: id ? 'lesson' : 'page', a1: 'ok', headings, a2: { generated: generated.length, plannedNotGenerated: plannedOnly.length, unknown: 0 }, a6b: 'ok', a7: 'ok', a8: route === '/sources' ? 'n/a' : 'ok' })
  })

  test(`[${label}] 部品の操作と進捗の保護(保存済みの進捗あり)`, async ({ page }) => {
    const requests: string[] = []
    page.on('request', (r) => requests.push(r.url()))
    await page.addInitScript(([k, v]) => localStorage.getItem(k) === null && localStorage.setItem(k, v), [KEY, JSON.stringify(progressFull)])
    await page.goto(`${route}/`)
    await expect(page.locator('html')).toHaveAttribute('data-hydrated', '1')
    const ops: string[] = []

    if (await page.locator('.quiz').count()) {
      const n = await page.locator('.quiz fieldset').count()
      for (let i = 0; i < n; i++) await page.locator('.quiz fieldset').nth(i).locator('input[type=radio]').first().check()
      await page.locator('.quiz button', { hasText: '答え合わせ' }).click()
      await expect(page.locator('.quiz')).toContainText(/\d+ \/ \d+/) // 成績(n / m)が出る
      ops.push('quiz')
    }
    if (await page.locator('.step-through').count()) {
      const before = await page.locator('.step-through .trace-label').first().innerText()
      await page.locator('.step-through button', { hasText: '次へ' }).first().click()
      expect(await page.locator('.step-through .trace-label').first().innerText()).not.toBe(before)
      ops.push('step-through')
    }
    if (await page.locator('.code-order').count()) {
      const first = page.locator('.code-order .order-list li').first()
      const before = await page.locator('.code-order .order-list li code').allInnerTexts()
      await first.locator('button', { hasText: '↓' }).click()
      expect(await page.locator('.code-order .order-list li code').allInnerTexts(), 'CodeOrder: 並びが替わる').not.toEqual(before)
      ops.push('code-order')
    }
    if (await page.locator('main input[type=range]').count()) {
      const s = page.locator('main input[type=range]').first()
      const before = await s.inputValue()
      const max = await s.getAttribute('max')
      const lab = s.locator('xpath=ancestor::label[1]').locator('.slider-label')
      const labelOf = async () => ((await lab.count()) ? lab.first().innerText() : '')
      const labelBefore = await labelOf()
      await s.fill(before === max ? String(Number(await s.getAttribute('min'))) : String(max))
      expect(await s.inputValue(), 'スライダー: 値が替わる').not.toBe(before)
      if (labelBefore) expect(await labelOf(), 'スライダー: 関連する表示(ラベルの値)も替わる').not.toBe(labelBefore)
      ops.push('slider')
    }
    if (await page.locator('.task-row').count()) {
      const rows = page.locator('.task-row')
      for (let i = 0; i < (await rows.count()); i++) await rows.nth(i).locator('button').first().click()
      await page.locator('button', { hasText: '答え合わせ' }).first().click()
      await expect(page.locator('.task-row').first()).toContainText('答え:')
      ops.push('classify')
    }
    if (await page.locator('.ci-lab button').count()) {
      // 取り直しの結果まで確かめる: 区間の描画(線の位置)が替わり、n を替えると、区間の平均の幅の表示が替わる
      const lines = () => page.locator('.ci-lab svg line').evaluateAll((els) => els.map((e) => `${e.getAttribute('x1')},${e.getAttribute('x2')}`).join('|'))
      const linesBefore = await lines()
      await page.locator('.ci-lab button').first().click()
      expect(await lines(), 'ci-lab: 標本の取り直しで、区間の描画が替わる').not.toBe(linesBefore)
      const widthBefore = await page.locator('#ci-width').innerText()
      await page.locator('.ci-lab select').selectOption('100')
      expect(await page.locator('#ci-width').innerText(), 'ci-lab: n を替えると、区間の幅の表示が替わる').not.toBe(widthBefore)
      ops.push('ci-lab')
    }
    if (id) {
      // 完了ボタン → 保存済みの進捗(完了・クイズ・問題ごとの記録・別のレッスンのしおり)が消えず、このレッスンが足される。最後に見たレッスンは、訪問に応じて更新される
      await page.getByRole('button', { name: 'このレッスンを完了にする' }).click()
      await expect(page.getByRole('button', { name: /完了済み/ })).toBeVisible()
      const saved = JSON.parse((await page.evaluate((k) => localStorage.getItem(k), KEY))!) as { completed: Record<string, string>; quiz: Record<string, unknown>; questions: Record<string, unknown>; reading: Record<string, unknown>; lastVisited?: string }
      expect(saved.completed['e-1'], '進捗の保護: 既存の完了が残る').toBe('2026-10-02T00:00:00.000Z')
      expect(saved.completed[id], '進捗の保護: このレッスンの完了が足される').toBeTruthy()
      expect(saved.quiz['pm-1'], '進捗の保護: 既存のクイズが残る').toEqual({ best: 4, total: 5 })
      expect(saved.questions['protect-q1'], '進捗の保護: 既存の問題ごとの記録が残る').toEqual(progressFull.questions['protect-q1'])
      expect(saved.reading['e-1'], '進捗の保護: 別のレッスンのしおりが残る').toEqual(progressFull.reading['e-1'])
      expect(saved.lastVisited, '最後に見たレッスン: 訪問したレッスンへ更新される(保護ではなく、更新の検査)').toBe(id)
      ops.push('complete+progress-protection')
    }
    // API キーなしでは、外部(api.anthropic.com)へ送信しない(キーを入れていない)
    expect(requests.filter((u) => /api\.anthropic\.com/.test(u)), '外部 API への送信なし').toEqual([])
    record({ id: label, ops, externalApi: 0 })
  })
}

// ページ(講座一覧・講座)の引き継ぎ(レッスンは、hydrate.diag.spec.ts)
for (const route of APPROVED_PAGES.filter((r: string) => !r.startsWith('/lesson/'))) {
  for (const withProgress of [false, true]) {
    test(`[${route}] 引き継ぎ: ${withProgress ? '進捗あり' : '進捗なし'}で、警告・回復可能なエラーがない`, async ({ page }) => {
      const logs: string[] = []
      page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`${m.type()}: ${m.text().slice(0, 200)}`) })
      page.on('pageerror', (e) => logs.push(`pageerror: ${e.message.slice(0, 200)}`))
      if (withProgress) await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [KEY, JSON.stringify(progressFull)])
      await page.goto(`${route}/`)
      await expect(page.locator('#root[data-ssr="1"]')).toBeAttached()
      await expect(page.locator('html')).toHaveAttribute('data-hydrated', '1')
      await page.waitForLoadState('networkidle')
      const recoverable = await page.evaluate(() => (window as unknown as { __recoverableErrors?: string[] }).__recoverableErrors ?? [])
      expect({ recoverable, logs }).toEqual({ recoverable: [], logs: [] })
      record({ id: route, hydrate: withProgress ? 'progress' : 'none' })
    })
  }
}
