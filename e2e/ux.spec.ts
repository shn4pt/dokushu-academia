import { go, expect, test } from './fixtures'

// UX・ユーザーリサーチの序論(UX-1、UX-2)の画面。
async function answer(page: import('@playwright/test').Page, answers: string[], index: number) {
  const ex = page.locator('.demo').filter({ has: page.getByRole('button', { name: '答え合わせ' }) }).nth(index)
  for (let i = 0; i < answers.length; i++) await ex.locator('.task-row').nth(i).getByRole('button', { name: answers[i], exact: true }).click()
  await ex.getByRole('button', { name: '答え合わせ' }).click()
  await expect(ex).toContainText(`${answers.length} / ${answers.length}`)
}

test('UX-1: UX と使いやすさ、5 つの要素、ヒューリスティック、ユーザーテストと 5 人の議論、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/ux-1'))
  await expect(page.locator('article h1')).toContainText('使いやすさとは何か')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['学びやすさ', 'utility', '10 のヒューリスティック', '想起より再認', 'Faulkner', '55%', '利害のある当事者の主張', 'この講座の出典と限界']) await expect(art).toContainText(t)
  await answer(page, ['UX(ユーザー体験)', 'UI(ユーザーインターフェース)', '使いやすさ', '有用性の中身(utility)', '使いやすさ'], 0)
  await answer(page, ['適切でない', '適切でない', '適切でない', '適切', '適切', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Nielsen')
})

test('UX-2: 利用者を知る、調べ方、言うこととすること、ニーズの書き方、ペルソナ、ジャーニーマップ、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/ux-2'))
  await expect(page.locator('article h1')).toContainText('利用者の課題の捉え方')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['ユーザーニーズ', '仮定', '3 段階離れている', '0.44', 'ペルソナ', 'ジャーニーマップ', '調査を読む、5 つの問い']) await expect(art).toContainText(t)
  await answer(page, ['ニーズ(問題)の形', '解決策の形', 'ニーズ(問題)の形', '解決策の形'], 0)
  await answer(page, ['適切', '適切でない', '適切でない', '適切', '適切でない', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('GOV.UK')
})

test('講座の目次: UX は、基礎が公開され、実践・応用が準備中', async ({ page }) => {
  await page.goto(go('/course/ux'))
  await expect(page.getByTestId('writing-status')).toContainText('本文 2 / 予定 6 レッスン')
  await expect(page.locator('.badge', { hasText: '一部公開' })).toBeVisible()
  await expect(page.locator('.stage-card', { hasText: '序論:UX と利用者を知る' })).toBeVisible()
  await expect(page.locator('.planned-item')).toHaveCount(4)
  await page.locator('.stage-card', { hasText: '序論:UX と利用者を知る' }).click()
  await expect(page.locator('.lesson-list a')).toHaveCount(2)
})
