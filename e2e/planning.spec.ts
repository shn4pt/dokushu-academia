import { go, expect, test } from './fixtures'

// 経営企画の序論(経営企画-1、経営企画-2)の画面。
async function answer(page: import('@playwright/test').Page, answers: string[], index: number) {
  const ex = page.locator('.demo').filter({ has: page.getByRole('button', { name: '答え合わせ' }) }).nth(index)
  for (let i = 0; i < answers.length; i++) await ex.locator('.task-row').nth(i).getByRole('button', { name: answers[i], exact: true }).click()
  await ex.getByRole('button', { name: '答え合わせ' }).click()
  await expect(ex).toContainText(`${answers.length} / ${answers.length}`)
}

test('経営企画-1: 計画の種類、5 つのステップ、計画の専門家、成果の証拠の限界、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/pl-1'))
  await expect(page.locator('article h1')).toContainText('経営企画の仕事')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['常設の計画', '前提を置く', 'Deming', '計画の専門家', '1985 年', '17.1%', '因果']) await expect(art).toContainText(t)
  await answer(page, ['常設の計画', '単発の計画', '単発の計画', '不測の事態への計画'], 0)
  await answer(page, ['適切でない', '適切', '適切でない', '適切', '適切でない', '適切'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Principles of Management')
})

test('経営企画-2: 戦略の階層、計画の 3 つの階層、SMART、予算との関係、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/pl-2'))
  await expect(page.locator('article h1')).toContainText('中期計画と予算')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['戦略計画', '戦術計画', '業務計画', 'SMART', 'BCG', '架空の会社', 'このサービスの整理']) await expect(art).toContainText(t)
  await answer(page, ['戦略計画', '戦術計画', '業務計画', '戦術計画'], 0)
  await answer(page, ['適切', '適切でない', '適切でない', '適切', '適切でない', '適切'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Principles of Management')
})

test('講座の目次: 経営企画は、基礎が公開され、実践・応用が準備中', async ({ page }) => {
  await page.goto(go('/course/planning'))
  await expect(page.getByTestId('writing-status')).toContainText('本文 2 / 予定 6 レッスン')
  await expect(page.locator('.badge', { hasText: '一部公開' })).toBeVisible()
  await expect(page.locator('.stage-card', { hasText: '序論:計画と経営企画の役割' })).toBeVisible()
  await expect(page.locator('.planned-item')).toHaveCount(4)
  await page.locator('.stage-card', { hasText: '序論:計画と経営企画の役割' }).click()
  await expect(page.locator('.lesson-list a')).toHaveCount(2)
})
