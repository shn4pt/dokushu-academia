import { go, expect, test } from './fixtures'

// データ分析・統計の基礎(統計-2)・実践(統計-3、統計-4)・応用(統計-5、統計-6)の画面。数字の照合は descriptive・ci・power・sampleSize・peek・confounding の各 spec。
async function answer(page: import('@playwright/test').Page, answers: string[]) {
  const ex = page.locator('.demo').filter({ has: page.getByRole('button', { name: '答え合わせ' }) })
  for (let i = 0; i < answers.length; i++) await ex.locator('.task-row').nth(i).getByRole('button', { name: answers[i], exact: true }).click()
  await ex.getByRole('button', { name: '答え合わせ' }).click()
  await expect(ex).toContainText(`${answers.length} / ${answers.length}`)
}

test('統計-2: 母集団と標本、ばらつきの尺度の表、分布の例、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/st-2'))
  await expect(page.locator('article h1')).toContainText('平均・ばらつき・分布')
  await expect(page.locator('article h3')).toHaveCount(6) // 本文 5 + 確認クイズ
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['点推定', '中央絶対偏差(MAD)', '四分位範囲', 'コーシー分布', '998.389', '118,953.6', '0.997', '標準偏差は、ばらつきの尺度として、役に立たない']) await expect(art).toContainText(t)
  await answer(page, ['適切でない', '適切', '適切でない', '適切でない', '適切', '適切でない'])
  await expect(page.locator('.source-note summary')).toContainText('原典・公式で確認')
})

test('統計-3: 区間の式、例、「95%」の注意、デモ、検定との対応、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/st-3'))
  await expect(page.locator('article h1')).toContainText('信頼区間と、誤差の見方')
  await expect(page.locator('article h3')).toHaveCount(6)
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['標本の平均 ± t', '約 1.04 から 4.96', '(9.258242, 9.264679)', '確率が 95% である、という意味ではない', '検定と信頼区間', 'Wilson']) await expect(art).toContainText(t)
  await answer(page, ['適切でない', '適切', '適切', '適切', '適切', '適切'])
  await page.locator('a', { hasText: '統計-4' }).first().click()
  await expect(page).toHaveURL(/#\/lesson\/st-4$/)
})

test('統計-4: 帰無仮説、2 種類の誤り、デモ、棄却できないことの意味、落とし穴、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/st-4'))
  await expect(page.locator('article h1')).toContainText('仮説検定の考え方と落とし穴')
  await expect(page.locator('article h3')).toHaveCount(6)
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['帰無仮説', '第 1 種の誤り(α)', '第 2 種の誤り(β)', '検出力(1 − β)', '約 78%', '約 64%', '「有意でなかった」ことは、「差がない」ことの証拠ではありません', 'ASA']) await expect(art).toContainText(t)
  await answer(page, ['適切でない', '適切', '適切', '適切', '適切でない', '適切でない'])
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('7.1.3')
})

test('講座の目次: データ分析・統計は、基礎・実践・応用がそろい、公開中', async ({ page }) => {
  await page.goto(go('/course/statistics'))
  await expect(page.getByTestId('writing-status')).toContainText('本文 6 / 予定 6 レッスン')
  await expect(page.locator('.badge', { hasText: '公開中' }).first()).toBeVisible()
  await expect(page.locator('.stage-card', { hasText: '実践:推定と検定' })).toBeVisible()
  await expect(page.locator('.stage-card', { hasText: '応用:実験と因果' })).toBeVisible()
  await expect(page.locator('.planned-item')).toHaveCount(0)
  await page.locator('.stage-card', { hasText: '序論:データから何が言えるか' }).click()
  await expect(page.locator('.lesson-list a')).toHaveCount(2) // 統計-1・統計-2
})

test('統計-5: OEC、必要な数の式と例、結果を見る回数、落とし穴、デモ 2 つ、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/st-5'))
  await expect(page.locator('article h1')).toContainText('A/B テストの設計')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['OEC', 'n = 16 σ² / Δ²', '409,600', '121,600', '7,600', '6,400', '約 25 倍', '5 倍']) await expect(art).toContainText(t)
  await expect(page.locator('.samplesize-lab')).toBeVisible()
  await expect(page.locator('.peek-lab')).toBeVisible()
  await answer(page, ['適切でない', '適切', '適切でない', '適切でない', '適切', '適切でない', '適切でない'])
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Kohavi')
})

test('統計-6: 関連と因果、交絡のデモ、3 つの条件、確認できない仮定、目標試験、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/st-6'))
  await expect(page.locator('article h1')).toContainText('観察データから因果を考える')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['交絡', '+14 ポイント', '−10 ポイント', '条件つき交換可能性', '正値性', '確認できない仮定', '目標試験']) await expect(art).toContainText(t)
  await expect(page.locator('.confound-lab')).toBeVisible()
  await answer(page, ['適切でない', '適切でない', '適切', '適切でない', '適切でない', '適切'])
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Hernán')
})

test('検索: 新しいレッスンの本文が見つかる', async ({ page }) => {
  await page.goto(go('/search?q=' + encodeURIComponent('棄却域')))
  await expect(page.locator('.result').first()).toContainText('仮説検定')
  await page.goto(go('/search?q=' + encodeURIComponent('中央絶対偏差')))
  await expect(page.locator('.result').first()).toContainText('平均・ばらつき')
})

test('検索: 応用のレッスンの本文が見つかる', async ({ page }) => {
  await page.goto(go('/search?q=' + encodeURIComponent('目標試験')))
  await expect(page.locator('.result').first()).toContainText('観察データから因果')
  await page.goto(go('/search?q=' + encodeURIComponent('新奇性')))
  await expect(page.locator('.result').first()).toContainText('A/B テスト')
})
