import type { Page } from '@playwright/test'
import { go, expect, test } from './fixtures'

// 発展編(Stage 20)のレッスンと、その中の部品。実際の API には接続せず、通信を差し替える。
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }
const FAKE_KEY = 'sk-ant-api03-FAKE-KEY-FOR-TESTS'

for (const [id, title] of [['20-1', 'MCP サーバーを自作する'], ['20-2', '評価を自動化する'], ['20-3', 'プロンプトキャッシュの費用を実測する']] as const) {
  test(`${id}: 表示され、出典の欄がある`, async ({ page }) => {
    await page.goto(go(`/lesson/${id}`))
    await expect(page.locator('article h1')).toContainText(title)
    await expect(page.locator('.source-note')).toBeVisible()
    await expect(page.locator('.source-note summary')).toContainText(id === '20-1' ? '原典・公式で確認' : '一部を確認')
  })
}

test('20-1: ソースの全文が実ファイルから表示される', async ({ page }) => {
  await page.goto(go('/lesson/20-1'))
  await page.getByText('mcpServer.ts の全文を見る').click()
  await expect(page.locator('pre.code-file').filter({ hasText: 'createSupportMcpServer' }).first()).toBeVisible()
})

test('20-1: コードレビューで、正しい行を選ぶと正解になる', async ({ page }) => {
  await page.goto(go('/lesson/20-1'))
  const cr = page.locator('.code-review').first()
  await cr.locator('label').nth(1).click()
  await cr.getByRole('button', { name: /答え合わせ|確認|判定/ }).click()
  await expect(cr).toContainText('標準出力')
})

test('20-2: 評価の部品が、手計算の値を表示する', async ({ page }) => {
  await page.goto(go('/lesson/20-2'))
  await expect(page.locator('#lab-rate')).toContainText('80%')
  await expect(page.locator('#lab-rate')).toContainText('61%〜91%')
  await expect(page.locator('#lab-compare')).toContainText('0.219')
  await expect(page.locator('#lab-kappa')).toContainText('0.70')
  // 件数を 10 / 8 にすると、Wilson の区間は約 49%〜94%
  const rate = page.locator('.eval-lab input[type=range]')
  await rate.nth(0).fill('10')
  await rate.nth(1).fill('8')
  await expect(page.locator('#lab-rate')).toContainText('49%〜94%')
  // 1対7(両方合格は 3)で、p 値は約 0.070
  await rate.nth(2).fill('1')
  await rate.nth(3).fill('7')
  await rate.nth(4).fill('3')
  await expect(page.locator('#lab-compare')).toContainText('0.070')
  await expect(page.locator('#lab-compare')).toContainText('偶然の範囲かもしれない')
})

test('20-2: 判定の演習で、答え合わせができる', async ({ page }) => {
  await page.goto(go('/lesson/20-2'))
  await expect(page.getByText('この結論は言ってよい?')).toBeVisible()
})

test('20-3: 損益分岐の計算が表示される', async ({ page }) => {
  await page.goto(go('/lesson/20-3'))
  await expect(page.locator('#calc-saved')).toContainText('得')
  await page.locator('.cache-calc select').nth(1).selectOption('1h')
  await expect(page.locator('.cache-calc [role=status]')).toContainText('2 回の読み取り')
  await page.locator('.cache-calc select').nth(1).selectOption('5m')
  await expect(page.locator('.cache-calc [role=status]')).toContainText('1 回の読み取り')
})

test('20-3: キーがなければ、説明用の例と表示され、実際の出力ではないと明記される', async ({ page }) => {
  await page.goto(go('/lesson/20-3'))
  const ex = page.locator('.cache-experiment')
  await expect(ex.getByRole('button', { name: '3回実行する' })).toHaveCount(0)
  await ex.getByRole('button', { name: '説明用の例を見る' }).click()
  await expect(ex.getByRole('status')).toContainText('実際の API の出力ではありません')
  await expect(ex.locator('tbody tr')).toHaveCount(3)
})

type Seen = { body: any; headers: Record<string, string> }
async function mockMessages(page: Page, usages: object[]) {
  const seen: Seen[] = []
  await page.route('https://api.anthropic.com/**', async (route) => {
    const req = route.request()
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS })
    seen.push({ body: JSON.parse(req.postData()!), headers: req.headers() })
    const usage = usages[seen.length - 1]
    await route.fulfill({
      status: 200,
      headers: { ...CORS, 'content-type': 'application/json' },
      body: JSON.stringify({ id: 'msg_t', type: 'message', role: 'assistant', model: 'claude-sonnet-5-5', content: [{ type: 'text', text: 'テスト' }], stop_reason: 'end_turn', stop_sequence: null, usage }),
    })
  })
  return seen
}
async function setKey(page: Page) {
  await page.goto(go('/api-key'))
  await page.locator('input[type=password]').fill(FAKE_KEY)
  await page.getByRole('button', { name: '保存する' }).click()
  await expect(page.locator('main')).toContainText('設定済み')
}

test('20-3: 実験(安定した先頭)で、書き込みのあと読み取りになり、キーは画面と保存先に出ない', async ({ page }) => {
  const seen = await mockMessages(page, [
    { input_tokens: 40, output_tokens: 10, cache_creation_input_tokens: 1000, cache_read_input_tokens: 0 },
    { input_tokens: 41, output_tokens: 10, cache_creation_input_tokens: 0, cache_read_input_tokens: 1000 },
    { input_tokens: 42, output_tokens: 10, cache_creation_input_tokens: 0, cache_read_input_tokens: 1000 },
  ])
  await setKey(page)
  await page.goto(go('/lesson/20-3'))
  const ex = page.locator('.cache-experiment')
  await ex.getByRole('button', { name: '3回実行する' }).click()
  await expect(ex.locator('tbody tr')).toHaveCount(3)
  expect(seen).toHaveLength(3)
  for (const s of seen) {
    expect(s.headers['x-api-key']).toBe(FAKE_KEY)
    expect(s.body.system[0].cache_control).toEqual({ type: 'ephemeral' })
  }
  // 先頭の文面は、3回とも同じ
  expect(seen[1].body.system[0].text).toBe(seen[0].body.system[0].text)
  expect(seen[2].body.system[0].text).toBe(seen[0].body.system[0].text)
  await expect(ex.locator('tbody tr').nth(0)).toContainText('1000')
  await expect(ex.locator('tbody tr').nth(1)).toContainText('1000')
  await expect(ex).toContainText('ヒット率')
  await expect(ex).not.toContainText('実際の API の出力ではありません')
  await expect(page.locator('body')).not.toContainText(FAKE_KEY)
})

test('20-3: 実験(先頭に時刻)では、先頭の文面が毎回変わる', async ({ page }) => {
  const seen = await mockMessages(page, [0, 1, 2].map(() => ({ input_tokens: 40, output_tokens: 10, cache_creation_input_tokens: 1000, cache_read_input_tokens: 0 })))
  await setKey(page)
  await page.goto(go('/lesson/20-3'))
  const ex = page.locator('.cache-experiment')
  await ex.getByLabel('先頭に、毎回変わる現在時刻を入れる').check()
  await ex.getByRole('button', { name: '3回実行する' }).click()
  await expect(ex.locator('tbody tr')).toHaveCount(3)
  const heads = seen.map((s) => s.body.system[0].text.split('\n')[0])
  expect(new Set(heads).size).toBe(3)
  expect(heads[0]).toContain('現在時刻')
  await expect(ex).toContainText('0%')
})

test('20-3: API のエラーは、画面に表示される', async ({ page }) => {
  await page.route('https://api.anthropic.com/**', (route) =>
    route.request().method() === 'OPTIONS'
      ? route.fulfill({ status: 204, headers: CORS })
      : route.fulfill({ status: 401, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify({ type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } }) }),
  )
  await setKey(page)
  await page.goto(go('/lesson/20-3'))
  await page.locator('.cache-experiment').getByRole('button', { name: '3回実行する' }).click()
  await expect(page.locator('.cache-experiment [role=alert]')).toBeVisible()
})
