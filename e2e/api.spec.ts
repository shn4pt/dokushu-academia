import type { Page, Route } from '@playwright/test'
import { go, expect, test } from './fixtures'

// 実際の API には接続しない。api.anthropic.com への通信を、テストの中で用意した応答に差し替える。
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }
const FAKE_KEY = 'sk-ant-api03-FAKE-KEY-FOR-TESTS'

const sse = (events: [string, object][]) => events.map(([e, d]) => `event: ${e}\ndata: ${JSON.stringify(d)}\n\n`).join('')
const streamBody = (text: string) =>
  sse([
    ['message_start', { type: 'message_start', message: { id: 'msg_test', type: 'message', role: 'assistant', model: 'claude-sonnet-5-5', content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 21, output_tokens: 1 } } }],
    ['content_block_start', { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } }],
    ['content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text } }],
    ['content_block_stop', { type: 'content_block_stop', index: 0 }],
    ['message_delta', { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 12 } }],
    ['message_stop', { type: 'message_stop' }],
  ])

type Seen = { url: string; headers: Record<string, string>; body: any }
async function mockApi(page: Page, handler: (route: Route, seen: Seen) => Promise<void>) {
  const seen: Seen[] = []
  await page.route('https://api.anthropic.com/**', async (route) => {
    const req = route.request()
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS })
    const s: Seen = { url: req.url(), headers: req.headers(), body: req.postData() ? JSON.parse(req.postData()!) : null }
    seen.push(s)
    await handler(route, s)
  })
  // api.anthropic.com 以外への通信が出ていないことも確かめる
  const external: string[] = []
  page.on('request', (r) => {
    const u = new URL(r.url())
    if (!['localhost', 'api.anthropic.com'].includes(u.hostname) && !r.url().startsWith('data:')) external.push(r.url())
  })
  return { seen, external }
}

async function setKey(page: Page) {
  await page.goto(go('/api-key'))
  await page.locator('input[type=password]').fill(FAKE_KEY)
  await page.getByRole('button', { name: '保存する' }).click()
  await expect(page.locator('main')).toContainText('設定済み')
}

test('キーがないときは、応答の例を見られ、実際の出力ではないと表示される', async ({ page }) => {
  await page.goto(go('/lesson/9-1'))
  const pg = page.locator('.playground').first()
  await expect(pg).toContainText('APIキーが未設定')
  await expect(pg.getByRole('button', { name: '実行する' })).toHaveCount(0)
  await pg.getByRole('button', { name: '応答の例を見る' }).click()
  await expect(pg.getByRole('status')).toContainText('実際の API の出力ではありません')
})

test('キーを設定すると、ストリーミングで実行でき、リクエストの中身が正しい', async ({ page }) => {
  const { seen, external } = await mockApi(page, (route) =>
    route.fulfill({ status: 200, headers: { ...CORS, 'content-type': 'text/event-stream' }, body: streamBody('こんにちは、テスト用の応答です。') }),
  )
  await setKey(page)
  await page.goto(go('/lesson/9-1'))
  const pg = page.locator('.playground').first()
  await pg.getByRole('button', { name: '実行する' }).click()
  await expect(pg.getByRole('status')).toContainText('こんにちは、テスト用の応答です。')
  await expect(pg).toContainText('end_turn')

  expect(seen).toHaveLength(1)
  expect(new URL(seen[0].url).pathname).toBe('/v1/messages')
  expect(seen[0].headers['x-api-key']).toBe(FAKE_KEY)
  expect(seen[0].body.stream).toBe(true)
  expect(seen[0].body.max_tokens).toBeGreaterThan(0)
  expect(seen[0].body.messages[0].role).toBe('user')
  expect(external).toEqual([])
})

test('API が 401 を返したら、エラーを表示する(キーは画面に出さない)', async ({ page }) => {
  await mockApi(page, (route) =>
    route.fulfill({ status: 401, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify({ type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } }) }),
  )
  await setKey(page)
  await page.goto(go('/lesson/9-1'))
  await page.locator('.playground').first().getByRole('button', { name: '実行する' }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  expect(await page.locator('body').innerText()).not.toContain(FAKE_KEY)
})

test('接続の確認は、モデル情報の取得で行い、トークンを使うメッセージ API を呼ばない', async ({ page }) => {
  const { seen } = await mockApi(page, (route, s) =>
    route.fulfill({ status: 200, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify({ id: s.url.split('/').pop(), type: 'model', display_name: 'Test', created_at: '2026-01-01T00:00:00Z' }) }),
  )
  await setKey(page)
  await page.getByRole('button', { name: '接続を確認する' }).click()
  await expect(page.getByRole('status').filter({ hasText: /確認|成功|接続/ }).first()).toBeVisible()
  expect(seen.length).toBeGreaterThan(0)
  expect(seen.every((s) => new URL(s.url).pathname.startsWith('/v1/models'))).toBe(true)
})

test('キーは localStorage に保存されず、タブ用の保存を選んだときだけ sessionStorage に置く', async ({ page }) => {
  await setKey(page)
  const mem = await page.evaluate(() => ({ l: JSON.stringify({ ...localStorage }), s: JSON.stringify({ ...sessionStorage }) }))
  expect(mem.l).not.toContain('FAKE-KEY')
  expect(mem.s).not.toContain('FAKE-KEY') // 既定は「このページのメモリのみ」

  await page.getByRole('button', { name: 'キーを削除する' }).click()
  await page.getByText('このタブを閉じるまで保持').click()
  await page.locator('input[type=password]').fill(FAKE_KEY)
  await page.getByRole('button', { name: '保存する' }).click()
  const ses = await page.evaluate(() => ({ l: JSON.stringify({ ...localStorage }), s: JSON.stringify({ ...sessionStorage }) }))
  expect(ses.s).toContain('FAKE-KEY')
  expect(ses.l).not.toContain('FAKE-KEY')
})

test('本番ビルドの CSP が、通信先を自サイトと api.anthropic.com に限定している', async ({ request }) => {
  const html = await (await request.get('/')).text()
  expect(html).toContain('Content-Security-Policy')
  expect(html).toMatch(/connect-src 'self' https:\/\/api\.anthropic\.com/)
})
