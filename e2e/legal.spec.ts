import { go, expect, test } from './fixtures'

// 法務の序論(法務-1、法務-2)と実践(法務-3、法務-4)の画面。
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

test('法務-3: 4 つの権利の違い、著作権の中身、職務著作、権利の制限、特許、職務発明、商標、営業秘密、改正の予定、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/lg-3'))
  await expect(page.locator('article h1')).toContainText('知的財産の基本')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['全体像と考え方', '専門家', '確認した日', '方式の履行を要しない', '第 15 条', '第 30 条の 4', '職務発明', '営業秘密', '第 20 条']) await expect(art).toContainText(t)
  await answer(page, ['著作権(著作権法)', '特許権(特許法)', '商標権(商標法)', '営業秘密(不正競争防止法)', '特許権(特許法)', '商標権(商標法)'], 0)
  await answer(page, ['適切でない', '適切', '適切でない', '適切', '適切', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('著作権法')
})

test('法務-4: 個人情報と用語、個人情報取扱事業者、取り扱いの流れ、委員会規則に委ねられた点、将来施行の改正、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/lg-4'))
  await expect(page.locator('article h1')).toContainText('個人情報の取り扱いの全体像')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['全体像と考え方', '専門家', '確認した日', '個人情報取扱事業者', '要配慮個人情報', '第 27 条', '個人情報保護委員会規則', '2028-07-16']) await expect(art).toContainText(t)
  await answer(page, ['取得', '利用', '保管', '事故', '提供', '取得'], 0)
  await answer(page, ['適切', '適切でない', '適切', '適切でない', '適切でない', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('個人情報')
})

test('講座の目次: 法務は、基礎と実践が公開され、応用が準備中', async ({ page }) => {
  await page.goto(go('/course/legal'))
  await expect(page.getByTestId('writing-status')).toContainText('本文 4 / 予定 6 レッスン')
  await expect(page.locator('.badge', { hasText: '一部公開' })).toBeVisible()
  await expect(page.locator('.stage-card', { hasText: '序論:事業と法の関わり、契約の基本' })).toBeVisible()
  await expect(page.locator('.stage-card', { hasText: '実践:知的財産、個人情報' })).toBeVisible()
  await expect(page.locator('.planned-item')).toHaveCount(2)
  await page.locator('.stage-card', { hasText: '実践:知的財産、個人情報' }).click()
  await expect(page.locator('.lesson-list a')).toHaveCount(2)
})
