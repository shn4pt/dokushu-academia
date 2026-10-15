import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'

// 旧サイト向けの、移行の案内と進捗の書き出し(ローカル専用の試作。Issue #23、docs/seo/legacy-rescue.md)の検査。
// 前提: `npm run build:legacy-rescue`(dist-legacy-rescue/。旧サイトの模擬。http://localhost:4177/dokushu-academia/)と、
//        新サイトの模擬 `npm run build:path:root`(dist-path-root/。http://localhost:4175/)。2 つは、別のオリジン。
// ブラウザのデータは、テストごとの新しいコンテキストだけ(実利用者のブラウザ保存データは使わない)。外部へのアクセスは、しない。
const OLD = 'http://localhost:4177/dokushu-academia/'
const NEW = 'http://localhost:4175'
const KEY = 'llm-learning:progress'

const full = {
  version: 1,
  completed: { 'e-1': '2026-10-02T00:00:00.000Z', 'st-1': '2026-10-02T00:00:00.000Z' },
  quiz: { 'pm-1': { best: 4, total: 5 } },
  questions: { 'pm-1:abc': { right: 1, wrong: 2, streak: 0, last: 'wrong', at: '2026-10-02T00:00:00.000Z' } },
  reading: { 'pm-1': { section: '3 つの要点', index: 1, at: '2026-10-03T00:00:00.000Z' } },
  lastVisited: 'pm-2',
}
const emptyOk = { version: 1, completed: {}, quiz: {}, questions: {}, reading: {} }

import type { BrowserContext, Page } from '@playwright/test'

/** 保存データの設定(seed。null は保存なし)と、呼び出しの記録(Storage の get / set / remove / clear)を、ページより先に仕込む。 */
async function prepare(context: BrowserContext, seed: string | null) {
  if (seed !== null) await context.addInitScript(([k, v]) => localStorage.setItem(k, v), [KEY, seed])
  await context.addInitScript(() => {
    const log = { get: [] as string[], set: [] as string[], remove: [] as string[], clear: 0 }
    ;(window as unknown as { __ls: typeof log }).__ls = log
    const P = Storage.prototype
    const g = P.getItem, s = P.setItem, r = P.removeItem, c = P.clear
    P.getItem = function (k: string) { log.get.push(k); return g.call(this, k) }
    P.setItem = function (k: string, v: string) { log.set.push(k); return s.call(this, k, v) }
    P.removeItem = function (k: string) { log.remove.push(k); return r.call(this, k) }
    P.clear = function () { log.clear++; return c.call(this) }
  })
}
const lsLog = (page: Page) => page.evaluate(() => (window as unknown as { __ls: { get: string[]; set: string[]; remove: string[]; clear: number } }).__ls)
const stored = (page: Page) => page.evaluate((k) => localStorage.getItem(k), KEY)

test.describe('状態ごとの案内と、自動転送', () => {
  for (const [label, seed] of [['保存なし', null], ['既知の正常な形式で、学習記録なし', JSON.stringify(emptyOk)]] as const) {
    test(`${label}: 手動リンクを示し、カウントダウンの後に、新サイトへ移動する。保存データは変わらない`, async ({ browser }) => {
      const context = await browser.newContext()
      await prepare(context, seed)
      const page = await context.newPage()
      await page.goto(OLD)
      await expect(page.locator('#link-new')).toHaveAttribute('href', `${NEW}/`)
      await expect(page.locator('#countdown')).toContainText('秒後に、新サイトへ移動します')
      await expect(page.locator('#btn-export')).toBeHidden()
      await page.waitForURL(`${NEW}/**`, { timeout: 10_000 })
      expect(page.url()).toBe(`${NEW}/`)
      await context.close()
    })
  }

  test('自動の移動を止められる(止めた後も、手動リンクは残る)', async ({ browser }) => {
    const context = await browser.newContext()
    await prepare(context, null)
    const page = await context.newPage()
    await page.goto(OLD)
    await page.locator('#btn-stop').click()
    await page.waitForTimeout(4000)
    expect(page.url()).toBe(OLD)
    await expect(page.locator('#link-new')).toBeVisible()
    await context.close()
  })

  test('正常な進捗あり: 自動で移動せず、書き出しとバックアップを示す', async ({ browser }) => {
    const context = await browser.newContext()
    await prepare(context, JSON.stringify(full))
    const page = await context.newPage()
    await page.goto(OLD)
    await expect(page.locator('#status-text')).toContainText('学習の進捗が保存されています')
    await expect(page.locator('#btn-export')).toBeVisible()
    await expect(page.locator('#btn-raw')).toBeVisible()
    await expect(page.locator('#countdown')).toBeHidden()
    await page.waitForTimeout(4500)
    expect(page.url()).toBe(OLD) // 3 秒を超えても、移動しない
    await expect(page.locator('#link-new')).toBeVisible() // 手動リンクは常に示す
    await context.close()
  })

  for (const [label, seed, text] of [
    ['JSON 破損', '{"version":1,"completed":{', '読み取れませんでした'],
    ['未知の version', JSON.stringify({ ...emptyOk, version: 2 }), '知っている形式ではありません'],
    ['配列(未知の形式)', '[]', '知っている形式ではありません'],
    ['文字列(未知の形式)', '"abc"', '知っている形式ではありません'],
  ] as const) {
    test(`${label}: 自動で移動せず、元のデータを上書き・削除せず、元の文字列をそのまま保存できる`, async ({ browser }) => {
      const context = await browser.newContext()
      await prepare(context, seed)
      const page = await context.newPage()
      await page.goto(OLD)
      await expect(page.locator('#status-text')).toContainText(text)
      await expect(page.locator('#btn-export')).toBeHidden()
      await expect(page.locator('#countdown')).toBeHidden()
      const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('#btn-raw').click()])
      expect(readFileSync((await dl.path())!, 'utf8')).toBe(seed) // 元の文字列と、一字一句同じ
      await page.waitForTimeout(4000)
      expect(page.url()).toBe(OLD)
      expect(await stored(page)).toBe(seed) // 上書きしていない
      const log = await lsLog(page)
      expect({ set: log.set, remove: log.remove, clear: log.clear }).toEqual({ set: [], remove: [], clear: 0 })
      await context.close()
    })
  }

  test('ストレージの読み取りに失敗: 空と扱わず、自動で移動せず、白紙にならない', async ({ browser }) => {
    const context = await browser.newContext()
    await context.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('denied', 'SecurityError') } })
    })
    const page = await context.newPage()
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(OLD)
    await expect(page.locator('#status-text')).toContainText('読み取れませんでした')
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('#link-new')).toBeVisible()
    await page.waitForTimeout(4000)
    expect(page.url()).toBe(OLD)
    expect(errors).toEqual([])
    await context.close()
  })

  test('JavaScript が無効: 案内と手動リンクが見え、白紙にならない', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto(OLD)
    await expect(page.locator('h1')).toContainText('移行のご案内')
    expect(await page.locator('main').innerText()).toContain('JavaScript が無効のため、保存された進捗を確認できません') // noscript の中は、Playwright の text 照合の対象外なので、描画されたテキストで見る
    await expect(page.locator('#status-text')).toContainText('JavaScript が必要です') // 「確認中」のまま止まらない
    await expect(page.locator('#link-new')).toHaveAttribute('href', `${NEW}/`)
    await context.close()
  })
})

test.describe('旧ハッシュ URL の対応付け(保存データがないとき)', () => {
  for (const [hash, to] of [
    ['#/lesson/pm-1', `${NEW}/lesson/pm-1/`],
    ['#/course/pm', `${NEW}/course/pm/`],
    ['#/lesson/nothing', `${NEW}/lesson/nothing/`],
    ['#/search?q=PM', `${NEW}/search/?q=PM`],
    ['#/search?q=%E5%95%86%E5%93%81%2F', `${NEW}/search/?q=%E5%95%86%E5%93%81%2F`],
  ] as const) {
    test(`${hash} → ${to}`, async ({ browser }) => {
      const context = await browser.newContext()
      await prepare(context, null)
      const page = await context.newPage()
      await page.goto(OLD + hash)
      await expect(page.locator('#link-new')).toHaveAttribute('href', to) // 手動リンクも同じ先
      await page.waitForURL((u) => u.origin === NEW, { timeout: 10_000 })
      expect(page.url()).toBe(to)
      await context.close()
    })
  }

  for (const hash of ['#//example.com', '#//example.com/', '#/\\example.com', '#/../../x', '#/%2e%2e/x']) {
    test(`${hash}: 外部やベース外へは移動せず、新サイトのトップを示す`, async ({ browser }) => {
      const context = await browser.newContext()
      await prepare(context, null)
      const page = await context.newPage()
      const requested: string[] = []
      page.on('request', (r) => requested.push(r.url()))
      await page.goto(OLD + hash)
      await expect(page.locator('#link-new')).toHaveAttribute('href', `${NEW}/`)
      await page.waitForURL((u) => u.origin === NEW, { timeout: 10_000 })
      expect(page.url()).toBe(`${NEW}/`)
      expect(requested.filter((u) => /example\.com/.test(u))).toEqual([])
      await context.close()
    })
  }
})

test.describe('書き出しと、新サイトへの読み込み(別オリジン)', () => {
  test('正常な進捗: 書き出し → 新サイトの「インポート」で、5 つの記録が保たれる。旧側の元データは変わらない', async ({ browser }) => {
    const oldCtx = await browser.newContext()
    const seed = JSON.stringify(full)
    await prepare(oldCtx, seed)
    const old = await oldCtx.newPage()
    await old.goto(OLD)
    const [dl] = await Promise.all([old.waitForEvent('download'), old.locator('#btn-export').click()])
    const file = (await dl.path())!
    const exported = JSON.parse(readFileSync(file, 'utf8'))
    expect(exported).toEqual(full) // completed / quiz / questions / reading / lastVisited
    expect(await stored(old)).toBe(seed) // 元データは変わらない
    const log = await lsLog(old)
    expect({ set: log.set, remove: log.remove, clear: log.clear }).toEqual({ set: [], remove: [], clear: 0 })
    expect(new Set(log.get)).toEqual(new Set([KEY])) // 読んだのは、進捗のキーだけ

    const newCtx = await browser.newContext() // 新サイトの模擬は、別のオリジン・別のブラウザデータ
    const fresh = await newCtx.newPage()
    await fresh.goto(`${NEW}/progress/`)
    await fresh.locator('input[type=file]').setInputFiles(file)
    await expect(fresh.getByRole('status').filter({ hasText: '進捗を読み込みました' })).toBeVisible()
    expect(JSON.parse((await fresh.evaluate((k) => localStorage.getItem(k), KEY))!)).toEqual(full)
    await oldCtx.close()
    await newCtx.close()
  })

  test('questions / reading のない古い形式: 書き出しで補われ、新サイトで読み込める', async ({ browser }) => {
    const legacy = { version: 1, completed: { 'e-1': '2026-10-02T00:00:00.000Z' }, quiz: {} }
    const oldCtx = await browser.newContext()
    await prepare(oldCtx, JSON.stringify(legacy))
    const old = await oldCtx.newPage()
    await old.goto(OLD)
    const [dl] = await Promise.all([old.waitForEvent('download'), old.locator('#btn-export').click()])
    const exported = JSON.parse(readFileSync((await dl.path())!, 'utf8'))
    expect(exported).toEqual({ ...legacy, questions: {}, reading: {} })
    const newCtx = await browser.newContext()
    const fresh = await newCtx.newPage()
    await fresh.goto(`${NEW}/progress/`)
    await fresh.locator('input[type=file]').setInputFiles((await dl.path())!)
    await expect(fresh.getByRole('status').filter({ hasText: '進捗を読み込みました' })).toBeVisible()
    await oldCtx.close()
    await newCtx.close()
  })

  test('新サイトにすでに進捗がある場合: 「インポート」は置き換える(混ぜない)。案内の文面どおり', async ({ browser }) => {
    const newCtx = await browser.newContext()
    const existing = { ...emptyOk, completed: { 'st-9': '2026-10-04T00:00:00.000Z' }, lastVisited: 'st-9' }
    await newCtx.addInitScript(([k, v]) => localStorage.getItem(k) === null && localStorage.setItem(k, v), [KEY, JSON.stringify(existing)])
    const oldCtx = await browser.newContext()
    await prepare(oldCtx, JSON.stringify(full))
    const old = await oldCtx.newPage()
    await old.goto(OLD)
    await expect(old.getByText('置き換えます')).toBeVisible() // 案内の文面
    await expect(old.getByText('新サイトの側でも「エクスポート」を押して、バックアップを取ってください')).toBeVisible()
    const [dl] = await Promise.all([old.waitForEvent('download'), old.locator('#btn-export').click()])
    const fresh = await newCtx.newPage()
    await fresh.goto(`${NEW}/progress/`)
    await fresh.locator('input[type=file]').setInputFiles((await dl.path())!)
    await expect(fresh.getByRole('status').filter({ hasText: '進捗を読み込みました' })).toBeVisible()
    const after = JSON.parse((await fresh.evaluate((k) => localStorage.getItem(k), KEY))!)
    expect(after).toEqual(full)
    expect(after.completed['st-9']).toBeUndefined() // 新サイトの既存の記録は、置き換えで消える
    await oldCtx.close()
    await newCtx.close()
  })

  test('壊れた元データの「そのまま保存」は、新サイトで読み込めないことがある(約束しない)', async ({ browser }) => {
    const oldCtx = await browser.newContext()
    await prepare(oldCtx, '{broken')
    const old = await oldCtx.newPage()
    await old.goto(OLD)
    const [dl] = await Promise.all([old.waitForEvent('download'), old.locator('#btn-raw').click()])
    const newCtx = await browser.newContext()
    const fresh = await newCtx.newPage()
    await fresh.goto(`${NEW}/progress/`)
    await fresh.locator('input[type=file]').setInputFiles((await dl.path())!)
    await expect(fresh.getByRole('status').filter({ hasText: '読み込めませんでした' })).toBeVisible()
    expect(await fresh.evaluate((k) => localStorage.getItem(k), KEY)).toBeNull() // 新側も壊れない
    await oldCtx.close()
    await newCtx.close()
  })
})

test.describe('データの扱い(静的・実行時)', () => {
  test('rescue.js は、書き込み・削除・送信・計測・全体の列挙をしない', () => {
    const src = readFileSync('legacy-rescue/rescue.js', 'utf8').replace(/\/\/.*$/gm, '')
    for (const bad of ['setItem', 'removeItem', 'clear()', 'sessionStorage', 'fetch(', 'XMLHttpRequest', 'sendBeacon', 'WebSocket', 'indexedDB', 'document.cookie', 'localStorage.key', 'localStorage.length', 'Object.keys(localStorage']) {
      expect(src.includes(bad), bad).toBe(false)
    }
  })

  test('通信は、旧サイトのオリジンの静的ファイルだけ(POST なし、外部ホストなし)', async ({ browser }) => {
    const context = await browser.newContext()
    await prepare(context, JSON.stringify(full))
    const page = await context.newPage()
    const reqs: { method: string; url: string }[] = []
    page.on('request', (r) => reqs.push({ method: r.method(), url: r.url() }))
    await page.goto(OLD)
    await expect(page.locator('#btn-export')).toBeVisible()
    await page.locator('#btn-export').click()
    await page.waitForTimeout(500)
    expect(reqs.filter((r) => r.method !== 'GET')).toEqual([])
    expect(reqs.filter((r) => !r.url.startsWith('http://localhost:4177/'))).toEqual([])
    await context.close()
  })

  test('API キーのような別のキーが保存されていても、書き出しに含まれず、読まれない', async ({ browser }) => {
    const context = await browser.newContext()
    await context.addInitScript(([k, v]) => {
      localStorage.setItem(k, v)
      localStorage.setItem('llm-learning:api-key', 'sk-TEST-DO-NOT-LEAK') // テスト用の偽の値
    }, [KEY, JSON.stringify(full)])
    await context.addInitScript(() => {
      const log: string[] = []
      ;(window as unknown as { __get: string[] }).__get = log
      const g = Storage.prototype.getItem
      Storage.prototype.getItem = function (k: string) { log.push(k); return g.call(this, k) }
    })
    const page = await context.newPage()
    await page.goto(OLD)
    const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('#btn-export').click()])
    expect(readFileSync((await dl.path())!, 'utf8')).not.toContain('sk-TEST')
    expect(await page.evaluate(() => (window as unknown as { __get: string[] }).__get)).toEqual([KEY])
    await context.close()
  })
})
