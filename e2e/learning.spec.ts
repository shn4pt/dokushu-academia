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

test('学び方-3: テスト効果の数字、分散学習、望ましい困難、言えること・言えないこと、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/ln-3'))
  await expect(page.locator('article h1')).toContainText('復習の間隔と、思い出す練習')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['SSSS', '83%', '61%', '5〜10%', '望ましい困難', '言えないこと', '要旨だけ']) await expect(art).toContainText(t)
  await answer(page, ['再学習した群が高かった', 'テストを受けた群が高かった', 'テストを受けた群が高かった'], 0)
  await answer(page, ['適切', '適切', '適切でない', '適切でない', '適切でない', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Roediger')
})

test('学び方-4: 実行意図、MCII のメタ分析、出版バイアス、習慣の個人差、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/ln-4'))
  await expect(page.locator('article h1')).toContainText('習慣にして続ける')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['実行意図', '0.336', '0.242', '87.44%', '18 日から 254 日', '言えないこと']) await expect(art).toContainText(t)
  await answer(page, ['「もし〜なら、〜する」の計画', '目標・意図だけ', '目標・意図だけ', '「もし〜なら、〜する」の計画', '目標・意図だけ'], 0)
  await answer(page, ['適切', '適切', '適切', '適切でない', '適切でない', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Wang')
})

test('学び方-5: 仕事と意図的練習、研究の結果と限界、領域による違い、フィードバックの種類、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/ln-5'))
  await expect(page.locator('article h1')).toContainText('経験から学ぶ')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['意図的練習', '7,410', '1% 未満', '0.99', '435 の研究', '要旨だけを読みました']) await expect(art).toContainText(t)
  await answer(page, ['仕事', '意図的練習', '仕事', '意図的練習'], 0)
  await answer(page, ['適切', '適切でない', '適切', '適切でない', '適切でない', '適切'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Ericsson')
})

test('学び方-6: 学習行動と心理的安全、51 チームの調査、結果、限界、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/ln-6'))
  await expect(page.locator('article h1')).toContainText('チームで学ぶ')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['心理的安全', '51 チーム', '.63', 'B = .60', '横断的', '言えないこと']) await expect(art).toContainText(t)
  await answer(page, ['学習行動', '学習行動', '学習行動ではない', '学習行動ではない', '学習行動'], 0)
  await answer(page, ['適切', '適切でない', '適切', '適切でない', '適切でない', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Edmondson')
})

test('講座の目次: 学び方は、基礎・実践・応用のすべてが公開済み', async ({ page }) => {
  await page.goto(go('/course/learning'))
  await expect(page.getByTestId('writing-status')).toContainText('すべての段階が公開済み')
  await expect(page.locator('.stage-card', { hasText: '応用:仕事の中で学ぶ' })).toBeVisible()
  await expect(page.locator('.stage-card', { hasText: '実践:復習と習慣' })).toBeVisible()
  await expect(page.locator('.planned-item')).toHaveCount(0)
  await page.locator('.stage-card', { hasText: '応用:仕事の中で学ぶ' }).click()
  await expect(page.locator('.lesson-list a')).toHaveCount(2)
})
