import { readFileSync } from 'node:fs'
import { go, expect, test } from './fixtures'
import { ids } from './lessons'

type Entry = { status: string; checkedAt?: string; sources: { how: string }[] }
const recorded = JSON.parse(readFileSync('src/data/lesson-sources.json', 'utf8')) as Record<string, Entry>
const count = (s: string) => ids.filter((id) => (recorded[id]?.status ?? 'unverified') === s).length

test('16-3: 確認の状況・確認日・資料・更新記録が出る', async ({ page }) => {
  await page.goto(go('/lesson/16-3'))
  const sn = page.locator('.source-note')
  await expect(sn.locator('summary')).toContainText('原典・公式で確認')
  await expect(sn.locator('summary')).toContainText('確認日 2026-10-08')
  expect(await sn.evaluate((e) => (e as HTMLDetailsElement).open)).toBe(false)
  await sn.locator('summary').click()
  for (const t of ['Choose a permission mode', 'Configure permissions', 'Automate actions with hooks', 'Configure the sandboxed Bash tool', '確認した版', '作成', 'AI(Claude Code)が執筆'])
    await expect(sn).toContainText(t)
  await expect(sn.locator('a[href^="https://code.claude.com/docs/en/permissions.md"]')).toHaveCount(1)
  await expect(sn.locator('h3')).toHaveCount(0) // しおりの位置の記録に使う見出しを混ぜない
})

test('記録のないレッスンは「未確認」と表示される', async ({ page }) => {
  const id = ids.find((i) => !recorded[i])
  test.skip(!id, '未確認のレッスンがなくなった')
  await page.goto(go(`/lesson/${id}`))
  await expect(page.locator('.source-note summary')).toContainText('未確認')
})

test('独自の整理・検索のみの確認は、そのとおりに表示される', async ({ page }) => {
  await page.goto(go('/lesson/14-1'))
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('業界の標準の分類ではありません')
  await page.goto(go('/lesson/14-2'))
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('原文を読んで確認')
  await expect(page.locator('.source-note')).toContainText('検索結果で確認(原文は未取得)')
  await page.goto(go('/lesson/5-3'))
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('概算であることを明記した')
})

test('一覧ページ: AI 執筆の説明、件数が記録と一致、絞り込み、行からレッスンへ', async ({ page }) => {
  await page.goto(go('/sources'))
  await expect(page.locator('main')).toContainText('AI(Claude Code)が執筆しました')
  await expect(page.locator('main')).toContainText('人(依頼者)が決めています')
  for (const [s, label] of [['verified', '原典・公式で確認'], ['partial', '一部を確認'], ['original', 'このアプリ独自の整理'], ['unverified', '未確認']] as const)
    await expect(page.locator('.source-legend dt', { hasText: label })).toContainText(`${count(s)} レッスン`)
  await expect(page.locator('.source-list li')).toHaveCount(ids.length)
  for (const k of ['verified', 'partial', 'original', 'unverified']) {
    await page.selectOption('select[aria-label="確認の状況で絞り込む"]', k)
    await expect(page.locator('.source-list li')).toHaveCount(count(k))
  }
  await page.selectOption('select[aria-label="確認の状況で絞り込む"]', 'partial')
  await page.locator('.source-list li a').first().click()
  await expect(page.locator('article h1')).toBeVisible()
})

test('フッターから出典ページへ移れる', async ({ page }) => {
  await page.goto(go('/llm'))
  await page.locator('.site-footer a').click()
  await expect(page).toHaveURL(/#\/sources$/)
})

test('記録の整合: 確認済み・一部確認には資料と確認日があり、確認済みは原文を読んでいる', () => {
  for (const id of ids) {
    const e = recorded[id]
    if (!e) continue
    if (e.status === 'verified' || e.status === 'partial') {
      expect(e.sources.length, `${id}: 資料`).toBeGreaterThan(0)
      expect(e.checkedAt, `${id}: 確認日`).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
    if (e.status === 'verified') expect(e.sources.some((s) => s.how === 'read' || s.how === 'repo'), `${id}: 原文を読んだ資料`).toBe(true)
  }
})
