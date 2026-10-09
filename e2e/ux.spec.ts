import { go, expect, test } from './fixtures'

// UX・ユーザーリサーチの序論(UX-1、UX-2)の画面。
async function answer(page: import('@playwright/test').Page, answers: string[], index: number) {
  const ex = page.locator('.demo').filter({ has: page.getByRole('button', { name: '答え合わせ' }) }).nth(index)
  for (let i = 0; i < answers.length; i++) await ex.locator('.task-row').nth(i).getByRole('button', { name: answers[i], exact: true }).click()
  await ex.getByRole('button', { name: '答え合わせ' }).click()
  await expect(ex).toContainText(`${answers.length} / ${answers.length}`)
}

test('UX-1: UX と使いやすさ、5 つの要素、ヒューリスティック、ユーザーテストと 5 人の議論、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/ux-1'))
  await expect(page.locator('article h1')).toContainText('使いやすさとは何か')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['学びやすさ', 'utility', '10 のヒューリスティック', '想起より再認', 'Faulkner', '55%', '利害のある当事者の主張', 'この講座の出典と限界']) await expect(art).toContainText(t)
  await answer(page, ['UX(ユーザー体験)', 'UI(ユーザーインターフェース)', '使いやすさ', '有用性の中身(utility)', '使いやすさ'], 0)
  await answer(page, ['適切でない', '適切でない', '適切でない', '適切', '適切', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Nielsen')
})

test('UX-2: 利用者を知る、調べ方、言うこととすること、ニーズの書き方、ペルソナ、ジャーニーマップ、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/ux-2'))
  await expect(page.locator('article h1')).toContainText('利用者の課題の捉え方')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['ユーザーニーズ', '仮定', '3 段階離れている', '0.44', 'ペルソナ', 'ジャーニーマップ', '調査を読む、5 つの問い']) await expect(art).toContainText(t)
  await answer(page, ['ニーズ(問題)の形', '解決策の形', 'ニーズ(問題)の形', '解決策の形'], 0)
  await answer(page, ['適切', '適切でない', '適切でない', '適切', '適切でない', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('GOV.UK')
})

test('UX-3: 方法の選び方、研究の問い、同意、質問の作り方、誘導、現場調査、記録と分析、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/ux-3'))
  await expect(page.locator('article h1')).toContainText('インタビューと観察の進め方')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['研究の問い', 'インフォームド・コンセント', '誘導的な閉じた質問', 'コンテキスチュアル・インクワイアリー', '親和図', '調査の方法を選ぶ、問い', 'この講座の出典と限界']) await expect(art).toContainText(t)
  await answer(page, ['誘導的', '誘導的', '誘導的でない', '誘導的', '誘導的でない'], 0)
  await answer(page, ['適切でない', '適切でない', '適切でない', '適切でない', '適切', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('GOV.UK')
})

test('UX-4: ユーザビリティテストの要素、タスクの書き方、思考発話、見学者、成功率と SUS、人数、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/ux-4'))
  await expect(page.locator('article h1')).toContainText('ユーザビリティの検証')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['進行役、タスク、参加者', '手がかり', '思考発話法', '成功率', 'SUS', '39 人', '検証を進める、問い']) await expect(art).toContainText(t)
  await answer(page, ['悪い', '良い', '悪い', '良い', '悪い'], 0)
  await answer(page, ['適切でない', '適切', '適切でない', '適切でない', '適切', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Thinking Aloud')
})

test('UX-5: 発見、重大度の評価、報告の形、チームの巻き込み、KPI、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/ux-5'))
  await expect(page.locator('article h1')).toContainText('調査結果を意思決定につなげる')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['発見', '頻度', '持続性', '3 人の評価の平均', '258 人', '4 つの重要業績指標', '結果を意思決定につなげる、問い']) await expect(art).toContainText(t)
  await answer(page, ['1(見た目だけ)', '4(大惨事)', '2(軽い問題)', '3(大きな問題)'], 0)
  await answer(page, ['適切', '適切でない', '適切でない', '適切', '適切でない', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Severity')
})

test('UX-6: 3 つの軸、定性と定量、三角測量、分析データ、A/B テスト、数字の危険、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/ux-6'))
  await expect(page.locator('article h1')).toContainText('定量と定性の組み合わせ')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['態度的', '三角測量', '評価者効果', '計測計画', '1,378', '蝶々型投票用紙', '組み合わせを設計する、問い']) await expect(art).toContainText(t)
  await answer(page, ['定性', '定量', '定量', '定性', '定量'], 0)
  await answer(page, ['適切でない', '適切', '適切', '適切', '適切でない', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Triangulation')
})

test('講座の目次: UX は、基礎・実践・応用のすべてが公開済み', async ({ page }) => {
  await page.goto(go('/course/ux'))
  await expect(page.getByTestId('writing-status')).toContainText('すべての段階が公開済み')
  await expect(page.locator('.stage-card', { hasText: '応用:結果を判断につなぐ' })).toBeVisible()
  await expect(page.locator('.planned-item')).toHaveCount(0)
  await page.locator('.stage-card', { hasText: '応用:結果を判断につなぐ' }).click()
  await expect(page.locator('.lesson-list a')).toHaveCount(2)
})
