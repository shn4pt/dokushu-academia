import { go, expect, test } from './fixtures'

// ソフトウェアエンジニアリングの講座(SWE-1〜6)の画面。
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

test('SWE-3: テストの目的、GWS、大きさと範囲、ピラミッド、フレーキー、カバレッジ、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/sw-3'))
  await expect(page.locator('article h1')).toContainText('テストの種類と使い分け')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['変更できるようにする', '80%', '大きさ', 'テストピラミッド', 'アイスクリームコーン', 'フレーキー', 'カバレッジ', 'このサービスの整理']) await expect(art).toContainText(t)
  await answer(page, ['小', '中', '中', '大'], 0)
  await answer(page, ['適切でない', '適切でない', '適切', '適切でない', '適切', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Test Pyramid')
})

test('SWE-4: 技術的負債の起源、利子と元本、4 つの象限、機械学習の負債、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/sw-4'))
  await expect(page.locator('article h1')).toContainText('技術的負債の考え方')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['1992 年', '利子', '元本', '架空の数字', '慎重で、意図しない', 'CACE', '厳密な指標', 'このサービスの整理']) await expect(art).toContainText(t)
  await answer(page, ['慎重・意図した', '無謀・意図した', '無謀・意図しない', '慎重・意図しない'], 0)
  await answer(page, ['適切', '適切でない', '適切', '適切でない', '適切でない', '適切'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('WyCash')
})

test('SWE-5: 情報隠蔽、コンウェイの法則、3 つの向き合い方、マイクロサービスの上乗せ、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/sw-5'))
  await expect(page.locator('article h1')).toContainText('システムの分割と境界')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['情報隠蔽', '流れ図', 'コミュニケーションの構造', '5 段階', '逆コンウェイ戦略', 'マイクロサービス', '証拠は乏しい', 'このサービスの整理']) await expect(art).toContainText(t)
  await answer(page, ['手順ごとに分ける', '変わりそうな判断を隠す', '変わりそうな判断を隠す', '手順ごとに分ける'], 0)
  await answer(page, ['適切でない', '適切', '適切でない', '適切でない', '適切でない', '適切'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Parnas')
})

test('SWE-6: 生産性は測れない、4 つの問い、GSM、QUANTS、DORA の 5 つの指標と落とし穴、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/sw-6'))
  await expect(page.locator('article h1')).toContainText('開発の指標と改善')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['出力が測れない', 'GSM', 'QUANTS', '三角測量', '個人の評価', 'デプロイのやり直し率', 'グッドハートの法則', 'このサービスの整理']) await expect(art).toContainText(t)
  await answer(page, ['目的', '兆し', '指標', '指標'], 0)
  await answer(page, ['適切でない', '適切', '適切でない', '適切でない', '適切', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('DORA')
})

test('講座の目次: ソフトウェアエンジニアリングは、基礎・実践・応用のすべてが公開されている', async ({ page }) => {
  await page.goto(go('/course/swe'))
  await expect(page.getByTestId('writing-status')).toContainText('本文 6 / 予定 6 レッスン')
  await expect(page.locator('.planned-item')).toHaveCount(0)
  await expect(page.locator('.stage-card', { hasText: 'システムの境界と、開発の測り方' })).toBeVisible()
  await page.locator('.stage-card', { hasText: 'システムの境界と、開発の測り方' }).click()
  await expect(page.locator('.lesson-list a')).toHaveCount(2)
})
