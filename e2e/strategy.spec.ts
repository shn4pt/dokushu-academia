import { go, expect, test } from './fixtures'

// 経営・戦略の入門(経営-1、経営-2)の画面。式の照合は cvp.spec.ts。
async function answer(page: import('@playwright/test').Page, answers: string[]) {
  const ex = page.locator('.demo').filter({ has: page.getByRole('button', { name: '答え合わせ' }) }).last()
  for (let i = 0; i < answers.length; i++) await ex.locator('.task-row').nth(i).getByRole('button', { name: answers[i], exact: true }).click()
  await ex.getByRole('button', { name: '答え合わせ' }).click()
  await expect(ex).toContainText(`${answers.length} / ${answers.length}`)
}

test('経営-1: 事業の定義、収益・費用・利益、生産の要素、4 つの問い、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/sg-1'))
  await expect(page.locator('article h1')).toContainText('事業とは、何をしているのか')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['利益を得ようとする組織', '利益 = 収益 − 費用', '非営利組織', '生産の要素', '事業を見る、4 つの問い']) await expect(art).toContainText(t)
  await answer(page, ['適切でない', '適切でない', '適切', '適切でない', '適切'])
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('OpenStax')
})

test('経営-2: 固定費と変動費、貢献利益、損益分岐点、安全余裕、営業レバレッジ、前提、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/sg-2'))
  await expect(page.locator('article h1')).toContainText('費用・収益・利益の構造')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['固定費 ÷ 単位あたりの貢献利益', '225 個', '425 個', '72,000 ドル', '営業レバレッジ度', '単純化した計算']) await expect(art).toContainText(t)
  await answer(page, ['適切', '適切でない', '適切', '適切でない', '適切', '適切でない', '適切でない'])
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Managerial Accounting')
})

test('経営-3: 業界、5 つの力、Porter の要旨、使うときの注意、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/sg-3'))
  await expect(page.locator('article h1')).toContainText('競争環境の分析')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['5 つの力', '参入障壁', '代替品', '乗り換えの費用', '成長の速い業界が、必ずしも利益の出る業界とは限らない', '本文を読んでいません']) await expect(art).toContainText(t)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Porter')
})

test('経営-4: 競争優位、3 つの基本戦略、費用の構造、戦略グループ、位置取り、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/sg-4'))
  await expect(page.locator('article h1')).toContainText('差別化とコスト')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['競争優位', 'コスト・リーダーシップ', '差別化', '集中', 'どっちつかず', '戦略グループ', '8,000 個']) await expect(art).toContainText(t)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Principles of Management')
})

test('講座の目次: 経営・戦略は、基礎・実践が公開され、応用が準備中', async ({ page }) => {
  await page.goto(go('/course/strategy'))
  await expect(page.getByTestId('writing-status')).toContainText('本文 4 / 予定 6 レッスン')
  await expect(page.locator('.badge', { hasText: '一部公開' })).toBeVisible()
  await expect(page.locator('.stage-card', { hasText: '序論:事業とは何か' })).toBeVisible()
  await expect(page.locator('.planned-item')).toHaveCount(2)
  await page.locator('.stage-card', { hasText: '序論:事業とは何か' }).click()
  await expect(page.locator('.lesson-list a')).toHaveCount(2)
})

test('検索: 経営の語で、レッスンが見つかる', async ({ page }) => {
  await page.goto(go('/search?q=' + encodeURIComponent('損益分岐点')))
  await expect(page.locator('.result').first()).toContainText('費用・収益・利益の構造')
})
