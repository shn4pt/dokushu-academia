import { go, expect, test } from './fixtures'

// 監査・内部統制の序論(監査-1、監査-2)、実践(監査-3、監査-4)、応用(監査-5、監査-6)の画面。
async function answer(page: import('@playwright/test').Page, answers: string[], index: number) {
  const ex = page.locator('.demo').filter({ has: page.getByRole('button', { name: '答え合わせ' }) }).nth(index)
  for (let i = 0; i < answers.length; i++) await ex.locator('.task-row').nth(i).getByRole('button', { name: answers[i], exact: true }).click()
  await ex.getByRole('button', { name: '答え合わせ' }).click()
  await expect(ex).toContainText(`${answers.length} / ${answers.length}`)
}

test('監査-1: 目的と合理的な保証、責任の分担、意見の種類、会社法と金融商品取引法、改正の予定、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/au-1'))
  await expect(page.locator('article h1')).toContainText('なぜ監査が必要か')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['全体像と考え方', '専門家', '確認した日', '合理的な保証', '第 193 条の 2', '第 26 条の 3', '公開草案', '会計監査人']) await expect(art).toContainText(t)
  await answer(page, ['経営者', '経営者', '監査役等', '監査人', '経営者'], 0)
  await answer(page, ['適切でない', '適切でない', '適切', '適切でない', '適切でない', '適切'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('監査基準')
})

test('監査-2: 内部統制の定義と基本的要素、限界、評価と報告、金融商品取引法と会社法、2023 年の改訂、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/au-2'))
  await expect(page.locator('article h1')).toContainText('内部統制の考え方')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['全体像と考え方', '専門家', '確認した日', '統制環境', '開示すべき重要な不備', '内部統制報告書', '第 362 条', '機械的に適用すべきでない']) await expect(art).toContainText(t)
  await answer(page, ['統制環境', 'リスクの評価と対応', '統制活動', '情報と伝達', 'モニタリング', 'IT への対応'], 0)
  await answer(page, ['適切でない', '適切', '適切', '適切でない', '適切', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('内部統制')
})

test('監査-3: リスクの評価の流れ、4 つの対応、統制活動、6 つの要件、リスクと統制の対応、整備と運用、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/au-3'))
  await expect(page.locator('article h1')).toContainText('リスクと統制')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['全体像と考え方', '専門家', '確認した日', '動機とプレッシャー', '職務の分掌', '統制上の要点', '期間配分の適切性', '内部統制の実施記録の検証', '必ずしもこの様式による必要はなく']) await expect(art).toContainText(t)
  await answer(page, ['回避', '低減', '移転', '受容'], 0)
  await answer(page, ['適切でない', '適切でない', '適切', '適切でない', '適切', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('実施基準')
})

test('監査-4: 記録の範囲、既存の記録の活用、保存の考え方、縦覧と保存の違い、改正の予定、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/au-4'))
  await expect(page.locator('article h1')).toContainText('証跡の残し方')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['全体像と考え方', '専門家', '確認した日', '第三者による検証', '第 25 条', '第 432 条', '第二十六条第一項', '痕跡が残りにくい']) await expect(art).toContainText(t)
  await answer(page, ['内部統制の実施基準', '金融商品取引法 第 25 条', '会社法 第 432・435 条', '内部統制の実施基準', '会社法 第 432・435 条', '金融商品取引法 第 25 条'], 0)
  await answer(page, ['適切でない', '適切', '適切でない', '適切', '適切', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('第 25 条')
})

test('監査-5: IT への対応、IT の利用、統制目標、全般統制と業務処理統制、評価、過年度の結果、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/au-5'))
  await expect(page.locator('article h1')).toContainText('IT と統制')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['全体像と考え方', '専門家', '確認した日', 'IT 環境への対応', '正当性', '全般統制', '業務処理統制', '特定の年数を機械的に適用すべきものではない']) await expect(art).toContainText(t)
  await answer(page, ['全般統制', '業務処理統制', '全般統制', '業務処理統制', '全般統制', '業務処理統制'], 0)
  await answer(page, ['適切でない', '適切でない', '適切でない', '適切', '適切', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('IT')
})

test('監査-6: 不正の定義、3 つの要因、防ぐ考え方、無効化、監査人の流れ、公開草案、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/au-6'))
  await expect(page.locator('article h1')).toContainText('不正の防止の考え方')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['全体像と考え方', '専門家', '確認した日', '他者を欺く行為', '動機・プレッシャー', '内部通報制度', '無効化', '公開草案', '最終のものではありません']) await expect(art).toContainText(t)
  await answer(page, ['動機・プレッシャー', '機会', '姿勢・正当化', '動機・プレッシャー', '機会', '姿勢・正当化'], 0)
  await answer(page, ['適切でない', '適切', '適切でない', '適切', '適切でない', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('不正リスク対応基準')
})

test('講座の目次: 監査・内部統制は、すべての段階が公開されている', async ({ page }) => {
  await page.goto(go('/course/audit'))
  await expect(page.getByTestId('writing-status')).toContainText('本文 6 / 予定 6 レッスン')
  await expect(page.locator('.badge', { hasText: '公開中' })).toBeVisible()
  await expect(page.locator('.stage-card', { hasText: '序論:監査と内部統制の役割' })).toBeVisible()
  await expect(page.locator('.stage-card', { hasText: '実践:リスクと統制、証跡' })).toBeVisible()
  await expect(page.locator('.stage-card', { hasText: '応用:IT と統制、不正の防止' })).toBeVisible()
  await expect(page.locator('.planned-item')).toHaveCount(0)
  await page.locator('.stage-card', { hasText: '応用:IT と統制、不正の防止' }).click()
  await expect(page.locator('.lesson-list a')).toHaveCount(2)
})
