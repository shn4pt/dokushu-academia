import { go, expect, test } from './fixtures'

// 会計(法令・基準の講座)の序論(会計-1、会計-2)の画面。
async function answer(page: import('@playwright/test').Page, answers: string[], index: number) {
  const ex = page.locator('.demo').filter({ has: page.getByRole('button', { name: '答え合わせ' }) }).nth(index)
  for (let i = 0; i < answers.length; i++) await ex.locator('.task-row').nth(i).getByRole('button', { name: answers[i], exact: true }).click()
  await ex.getByRole('button', { name: '答え合わせ' }).click()
  await expect(ex).toContainText(`${answers.length} / ${answers.length}`)
}

test('会計-1: 財務会計と管理会計、会社法の条文、計算書類、発生主義、判定問題、クイズ、出典、法令の線引き', async ({ page }) => {
  await page.goto(go('/lesson/ac-1'))
  await expect(page.locator('article h1')).toContainText('会計は何を伝えるか')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['全体像と考え方', '専門家', '確認した日', '2026 年 10 月 10 日', '第 431 条', '一般に公正妥当と認められる企業会計の慣行', '株主資本等変動計算書', '発生主義', '個別の事案は扱いません']) await expect(art).toContainText(t)
  await answer(page, ['財務会計', '管理会計', '管理会計', '財務会計'], 0)
  await answer(page, ['適切', '適切でない', '適切', '適切でない', '適切でない', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('会社法')
  await expect(page.locator('.source-note')).toContainText('会社計算規則')
})

test('会計-2: 貸借対照表の区分、5 つの段階の利益、架空の会社の数字、判定問題、クイズ、出典、法令の線引き', async ({ page }) => {
  await page.goto(go('/lesson/ac-2'))
  await expect(page.locator('article h1')).toContainText('貸借対照表と損益計算書')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['全体像と考え方', '専門家', '確認した日', '資産の部', '純資産の部', '売上総利益', '営業利益', '経常利益', '当期純利益', '架空の会社', '個別の事案は扱いません']) await expect(art).toContainText(t)
  await answer(page, ['流動資産', '固定資産', '流動負債', '固定負債'], 0)
  await answer(page, ['売上総利益', '営業利益', '経常利益', '税引前当期純利益'], 1)
  await answer(page, ['適切でない', '適切', '適切', '適切でない', '適切でない', '適切でない'], 2)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('会社計算規則')
})

test('講座の目次: 会計は、基礎が公開され、実践・応用が準備中。後続の講座の前提として働く', async ({ page }) => {
  await page.goto(go('/course/accounting'))
  await expect(page.getByTestId('writing-status')).toContainText('本文 2 / 予定 6 レッスン')
  await expect(page.locator('.badge', { hasText: '一部公開' })).toBeVisible()
  await expect(page.locator('.stage-card', { hasText: '序論:会計の基礎' })).toBeVisible()
  await expect(page.locator('.planned-item')).toHaveCount(4)
  await page.locator('.stage-card', { hasText: '序論:会計の基礎' }).click()
  await expect(page.locator('.lesson-list a')).toHaveCount(2)
})
