import { expect, test } from '@playwright/test'

// 引き継ぎ(hydrate)の診断(Issue #19)。局所的な生成: `npm run build:path:diag`(dist-path-diag/、ベース /)の出力を、ブラウザで引き継ぎ、
// 警告(console の error・warning)と、回復可能なエラー(onRecoverableError の記録)を集める。全 172 レッスンの生成・検査ではない。
// 対象: 記録された不一致 7 件(CodeOrder 4 件: 9-2・9-4・10-2・19-2、数値の末尾 3 件: 1-3・4-3・st-3)と、対照の pm-1。
// ここでは console.error を失敗にするフィクスチャーを使わず、集めた記録そのものを確かめる。
// 実行: npm run build:path:diag && npx playwright test --project=diag
const TARGETS = [
  { id: 'pm-1', note: '対照(試作の対象ページ)' },
  { id: '9-2', note: 'CodeOrder' },
  { id: '9-4', note: 'CodeOrder' },
  { id: '10-2', note: 'CodeOrder' },
  { id: '19-2', note: 'CodeOrder' },
  { id: '1-3', note: '数値の末尾(SVG の cy)' },
  { id: '4-3', note: '数値の末尾(style の opacity)' },
  { id: 'st-3', note: '数値の末尾(SVG の x1)' },
]

for (const t of TARGETS) {
  for (const withProgress of [false, true]) {
    test(`${t.id}(${t.note}): ${withProgress ? '進捗あり' : '進捗なし'}で、警告・回復可能なエラーがない`, async ({ page }) => {
      const logs: string[] = []
      page.on('console', (m) => {
        if (m.type() === 'error' || m.type() === 'warning') logs.push(`${m.type()}: ${m.text().slice(0, 300)}`)
      })
      page.on('pageerror', (e) => logs.push(`pageerror: ${e.message.slice(0, 300)}`))
      if (withProgress) {
        const progress = { version: 1, completed: { 'e-1': '2026-10-02T00:00:00.000Z' }, quiz: {}, questions: {}, reading: {}, lastVisited: t.id }
        await page.addInitScript(([k, v]) => localStorage.setItem(k, v), ['llm-learning:progress', JSON.stringify(progress)])
      }
      await page.goto(`/lesson/${t.id}/`)
      await expect(page.locator('#root[data-ssr="1"]')).toBeAttached() // 生成した HTML を引き継ぐ経路
      await expect(page.locator('html')).toHaveAttribute('data-hydrated', '1') // アプリの効果が走った印
      await page.waitForLoadState('networkidle')
      const recoverable = await page.evaluate(() => (window as unknown as { __recoverableErrors?: string[] }).__recoverableErrors ?? [])
      expect({ recoverable, logs }).toEqual({ recoverable: [], logs: [] })
    })
  }
}
