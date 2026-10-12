import { go, expect, test } from './fixtures'

// 労務の序論(労務-1、労務-2)と実践(労務-3、労務-4)の画面。
async function answer(page: import('@playwright/test').Page, answers: string[], index: number) {
  const ex = page.locator('.demo').filter({ has: page.getByRole('button', { name: '答え合わせ' }) }).nth(index)
  for (let i = 0; i < answers.length; i++) await ex.locator('.task-row').nth(i).getByRole('button', { name: answers[i], exact: true }).click()
  await ex.getByRole('button', { name: '答え合わせ' }).click()
  await expect(ex).toContainText(`${answers.length} / ${answers.length}`)
}

test('労務-1: 雇用の基本の考え方、労働者と使用者、契約で下回れない基準、労働条件の明示、契約期間、解雇、改正の予定、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/lb-1'))
  await expect(page.locator('article h1')).toContainText('雇用の基本的な仕組み')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['全体像と考え方', '専門家', '確認した日', '最低のもの', '事業主のために行為するすべての者', '附則第 143 条', '権利を濫用', '無効']) await expect(art).toContainText(t)
  await answer(page, ['労働基準法', '労働契約法', '最低賃金法', '労働基準法', '労働契約法', '労働基準法'], 0)
  await answer(page, ['適切', '適切でない', '適切でない', '適切', '適切でない', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('労働基準法')
})

test('労務-2: 法定労働時間・休憩・休日、36 協定、割増賃金、年次有給休暇、適用除外、改正の予定、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/lb-2'))
  await expect(page.locator('article h1')).toContainText('労働時間の考え方')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['全体像と考え方', '専門家', '確認した日', '36 協定', '100 時間未満', '2 割 5 分以上', '年次有給休暇', '管理監督者']) await expect(art).toContainText(t)
  await answer(page, ['第 32 条(労働時間)', '第 34 条(休憩)', '第 35 条(休日)', '第 36 条(時間外・休日の労働)', '第 37 条(割増賃金)', '第 39 条(年次有給休暇)'], 0)
  await answer(page, ['適切でない', '適切', '適切', '適切でない', '適切', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('労働基準法')
})

test('労務-3: 募集、雇入れ、在職中、不利益取扱い、退職・解雇・定年、罰則、改正の予定、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/lb-3'))
  await expect(page.locator('article h1')).toContainText('採用から退職までの流れ')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['全体像と考え方', '専門家', '確認した日', '職業安定法', '退職時等の証明', '高年齢者雇用安定法', '30 万円以下の罰金', '作業従事役員等']) await expect(art).toContainText(t)
  await answer(page, ['募集・採用', '雇入れ', '在職中', '退職・解雇・定年', '募集・採用', '退職・解雇・定年'], 0)
  await answer(page, ['適切', '適切でない', '適切', '適切でない', '適切', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('職業安定法')
})

test('労務-4: 就業規則の作成・届出、記載事項、意見聴取、周知、労働契約との関係、改正の予定、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/lb-4'))
  await expect(page.locator('article h1')).toContainText('就業規則の役割')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['全体像と考え方', '専門家', '確認した日', '常時 10 人以上', '意見を聴かなければならない', '周知', '労働契約法第 12 条', '30 万円以下の罰金']) await expect(art).toContainText(t)
  await answer(page, ['労働基準法', '労働契約法', '労働基準法', '労働契約法', '労働基準法', '労働契約法'], 0)
  await answer(page, ['適切でない', '適切', '適切でない', '適切', '適切でない', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('就業規則')
})

test('講座の目次: 労務は、基礎と実践が公開され、応用が準備中', async ({ page }) => {
  await page.goto(go('/course/labor'))
  await expect(page.getByTestId('writing-status')).toContainText('本文 4 / 予定 6 レッスン')
  await expect(page.locator('.badge', { hasText: '一部公開' })).toBeVisible()
  await expect(page.locator('.stage-card', { hasText: '序論:雇用の基本、労働時間' })).toBeVisible()
  await expect(page.locator('.stage-card', { hasText: '実践:採用から退職まで、就業規則' })).toBeVisible()
  await expect(page.locator('.planned-item')).toHaveCount(2)
  await page.locator('.stage-card', { hasText: '実践:採用から退職まで、就業規則' }).click()
  await expect(page.locator('.lesson-list a')).toHaveCount(2)
})
