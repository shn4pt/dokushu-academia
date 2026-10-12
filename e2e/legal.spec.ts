import { go, expect, test } from './fixtures'

// 法務の序論(法務-1、法務-2)の画面。
async function answer(page: import('@playwright/test').Page, answers: string[], index: number) {
  const ex = page.locator('.demo').filter({ has: page.getByRole('button', { name: '答え合わせ' }) }).nth(index)
  for (let i = 0; i < answers.length; i++) await ex.locator('.task-row').nth(i).getByRole('button', { name: answers[i], exact: true }).click()
  await ex.getByRole('button', { name: '答え合わせ' }).click()
  await expect(ex).toContainText(`${answers.length} / ${answers.length}`)
}

test('法務-1: 法の階層、施行、慣習と商法、会社法、民法の基本原則、消費者の定義、裁判所、改正の予定、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/lg-1'))
  await expect(page.locator('article h1')).toContainText('事業と法の関わり')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['全体像と考え方', '専門家', '確認した日', '最高法規', '20 日を経過した日', '商慣習', '権利の濫用', '消費者契約', '将来施行']) await expect(art).toContainText(t)
  await answer(page, ['日本国憲法', '法の適用に関する通則法', '民法', '商法', '消費者契約法', '民法'], 0)
  await answer(page, ['適切でない', '適切でない', '適切', '適切でない', '適切', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('日本国憲法')
})

test('法務-2: 契約の成立と自由、意思表示、典型契約、約束が守られないとき、定型約款、消費者契約法、改正の予定、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/lg-2'))
  await expect(page.locator('article h1')).toContainText('契約の基本')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['全体像と考え方', '専門家', '確認した日', '第 522 条', '公序良俗', '錯誤', '催告による解除', '定型約款', '消費者契約法']) await expect(art).toContainText(t)
  await answer(page, ['契約の成立(第 522 条)', '公序良俗(第 90 条)', '錯誤(第 95 条)', '詐欺(第 96 条)', '債務不履行(第 415 条)', '解除(第 541・542 条)'], 0)
  await answer(page, ['適切', '適切でない', '適切でない', '適切', '適切でない', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('民法')
})

test('講座の目次: 法務は、基礎が公開され、実践・応用が準備中', async ({ page }) => {
  await page.goto(go('/course/legal'))
  await expect(page.getByTestId('writing-status')).toContainText('本文 2 / 予定 6 レッスン')
  await expect(page.locator('.badge', { hasText: '一部公開' })).toBeVisible()
  await expect(page.locator('.stage-card', { hasText: '序論:事業と法の関わり、契約の基本' })).toBeVisible()
  await expect(page.locator('.planned-item')).toHaveCount(4)
  await page.locator('.stage-card', { hasText: '序論:事業と法の関わり、契約の基本' }).click()
  await expect(page.locator('.lesson-list a')).toHaveCount(2)
})
