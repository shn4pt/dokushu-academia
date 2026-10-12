import { go, expect, test } from './fixtures'

// 監査・内部統制の序論(監査-1、監査-2)の画面。
async function answer(page: import('@playwright/test').Page, answers: string[], index: number) {
  const ex = page.locator('.demo').filter({ has: page.getByRole('button', { name: '答え合わせ' }) }).nth(index)
  for (let i = 0; i < answers.length; i++) await ex.locator('.task-row').nth(i).getByRole('button', { name: answers[i], exact: true }).click()
  await ex.getByRole('button', { name: '答え合わせ' }).click()
  await expect(ex).toContainText(`${answers.length} / ${answers.length}`)
}

test('監査-1: 目的と合理的な保証、責任の分担、意見の種類、会社法と金融商品取引法、改正の予定、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/au-1'))
  await expect(page.locator('article h1')).toContainText('なぜ監査が必要か')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['全体像と考え方', '専門家', '確認した日', '合理的な保証', '第 193 条の 2', '第 26 条の 3', '公開草案', '会計監査人']) await expect(art).toContainText(t)
  await answer(page, ['経営者', '経営者', '監査役等', '監査人', '経営者'], 0)
  await answer(page, ['適切でない', '適切でない', '適切', '適切でない', '適切でない', '適切'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('監査基準')
})

test('監査-2: 内部統制の定義と基本的要素、限界、評価と報告、金融商品取引法と会社法、2023 年の改訂、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/au-2'))
  await expect(page.locator('article h1')).toContainText('内部統制の考え方')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['全体像と考え方', '専門家', '確認した日', '統制環境', '開示すべき重要な不備', '内部統制報告書', '第 362 条', '機械的に適用すべきでない']) await expect(art).toContainText(t)
  await answer(page, ['統制環境', 'リスクの評価と対応', '統制活動', '情報と伝達', 'モニタリング', 'IT への対応'], 0)
  await answer(page, ['適切でない', '適切', '適切', '適切でない', '適切', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('内部統制')
})

test('講座の目次: 監査・内部統制は、基礎が公開され、実践・応用が準備中', async ({ page }) => {
  await page.goto(go('/course/audit'))
  await expect(page.getByTestId('writing-status')).toContainText('本文 2 / 予定 6 レッスン')
  await expect(page.locator('.badge', { hasText: '一部公開' })).toBeVisible()
  await expect(page.locator('.stage-card', { hasText: '序論:監査と内部統制の役割' })).toBeVisible()
  await expect(page.locator('.planned-item')).toHaveCount(4)
  await page.locator('.stage-card', { hasText: '序論:監査と内部統制の役割' }).click()
  await expect(page.locator('.lesson-list a')).toHaveCount(2)
})
