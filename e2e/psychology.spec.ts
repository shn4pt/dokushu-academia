import { go, expect, test } from './fixtures'

// 心理学の基礎(心理学-1、心理学-2)の画面。
async function answer(page: import('@playwright/test').Page, answers: string[], index: number) {
  const ex = page.locator('.demo').filter({ has: page.getByRole('button', { name: '答え合わせ' }) }).nth(index)
  for (let i = 0; i < answers.length; i++) await ex.locator('.task-row').nth(i).getByRole('button', { name: answers[i], exact: true }).click()
  await ex.getByRole('button', { name: '答え合わせ' }).click()
  await expect(ex).toContainText(`${answers.length} / ${answers.length}`)
}

test('心理学-1: 定義、学派の移り変わり、現代の分野、WEIRD、3 つの問い、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/ps-1'))
  await expect(page.locator('article h1')).toContainText('心理学は何を明らかにしてきたか')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['心と行動の科学的な研究', '経験的な方法', '内観', '認知革命', '産業・組織心理学', 'WEIRD', '読むときの、3 つの問い']) await expect(art).toContainText(t)
  await answer(page, ['構造主義', '機能主義', '精神分析', 'ゲシュタルト心理学', '行動主義', '人間性心理学', '認知革命'], 0)
  await answer(page, ['適切', '適切でない', '適切でない', '適切', '適切でない', '適切'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Psychology 2e')
})

test('心理学-2: 研究の方法、相関と因果、実験、信頼性と妥当性、査読と再現性、倫理、5 つの問い、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/ps-2'))
  await expect(page.locator('article h1')).toContainText('実験と相関、再現性')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['r = -0.29', '交絡変数', 'ランダム割り付け', '二重盲検', '信頼性', '再現性の危機', 'タスキギー', '心理学の主張を読む、5 つの問い']) await expect(art).toContainText(t)
  await answer(page, ['事例研究', '自然観察', '調査', 'アーカイブ研究', '縦断研究', '実験'], 0)
  await answer(page, ['適切でない', '適切', '適切でない', '適切', '適切でない', '適切でない', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Psychology 2e')
})

test('講座の目次: 心理学は、基礎が公開され、実践・応用が準備中', async ({ page }) => {
  await page.goto(go('/course/psychology'))
  await expect(page.getByTestId('writing-status')).toContainText('本文 2 / 予定 6 レッスン')
  await expect(page.locator('.badge', { hasText: '一部公開' })).toBeVisible()
  await expect(page.locator('.stage-card', { hasText: '序論:心理学とは何か' })).toBeVisible()
  await expect(page.locator('.planned-item')).toHaveCount(4)
  await page.locator('.stage-card', { hasText: '序論:心理学とは何か' }).click()
  await expect(page.locator('.lesson-list a')).toHaveCount(2)
})
