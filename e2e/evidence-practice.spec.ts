import { go, expect, test } from './fixtures'

// 根拠の読み方・実践(根拠-2、根拠-3)の画面。数字の照合は ucb.spec.ts・ppv.spec.ts。
test('根拠-2: 見出し・部品・判定問題・クイズ・出典がそろい、内部リンクで根拠-1 に移れる', async ({ page }) => {
  await page.goto(go('/lesson/e-2'))
  await expect(page.locator('article h1')).toContainText('同じデータが、見方で逆になる')
  await expect(page.locator('article h3')).toHaveCount(7) // 本文 6 + 確認クイズ
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  await expect(page.locator('.source-note summary')).toContainText('原典・公式で確認')
  await expect(page.locator('article')).toContainText('論文の本文を読んでいません')
  const ex = page.locator('.demo').filter({ has: page.getByRole('button', { name: '答え合わせ' }) })
  const answers = ['適切でない', '適切', '適切でない', '適切でない', '適切でない', '適切でない']
  for (let i = 0; i < answers.length; i++) await ex.locator('.task-row').nth(i).getByRole('button', { name: answers[i], exact: true }).click()
  await ex.getByRole('button', { name: '答え合わせ' }).click()
  await expect(ex).toContainText('6 / 6')
  await page.locator('article a', { hasText: '根拠-1' }).first().click()
  await expect(page).toHaveURL(/#\/lesson\/e-1$/)
})

test('根拠-3: 定義・式・6 つの原則・判定問題・クイズ・出典がそろう', async ({ page }) => {
  await page.goto(go('/lesson/e-3'))
  await expect(page.locator('article h1')).toContainText('再現されない研究と、p 値の読み方')
  await expect(page.locator('article h3')).toHaveCount(6)
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['再現可能性(reproducibility)', '追試可能性(replicability)', 'PPV = (1 − β) R / (R − βR + α)', '研究の結果が真実でありにくい場合', 'ASA', 'モデルにもとづく議論', '本文の、ほかの議論は読んでいません']) await expect(art).toContainText(t)
  await expect(art.locator('ol').nth(1).locator('li')).toHaveCount(6) // 6 つの系
  const ex = page.locator('.demo').filter({ has: page.getByRole('button', { name: '答え合わせ' }) })
  const answers = ['適切でない', '適切でない', '適切でない', '適切でない', '適切', '適切']
  for (let i = 0; i < answers.length; i++) await ex.locator('.task-row').nth(i).getByRole('button', { name: answers[i], exact: true }).click()
  await ex.getByRole('button', { name: '答え合わせ' }).click()
  await expect(ex).toContainText('6 / 6')
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Why Most Published Research Findings Are False')
  await expect(page.locator('.source-note')).toContainText('National Academies')
})

test('講座の目次: 根拠の読み方は、基礎と実践が公開され、応用は準備中', async ({ page }) => {
  await page.goto(go('/course/evidence'))
  await expect(page.getByTestId('writing-status')).toContainText('本文 3 / 予定 5 レッスン')
  await expect(page.locator('.stage-card', { hasText: '実践:研究を読む' })).toBeVisible()
  await expect(page.locator('.planned-item')).toHaveCount(2) // 応用の 2 件
  await page.locator('.stage-card', { hasText: '実践:研究を読む' }).click()
  await expect(page.locator('.lesson-list a')).toHaveCount(2)
})

test('検索: 新しいレッスンの本文が見つかる', async ({ page }) => {
  await page.goto(go('/search?q=' + encodeURIComponent('シンプソン')))
  await expect(page.locator('.result').first()).toContainText('見方で逆に')
  await page.goto(go('/search?q=' + encodeURIComponent('追試可能性')))
  await expect(page.locator('.result').first()).toContainText('再現されない研究')
})
