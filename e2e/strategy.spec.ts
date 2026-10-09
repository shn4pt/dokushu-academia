import { go, expect, test } from './fixtures'

// 経営・戦略の入門(経営-1、経営-2)の画面。式の照合は cvp.spec.ts。
async function answer(page: import('@playwright/test').Page, answers: string[], index = -1) {
  const ex = page.locator('.demo').filter({ has: page.getByRole('button', { name: '答え合わせ' }) }).nth(index)
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

test('経営-5: 資本予算、回収期間、ARR、時間価値、NPV と IRR、案 A と B、4 つの方法の使い分け、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/sg-5'))
  await expect(page.locator('article h1')).toContainText('投資の判断')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['資本予算', '回収期間', '会計上の収益率', '貨幣の時間価値', '5,955.08 ドル', '正味現在価値', '内部収益率', '68,400 ドル', '案 A', '+436.7 万円', 'ふるい', '互いに排他的']) await expect(art).toContainText(t)
  await answer(page, ['回収期間', 'ARR', 'NPV', 'IRR', '回収期間'], 0)
  await answer(page, ['適切でない', '適切でない', '適切でない', '適切', '適切', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Managerial Accounting')
})

test('経営-6: リーン・スタートアップ、MVP、革新の会計、ピボット、滑走路、キャンバス、実現可能性分析、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/sg-6'))
  await expect(page.locator('article h1')).toContainText('新規事業の進め方')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['リーン・スタートアップ', '最小限の実用的な製品', '革新の会計', 'ピボット', '11 か月', 'ビジネスモデル・キャンバス', 'リーン・キャンバス', '実現可能性分析', 'go-or-no-go', '実証した研究']) await expect(art).toContainText(t)
  await answer(page, ['拡大(zoom-in)', '縮小(zoom-out)', '顧客セグメント', '顧客のニーズ', 'チャネル'], 0)
  await answer(page, ['適切でない', '適切でない', '適切', '適切でない', '適切でない', '適切'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Entrepreneurship')
})

test('講座の目次: 経営・戦略は、基礎・実践・応用のすべてが公開済み', async ({ page }) => {
  await page.goto(go('/course/strategy'))
  await expect(page.getByTestId('writing-status')).toContainText('すべての段階が公開済み')
  await expect(page.locator('.stage-card', { hasText: '序論:事業とは何か' })).toBeVisible()
  await expect(page.locator('.stage-card', { hasText: '応用:投資と新規事業' })).toBeVisible()
  await expect(page.locator('.planned-item')).toHaveCount(0)
  await page.locator('.stage-card', { hasText: '序論:事業とは何か' }).click()
  await expect(page.locator('.lesson-list a')).toHaveCount(2)
})

test('検索: 経営の語で、レッスンが見つかる', async ({ page }) => {
  await page.goto(go('/search?q=' + encodeURIComponent('損益分岐点')))
  await expect(page.locator('.result').first()).toContainText('費用・収益・利益の構造')
})
