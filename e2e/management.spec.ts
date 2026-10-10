import { go, expect, test } from './fixtures'

// マネジメントの序論(マネジメント-1、マネジメント-2)の画面。
async function answer(page: import('@playwright/test').Page, answers: string[], index: number) {
  const ex = page.locator('.demo').filter({ has: page.getByRole('button', { name: '答え合わせ' }) }).nth(index)
  for (let i = 0; i < answers.length; i++) await ex.locator('.task-row').nth(i).getByRole('button', { name: answers[i], exact: true }).click()
  await ex.getByRole('button', { name: '答え合わせ' }).click()
  await expect(ex).toContainText(`${answers.length} / ${answers.length}`)
}

test('マネジメント-1: 管理職の観察研究、10 の役割、能力、計画をめぐる意見の違い、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/mg-1'))
  await expect(page.locator('article h1')).toContainText('管理職は、何をしているのか')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['Mintzberg', 'Kotter', '25%', '看板', '概念的な能力', 'Carroll と Gillen', '出典は示されていません']) await expect(art).toContainText(t)
  await answer(page, ['意思決定の役割', '情報の役割', '対人関係の役割', '意思決定の役割', '情報の役割'], 0)
  await answer(page, ['適切', '適切でない', '適切でない', '適切でない', '適切でない', '適切'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Principles of Management')
})

test('マネジメント-2: 目標の種類と階層、目標設定の理論、MBO と効果の割れ方、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/mg-2'))
  await expect(page.locator('article h1')).toContainText('目標は、計画の出発点')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['公式の目標', '運用の目標', '難しく、具体的で', 'MBO', '70 の事例', '185', '食い違って']) await expect(art).toContainText(t)
  await answer(page, ['公式の目標', '運用の目標', '公式の目標', '運用の目標'], 0)
  await answer(page, ['適切', '適切でない', '適切でない', '適切', '適切', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Principles of Management')
})

test('講座の目次: マネジメントは、基礎が公開され、実践・応用が準備中', async ({ page }) => {
  await page.goto(go('/course/management'))
  await expect(page.getByTestId('writing-status')).toContainText('本文 2 / 予定 6 レッスン')
  await expect(page.locator('.badge', { hasText: '一部公開' })).toBeVisible()
  await expect(page.locator('.stage-card', { hasText: '序論:マネジメントと目標' })).toBeVisible()
  await expect(page.locator('.planned-item')).toHaveCount(4)
  await page.locator('.stage-card', { hasText: '序論:マネジメントと目標' }).click()
  await expect(page.locator('.lesson-list a')).toHaveCount(2)
})
