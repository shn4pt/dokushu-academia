import { go, expect, test } from './fixtures'

// 経営企画の序論(経営企画-1〜6)の画面。
async function answer(page: import('@playwright/test').Page, answers: string[], index: number) {
  const ex = page.locator('.demo').filter({ has: page.getByRole('button', { name: '答え合わせ' }) }).nth(index)
  for (let i = 0; i < answers.length; i++) await ex.locator('.task-row').nth(i).getByRole('button', { name: answers[i], exact: true }).click()
  await ex.getByRole('button', { name: '答え合わせ' }).click()
  await expect(ex).toContainText(`${answers.length} / ${answers.length}`)
}

test('経営企画-1: 計画の種類、5 つのステップ、計画の専門家、成果の証拠の限界、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/pl-1'))
  await expect(page.locator('article h1')).toContainText('経営企画の仕事')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['常設の計画', '前提を置く', 'Deming', '計画の専門家', '1985 年', '17.1%', '因果']) await expect(art).toContainText(t)
  await answer(page, ['常設の計画', '単発の計画', '単発の計画', '不測の事態への計画'], 0)
  await answer(page, ['適切でない', '適切', '適切でない', '適切', '適切でない', '適切'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Principles of Management')
})

test('経営企画-2: 戦略の階層、計画の 3 つの階層、SMART、予算との関係、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/pl-2'))
  await expect(page.locator('article h1')).toContainText('中期計画と予算')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['戦略計画', '戦術計画', '業務計画', 'SMART', 'BCG', '架空の会社', 'このサービスの整理']) await expect(art).toContainText(t)
  await answer(page, ['戦略計画', '戦術計画', '業務計画', '戦術計画'], 0)
  await answer(page, ['適切', '適切でない', '適切でない', '適切', '適切でない', '適切'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Principles of Management')
})

test('経営企画-3: 責任センター、良い指標の条件、ROI と残余利益、バランスト・スコアカード、架空の事業部の数字、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/pl-3'))
  await expect(page.locator('article h1')).toContainText('経営指標の設計')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['責任センター', '目標の一致', 'ROI', '残余利益', 'バランスト・スコアカード', '学習と成長', '架空の事業部']) await expect(art).toContainText(t)
  await answer(page, ['収益センター', '費用センター', '利益センター', '投資センター'], 0)
  await answer(page, ['適切でない', '適切', '適切', '適切でない', '適切でない', '適切'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Managerial Accounting')
})

test('経営企画-4: 事業ポートフォリオ、BCG マトリクス、大きな戦略、成長の方向、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/pl-4'))
  await expect(page.locator('article h1')).toContainText('事業ポートフォリオ')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['BCG', '金のなる木', '問題児', '市場浸透', '多角化', '位置の記述が合っていません', '架空の会社']) await expect(art).toContainText(t)
  await answer(page, ['スター', '金のなる木', '問題児', '負け犬'], 0)
  await answer(page, ['市場浸透', '製品開発', '市場開発', '多角化'], 1)
  await answer(page, ['適切', '適切でない', '適切でない', '適切でない', '適切でない', '適切'], 2)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Principles of Marketing')
})

test('経営企画-5: 外部の力を取り込む方法、戦略的提携、会社法の合併の定義、読んでいない手続き、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/pl-5'))
  await expect(page.locator('article h1')).toContainText('M&A と提携の考え方')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['全体像と考え方', '専門家', '確認した日', 'ジョイント・ベンチャー', '戦略の漂流', '吸収合併', '第 748 条', '読んでいません']) await expect(art).toContainText(t)
  await answer(page, ['合併・買収', 'ジョイント・ベンチャー', 'ライセンス', 'フランチャイズ'], 0)
  await answer(page, ['適切', '適切でない', '適切', '適切でない', '適切', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('会社法')
})

test('経営企画-6: 資本の費用、WACC、資本構成の選択、会社法の募集の根拠、架空の会社の計算、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/pl-6'))
  await expect(page.locator('article h1')).toContainText('資本政策の基礎')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['全体像と考え方', '専門家', '確認した日', 'WACC', '税の盾', 'トレード・オフ', '第 199 条', '架空の会社']) await expect(art).toContainText(t)
  await answer(page, ['負債', '株式', '株式', '負債'], 0)
  await answer(page, ['適切でない', '適切', '適切でない', '適切', '適切でない', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Principles of Finance')
})

test('講座の目次: 経営企画は、基礎・実践・応用のすべてが公開済み', async ({ page }) => {
  await page.goto(go('/course/planning'))
  await expect(page.getByTestId('writing-status')).toContainText('すべての段階が公開済み')
  await expect(page.locator('.stage-card', { hasText: '応用:M&A と資本政策' })).toBeVisible()
  await expect(page.locator('.stage-card', { hasText: '実践:指標とポートフォリオ' })).toBeVisible()
  await expect(page.locator('.planned-item')).toHaveCount(0)
  await page.locator('.stage-card', { hasText: '応用:M&A と資本政策' }).click()
  await expect(page.locator('.lesson-list a')).toHaveCount(2)
})
