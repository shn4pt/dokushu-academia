import { go, expect, test } from './fixtures'

// プロダクトマネジメントの序論(PM-1、PM-2)の画面。
async function answer(page: import('@playwright/test').Page, answers: string[], index: number) {
  const ex = page.locator('.demo').filter({ has: page.getByRole('button', { name: '答え合わせ' }) }).nth(index)
  for (let i = 0; i < answers.length; i++) await ex.locator('.task-row').nth(i).getByRole('button', { name: answers[i], exact: true }).click()
  await ex.getByRole('button', { name: '答え合わせ' }).click()
  await expect(ex).toContainText(`${answers.length} / ${answers.length}`)
}

test('PM-1: PM の責任、役割の違い、4 つのリスク、プロダクトチームと機能チーム、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/pm-1'))
  await expect(page.locator('article h1')).toContainText('PM の仕事の全体像')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['顧客の代弁者', 'プロジェクトマネージャー', 'Scrum Guide', '4 つのリスク', '機能チーム', '非標準の用語', 'この講座の出典と限界']) await expect(art).toContainText(t)
  await answer(page, ['価値', '使いやすさ', '実現可能性', '事業としての成り立ち', '事業としての成り立ち'], 0)
  await answer(page, ['適切', '適切でない', '適切でない', '適切でない', '適切でない', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Scrum')
})

test('PM-2: 依頼を問題に直す、機会と解決策、成果、利用者の必要の文、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/pm-2'))
  await expect(page.locator('article h1')).toContainText('課題と解決策を分ける')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['解決策の形', 'ダブルダイヤモンド', '機会解決策ツリー', 'プロダクトの成果', '利用者の必要の文', '問題を分けるときの、問い']) await expect(art).toContainText(t)
  await answer(page, ['機会(必要・困りごと)', '解決策', '機会(必要・困りごと)', '解決策', '解決策'], 0)
  await answer(page, ['適切でない', '適切', '適切でない', '適切', '適切でない', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('GOV.UK')
})

test('講座の目次: プロダクトマネジメントは、基礎が公開され、実践・応用が準備中', async ({ page }) => {
  await page.goto(go('/course/pm'))
  await expect(page.getByTestId('writing-status')).toContainText('本文 2 / 予定 7 レッスン')
  await expect(page.locator('.badge', { hasText: '一部公開' })).toBeVisible()
  await expect(page.locator('.stage-card', { hasText: '序論:PM の仕事と、課題の捉え方' })).toBeVisible()
  await expect(page.locator('.planned-item')).toHaveCount(5)
  await page.locator('.stage-card', { hasText: '序論:PM の仕事と、課題の捉え方' }).click()
  await expect(page.locator('.lesson-list a')).toHaveCount(2)
})
