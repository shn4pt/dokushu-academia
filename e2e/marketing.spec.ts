import { go, expect, test } from './fixtures'

// マーケティングの序論(マーケティング-1、マーケティング-2)の画面。
async function answer(page: import('@playwright/test').Page, answers: string[], index: number) {
  const ex = page.locator('.demo').filter({ has: page.getByRole('button', { name: '答え合わせ' }) }).nth(index)
  for (let i = 0; i < answers.length; i++) await ex.locator('.task-row').nth(i).getByRole('button', { name: answers[i], exact: true }).click()
  await ex.getByRole('button', { name: '答え合わせ' }).click()
  await expect(ex).toContainText(`${answers.length} / ${answers.length}`)
}

test('マーケティング-1: 定義、価値、5 段階、4P、志向の変遷、顧客の必要、CRM、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/ma-1'))
  await expect(page.locator('article h1')).toContainText('価値を届けるとは')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['AMA', '5 段階', '4P', 'マーケティング近視眼', '言葉にされた必要', 'CRM', 'ブログ記事']) await expect(art).toContainText(t)
  await answer(page, ['製品', '価格', '場所', '販促'], 0)
  await answer(page, ['適切', '適切でない', '適切', '適切でない', '適切でない', '適切'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('OpenStax')
})

test('マーケティング-2: セグメント化の軸、B2B、ADAMS、ターゲット設定、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/ma-2'))
  await expect(page.locator('article h1')).toContainText('市場とセグメント')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['ADAMS', '購買センター', 'ペルソナ', '集中(ニッチ)マーケティング', '根拠が示されていないもの']) await expect(art).toContainText(t)
  await answer(page, ['地理', '人口統計', '行動', '行動', '心理', '地理'], 0)
  await answer(page, ['適切', '適切でない', '適切でない', '適切', '適切でない', '適切'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('OpenStax')
})

test('マーケティング-3: STP、2 つの方法、位置づけの文、知覚マップ、倫理、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/ma-3'))
  await expect(page.locator('article h1')).toContainText('ポジショニング')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['STP', '真っ向勝負', '差別化', '知覚マップ', '位置づけの文', '確かめられているかは']) await expect(art).toContainText(t)
  await answer(page, ['真っ向勝負', '真っ向勝負', '差別化', '真っ向勝負', '差別化'], 0)
  await answer(page, ['適切', '適切でない', '適切でない', '適切でない', '適切でない', '適切'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('OpenStax')
})

test('マーケティング-4: 指標と KPI、計算、CLV、教科書の計算の誤り、基準、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/ma-4'))
  await expect(page.locator('article h1')).toContainText('効果測定の考え方')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['KPI', '119,250', '215,250', '270,400', '20%', '62.5%', '教科書の計算の誤り']) await expect(art).toContainText(t)
  await answer(page, ['指標', 'KPI', '指標', 'KPI'], 0)
  await answer(page, ['適切', '適切でない', '適切でない', '適切', '適切でない', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('OpenStax')
})

test('講座の目次: マーケティングは、基礎と実践が公開され、応用が準備中', async ({ page }) => {
  await page.goto(go('/course/marketing'))
  await expect(page.getByTestId('writing-status')).toContainText('本文 4 / 予定 6 レッスン')
  await expect(page.locator('.badge', { hasText: '一部公開' })).toBeVisible()
  await expect(page.locator('.stage-card', { hasText: '序論:価値を届けるとは' })).toBeVisible()
  await expect(page.locator('.planned-item')).toHaveCount(2)
  await expect(page.locator('.stage-card', { hasText: '実践:位置づけと効果測定' })).toBeVisible()
  await page.locator('.stage-card', { hasText: '序論:価値を届けるとは' }).click()
  await expect(page.locator('.lesson-list a')).toHaveCount(2)
})
