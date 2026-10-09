import { go, expect, test } from './fixtures'

// 心理学の基礎(心理学-1、心理学-2)の画面。
async function answer(page: import('@playwright/test').Page, answers: string[], index: number) {
  const ex = page.locator('.demo').filter({ has: page.getByRole('button', { name: '答え合わせ' }) }).nth(index)
  for (let i = 0; i < answers.length; i++) await ex.locator('.task-row').nth(i).getByRole('button', { name: answers[i], exact: true }).click()
  await ex.getByRole('button', { name: '答え合わせ' }).click()
  await expect(ex).toContainText(`${answers.length} / ${answers.length}`)
}

test('心理学-1: 定義、学派の移り変わり、現代の分野、WEIRD、3 つの問い、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/ps-1'))
  await expect(page.locator('article h1')).toContainText('心理学は何を明らかにしてきたか')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['心と行動の科学的な研究', '経験的な方法', '内観', '認知革命', '産業・組織心理学', 'WEIRD', '読むときの、3 つの問い']) await expect(art).toContainText(t)
  await answer(page, ['構造主義', '機能主義', '精神分析', 'ゲシュタルト心理学', '行動主義', '人間性心理学', '認知革命'], 0)
  await answer(page, ['適切', '適切でない', '適切でない', '適切', '適切でない', '適切'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Psychology 2e')
})

test('心理学-2: 研究の方法、相関と因果、実験、信頼性と妥当性、査読と再現性、倫理、5 つの問い、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/ps-2'))
  await expect(page.locator('article h1')).toContainText('実験と相関、再現性')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['r = -0.29', '交絡変数', 'ランダム割り付け', '二重盲検', '信頼性', '再現性の危機', 'タスキギー', '心理学の主張を読む、5 つの問い']) await expect(art).toContainText(t)
  await answer(page, ['事例研究', '自然観察', '調査', 'アーカイブ研究', '縦断研究', '実験'], 0)
  await answer(page, ['適切でない', '適切', '適切でない', '適切', '適切でない', '適切でない', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Psychology 2e')
})

test('心理学-3: 注意、記憶のしくみ、容量、誘導、忘却、覚え方、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/ps-3'))
  await expect(page.locator('article h1')).toContainText('注意と記憶')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['非注意性盲目', 'ほぼ半数', '処理水準', '4 ± 1', 'Cowan', '誘導', '忘却曲線', '分散学習', 'この講座の出典と限界']) await expect(art).toContainText(t)
  await answer(page, ['感覚記憶', '短期記憶', 'エピソード記憶', '意味記憶', '手続き記憶'], 0)
  await answer(page, ['適切でない', '適切', '適切', '適切', '適切でない', '適切'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Simons')
})

test('心理学-4: 動機づけの理論、自己決定理論、報酬の効果の割れ方、限界、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/ps-4'))
  await expect(page.locator('article h1')).toContainText('動機づけの理論')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['欲求階層', 'Yerkes-Dodson', '有能感', '自律性', '関係性', '内在化', '128 件', '理論の提唱者自身', '動機づけを見る、問い']) await expect(art).toContainText(t)
  await answer(page, ['無動機', '外的調整', '取り入れ的調整', '同一化的調整', '内発的動機づけ'], 0)
  await answer(page, ['適切でない', '適切でない', '適切', '適切でない', '適切', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Ryan')
})

test('心理学-5: 学習の種類、強化と罰、スケジュール、観察学習、習慣、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/ps-5'))
  await expect(page.locator('article h1')).toContainText('学習と習慣')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['効果の法則', '正の強化', '変動比率', 'Laskowski', '潜在学習', 'ボボ人形', '18 日から 254 日', 'この講座の出典と限界']) await expect(art).toContainText(t)
  await answer(page, ['正の強化', '負の強化', '正の罰', '負の罰', '負の強化'], 0)
  await answer(page, ['適切でない', '適切でない', '適切', '適切でない', '適切', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Lally')
})

test('心理学-6: 同調、服従、Meta-Milgram、スタンフォード監獄実験、集団の意思決定、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/ps-6'))
  await expect(page.locator('article h1')).toContainText('集団と意思決定')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['76%', 'Meta-Milgram', '43.6%', '62.5%', '37.5%', 'スタンフォード監獄実験', '集団思考', '社会的手抜き', '集団の研究を読む、5 つの問い']) await expect(art).toContainText(t)
  await answer(page, ['同調', '服従', '集団思考', '集団極性化', '社会的手抜き'], 0)
  await answer(page, ['適切', '適切でない', '適切でない', '適切でない', '適切', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Meta-Milgram')
})

test('講座の目次: 心理学は、基礎・実践・応用のすべてが公開済み', async ({ page }) => {
  await page.goto(go('/course/psychology'))
  await expect(page.getByTestId('writing-status')).toContainText('すべての段階が公開済み')
  await expect(page.locator('.stage-card', { hasText: '応用:学習・習慣と集団の判断' })).toBeVisible()
  await expect(page.locator('.planned-item')).toHaveCount(0)
  await page.locator('.stage-card', { hasText: '応用:学習・習慣と集団の判断' }).click()
  await expect(page.locator('.lesson-list a')).toHaveCount(2)
})
