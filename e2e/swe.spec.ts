import { go, expect, test } from './fixtures'

// ソフトウェアエンジニアリングの序論(SWE-1、SWE-2)の画面。
async function answer(page: import('@playwright/test').Page, answers: string[], index: number) {
  const ex = page.locator('.demo').filter({ has: page.getByRole('button', { name: '答え合わせ' }) }).nth(index)
  for (let i = 0; i < answers.length; i++) await ex.locator('.task-row').nth(i).getByRole('button', { name: answers[i], exact: true }).click()
  await ex.getByRole('button', { name: '答え合わせ' }).click()
  await expect(ex).toContainText(`${answers.length} / ${answers.length}`)
}

test('SWE-1: 時間・規模・トレードオフ、Hyrum の法則、NATO の会議、アジャイル宣言、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/sw-1'))
  await expect(page.locator('article h1')).toContainText('ソフトウェアはどう作られるか')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['時間で積分したプログラミング', 'Hyrum の法則', 'シフトレフト', '1968 年', '挑発的', 'アジャイルソフトウェア開発宣言', 'このサービスの整理']) await expect(art).toContainText(t)
  await answer(page, ['プログラミング', 'ソフトウェアエンジニアリング', 'ソフトウェアエンジニアリング', 'プログラミング', 'ソフトウェアエンジニアリング'], 0)
  await answer(page, ['適切でない', '適切', '適切でない', '適切', '適切でない', '適切'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Software Engineering at Google')
})

test('SWE-2: バージョン管理、トランクベース開発、レビューの利点と指針、小さな変更、事例研究、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/sw-2'))
  await expect(page.locator('article h1')).toContainText('バージョン管理とレビュー')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['分散型', 'トランクベース開発', 'コードは負債', 'Nit', '100 行', '24 行', '中央値は 1 人', 'このサービスの整理']) await expect(art).toContainText(t)
  await answer(page, ['分けたほうがよい', 'このままでよい', '分けたほうがよい', 'このままでよい', '分けたほうがよい'], 0)
  await answer(page, ['適切', '適切でない', '適切でない', '適切でない', '適切', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Modern Code Review')
})

test('講座の目次: ソフトウェアエンジニアリングは、基礎が公開され、実践・応用が準備中', async ({ page }) => {
  await page.goto(go('/course/swe'))
  await expect(page.getByTestId('writing-status')).toContainText('本文 2 / 予定 6 レッスン')
  await expect(page.locator('.badge', { hasText: '一部公開' })).toBeVisible()
  await expect(page.locator('.stage-card', { hasText: '序論:ソフトウェアはどう作られるか' })).toBeVisible()
  await expect(page.locator('.planned-item')).toHaveCount(4)
  await page.locator('.stage-card', { hasText: '序論:ソフトウェアはどう作られるか' }).click()
  await expect(page.locator('.lesson-list a')).toHaveCount(2)
})
