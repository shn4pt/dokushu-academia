import { go, expect, test } from './fixtures'

// プロダクトマネジメントの序論・実践(PM-1〜PM-5)の画面。
async function answer(page: import('@playwright/test').Page, answers: string[], index: number) {
  const ex = page.locator('.demo').filter({ has: page.getByRole('button', { name: '答え合わせ' }) }).nth(index)
  for (let i = 0; i < answers.length; i++) await ex.locator('.task-row').nth(i).getByRole('button', { name: answers[i], exact: true }).click()
  await ex.getByRole('button', { name: '答え合わせ' }).click()
  await expect(ex).toContainText(`${answers.length} / ${answers.length}`)
}

test('PM-1: PM の責任、役割の違い、4 つのリスク、プロダクトチームと機能チーム、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/pm-1'))
  await expect(page.locator('article h1')).toContainText('PM の仕事の全体像')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['顧客の代弁者', 'プロジェクトマネージャー', 'Scrum Guide', '4 つのリスク', '機能チーム', '非標準の用語', 'この講座の出典と限界']) await expect(art).toContainText(t)
  await answer(page, ['価値', '使いやすさ', '実現可能性', '事業としての成り立ち', '事業としての成り立ち'], 0)
  await answer(page, ['適切', '適切でない', '適切でない', '適切でない', '適切でない', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Scrum')
})

test('PM-2: 依頼を問題に直す、機会と解決策、成果、利用者の必要の文、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/pm-2'))
  await expect(page.locator('article h1')).toContainText('課題と解決策を分ける')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['解決策の形', 'ダブルダイヤモンド', '機会解決策ツリー', 'プロダクトの成果', '利用者の必要の文', '問題を分けるときの、問い']) await expect(art).toContainText(t)
  await answer(page, ['機会(必要・困りごと)', '解決策', '機会(必要・困りごと)', '解決策', '解決策'], 0)
  await answer(page, ['適切でない', '適切', '適切でない', '適切', '適切でない', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('GOV.UK')
})

test('PM-3: 継続的な発見、顧客インタビュー、仮定のテスト、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/pm-3'))
  await expect(page.locator('article h1')).toContainText('顧客の理解と調査')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['継続的な発見', '知識の呪い', 'プロダクトトリオ', '過去の具体的な話', '最もリスクの高い仮定', '発見の問い']) await expect(art).toContainText(t === '発見の問い' ? '判断につなげる、問い' : t)
  await answer(page, ['顧客インタビューである', '顧客インタビューではない', '顧客インタビューではない', '顧客インタビューではない', '顧客インタビューである'], 0)
  await answer(page, ['適切', '適切', '適切でない', '適切でない', '適切でない', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Product Talk')
})

test('PM-4: RICE の計算、6 つの方法、Torres の観点、Cagan の批判、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/pm-4'))
  await expect(page.locator('article h1')).toContainText('優先順位のつけ方')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['RICE', '675', '800', 'Atlassian', '宣伝', '労力を入れません', 'Cagan', '意見の違いを並べる']) await expect(art).toContainText(t)
  await answer(page, ['Intercom の RICE の記事', 'Cagan の Product Roadmaps', 'Cagan の Product Roadmaps', 'Intercom の RICE の記事'], 0)
  await answer(page, ['適切', '適切でない', '適切', '適切でない', '適切でない', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Intercom')
})

test('PM-5: PULSE と HEART、Goals–Signals–Metrics、北極星指標、成果の種類、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/pm-5'))
  await expect(page.locator('article h1')).toContainText('指標の設計')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['PULSE', 'HEART', 'Goals–Signals–Metrics', '北極星指標', 'ベンダー', 'プロダクトの成果']) await expect(art).toContainText(t)
  await answer(page, ['Happiness', 'Engagement', 'Retention', 'Task success', 'Task success'], 0)
  await answer(page, ['適切', '適切', '適切でない', '適切でない', '適切でない', '適切'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('CHI 2010')
})

test('PM-6: プロダクト戦略の 2 つの定義、4 つの要件、Atlassian、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/pm-6'))
  await expect(page.locator('article h1')).toContainText('プロダクト戦略')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['どの問題を解くか', '焦点', '洞察', 'Rumelt', '2008 年の記事', '宣伝', '戦略を点検する問い']) await expect(art).toContainText(t)
  await answer(page, ['2008 年の記事', '2020 年の記事', '2008 年の記事', '2020 年の記事', '2008 年の記事'], 0)
  await answer(page, ['適切', '適切でない', '適切でない', '適切', '適切でない', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('SVPG')
})

test('PM-7: 利害関係者、意見の戦い、仕事を見せる、アンチパターン、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/pm-7'))
  await expect(page.locator('article h1')).toContainText('ステークホルダーとの合意')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['HiPPO', '新しい情報', '仕事を見せる', '4 つのアンチパターン', '合意の前に確認する問い']) await expect(art).toContainText(t)
  await answer(page, ['勧められる行動', '避けるべき行動', '避けるべき行動', '勧められる行動', '避けるべき行動', '勧められる行動'], 0)
  await answer(page, ['適切', '適切でない', '適切でない', '適切', '適切でない', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Torres')
})

test('講座の目次: プロダクトマネジメントは、基礎・実践・応用のすべてが公開済み', async ({ page }) => {
  await page.goto(go('/course/pm'))
  await expect(page.getByTestId('writing-status')).toContainText('すべての段階が公開済み')
  await expect(page.locator('.stage-card', { hasText: '応用:戦略と合意' })).toBeVisible()
  await expect(page.locator('.stage-card', { hasText: '実践:発見・優先順位・計測' })).toBeVisible()
  await expect(page.locator('.planned-item')).toHaveCount(0)
  await page.locator('.stage-card', { hasText: '応用:戦略と合意' }).click()
  await expect(page.locator('.lesson-list a')).toHaveCount(2)
})
