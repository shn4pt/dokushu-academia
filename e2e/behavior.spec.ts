import { go, expect, test } from './fixtures'

// 行動心理学・行動経済学の序論(行動心理学-1、行動心理学-2)の画面。
async function answer(page: import('@playwright/test').Page, answers: string[], index: number) {
  const ex = page.locator('.demo').filter({ has: page.getByRole('button', { name: '答え合わせ' }) }).nth(index)
  for (let i = 0; i < answers.length; i++) await ex.locator('.task-row').nth(i).getByRole('button', { name: answers[i], exact: true }).click()
  await ex.getByRole('button', { name: '答え合わせ' }).click()
  await expect(ex).toContainText(`${answers.length} / ${answers.length}`)
}

test('行動心理学-1: プロスペクト理論の方法、3 つの効果、価値関数、ヒューリスティック、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/bh-1'))
  await expect(page.locator('article h1')).toContainText('人は期待値どおりに選ぶのか')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['確実性効果', '反射効果', '孤立効果', '仮想の選択', '82%', '要旨だけ']) await expect(art).toContainText(t)
  await answer(page, ['確実性効果', '反射効果', '孤立効果', '孤立効果'], 0)
  await answer(page, ['適切でない', '適切', '適切でない', '適切', '適切でない', '適切'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Prospect Theory')
})

test('行動心理学-2: Many Labs 2 の設計、結果、意思決定の例、限界、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/bh-2'))
  await expect(page.locator('article h1')).toContainText('バイアスの研究は、繰り返せるのか')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['15,305', '15 件(54%)', '0.15', '偶然のアンカー', '代表的でもない']) await expect(art).toContainText(t)
  await answer(page, ['同じ向きで、有意だった', '同じ向きで、有意だった', 'ほぼゼロまたは逆向きだった', 'ほぼゼロまたは逆向きだった', 'ほぼゼロまたは逆向きだった'], 0)
  await answer(page, ['適切', '適切でない', '適切', '適切でない', '適切でない', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Many Labs 2')
})

test('行動心理学-3: デフォルトの実験と国の比較、効く理由、選択過多、言えること・言えないこと、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/bh-3'))
  await expect(page.locator('article h1')).toContainText('選択の設計')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['オプトイン', '42%', '82%', '16.3%', '63 の条件', '観察データ']) await expect(art).toContainText(t)
  await answer(page, ['オプトイン(明示的な同意)', 'オプトアウト(推定同意)', 'オプトイン(明示的な同意)', 'オプトアウト(推定同意)'], 0)
  await answer(page, ['適切', '適切でない', '適切でない', '適切', '適切でない', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Defaults')
})

test('行動心理学-4: ナッジのメタ分析と訂正、異論、返答、現場の大規模試験、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/bh-4'))
  await expect(page.locator('article h1')).toContainText('ナッジの効果')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['0.43', 'RoBMA', '8.7', '1.4', '決着はなく']) await expect(art).toContainText(t)
  await answer(page, ['Mertens ら(メタ分析)', 'Maier ら(RoBMA)', 'Szaszi ら'], 0)
  await answer(page, ['適切', '適切でない', '適切', '適切', '適切でない', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Nudge')
})

test('行動心理学-5: ダークパターンの定義、調査の結果、効果の実験、点検の問い、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/bh-5'))
  await expect(page.locator('article h1')).toContainText('プロダクトの行動設計と倫理')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['1,818', '11.1%', 'カウントダウンタイマー', '下限', '要旨だけ', '読んでいません']) await expect(art).toContainText(t)
  await answer(page, ['解約しにくい', 'カウントダウンタイマー', '確認での恥', '在庫わずかのメッセージ'], 0)
  await answer(page, ['適切', '適切でない', '適切', '適切でない', '適切でない', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Dark Patterns')
})

test('行動心理学-6: オンライン実験、アイデアの成功率、5 つの予想外の結果、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/bh-6'))
  await expect(page.locator('article h1')).toContainText('実験による検証')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['OEC', '持ち越し効果', 'A/A', '3 分の 1', 'Microsoft']) await expect(art).toContainText(t)
  await answer(page, ['OEC の選び方', 'クリックの記録', '初期の傾向', '持ち越し効果'], 0)
  await answer(page, ['適切', '適切でない', '適切でない', '適切', '適切', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Trustworthy')
})

test('講座の目次: 行動心理学・行動経済学は、基礎・実践・応用のすべてが公開済み', async ({ page }) => {
  await page.goto(go('/course/behavior'))
  await expect(page.getByTestId('writing-status')).toContainText('すべての段階が公開済み')
  await expect(page.locator('.stage-card', { hasText: '応用:行動設計の倫理と検証' })).toBeVisible()
  await expect(page.locator('.stage-card', { hasText: '実践:選択の設計とナッジ' })).toBeVisible()
  await expect(page.locator('.planned-item')).toHaveCount(0)
  await page.locator('.stage-card', { hasText: '応用:行動設計の倫理と検証' }).click()
  await expect(page.locator('.lesson-list a')).toHaveCount(2)
})
