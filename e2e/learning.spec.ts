import { go, expect, test } from './fixtures'

// 学び方・動機づけの序論(学び方-1、学び方-2)の画面。
async function answer(page: import('@playwright/test').Page, answers: string[], index: number) {
  const ex = page.locator('.demo').filter({ has: page.getByRole('button', { name: '答え合わせ' }) }).nth(index)
  for (let i = 0; i < answers.length; i++) await ex.locator('.task-row').nth(i).getByRole('button', { name: answers[i], exact: true }).click()
  await ex.getByRole('button', { name: '答え合わせ' }).click()
  await expect(ex).toContainText(`${answers.length} / ${answers.length}`)
}

test('学び方-1: 学習と成績、印象のずれ、学習スタイル、10 の学習方法、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/ln-1'))
  await expect(page.locator('article h1')).toContainText('学び方にも、根拠がある')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['成績(performance)', 'かみ合わせ仮説', '練習テスト', '要旨だけを読みました', 'Roediger と Karpicke']) await expect(art).toContainText(t)
  await answer(page, ['成績(その場の出来)', '学習(長く残る変化)', '成績(その場の出来)', '学習(長く残る変化)'], 0)
  await answer(page, ['適切', '適切', '適切でない', '適切でない', '適切でない', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Bjork')
})

test('学び方-2: 忘却曲線の追試、節約率、位置、24 時間後のジャンプ、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/ln-2'))
  await expect(page.locator('article h1')).toContainText('記憶と忘却のしくみ')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['節約率', '0.582', '0.041', '無意味綴り', '言えること、言えないこと']) await expect(art).toContainText(t)
  await answer(page, ['言える', '言えない', '言える', '言えない', '言える'], 0)
  await answer(page, ['適切でない', '適切', '適切でない', '適切', '適切でない', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Ebbinghaus')
})

test('講座の目次: 学び方は、基礎が公開され、実践・応用が準備中', async ({ page }) => {
  await page.goto(go('/course/learning'))
  await expect(page.getByTestId('writing-status')).toContainText('本文 2 / 予定 6 レッスン')
  await expect(page.locator('.badge', { hasText: '一部公開' })).toBeVisible()
  await expect(page.locator('.stage-card', { hasText: '序論:学び方にも根拠がある' })).toBeVisible()
  await expect(page.locator('.planned-item')).toHaveCount(4)
  await page.locator('.stage-card', { hasText: '序論:学び方にも根拠がある' }).click()
  await expect(page.locator('.lesson-list a')).toHaveCount(2)
})
