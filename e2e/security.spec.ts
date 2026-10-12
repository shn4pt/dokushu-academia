import { go, expect, test } from './fixtures'

// セキュリティの講座(セキュリティ-1〜6)の画面。
async function answer(page: import('@playwright/test').Page, answers: string[], index: number) {
  const ex = page.locator('.demo').filter({ has: page.getByRole('button', { name: '答え合わせ' }) }).nth(index)
  for (let i = 0; i < answers.length; i++) await ex.locator('.task-row').nth(i).getByRole('button', { name: answers[i], exact: true }).click()
  await ex.getByRole('button', { name: '答え合わせ' }).click()
  await expect(ex).toContainText(`${answers.length} / ${answers.length}`)
}

test('セキュリティ-1: 3 つの目的と影響、攻撃者、内部の人、8 つの設計原則、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/se-1'))
  await expect(page.locator('article h1')).toContainText('何を、誰から守るか')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['機密性', '完全性', '可用性', 'FIPS 199', '内部の人', '最小権限', '安全側の初期値', 'このサービスの整理']) await expect(art).toContainText(t)
  await answer(page, ['機密性', '完全性', '可用性', '完全性', '完全性'], 0)
  await answer(page, ['適切', '適切でない', '適切', '適切でない', '適切でない', '適切'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('FIPS')
})

test('セキュリティ-2: 認証と認可、パスワードの規則、フィッシング耐性、OWASP の推奨、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/se-2'))
  await expect(page.locator('article h1')).toContainText('認証と認可')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['認証', '認可', '15 文字以上', '定期的な変更を求めてはならない', 'フィッシング耐性', '水平の権限昇格', '初期値は拒否', 'このサービスの整理']) await expect(art).toContainText(t)
  await answer(page, ['認証', '認可', '認可', '認証', '認可'], 0)
  await answer(page, ['沿っていない', '沿っていない', '沿っている', '沿っていない', '沿っている', '沿っていない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('800-63B-4')
})

test('セキュリティ-3: Top 10:2025、作り方、インジェクション、設定ミス、サプライチェーン、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/se-3'))
  await expect(page.locator('article h1')).toContainText('Web アプリの代表的な脆弱性')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['Top 10', 'アクセス制御の不備', 'アンケート', 'インジェクション', 'パラメータ化', '設定ミス', 'サプライチェーン', 'このサービスの整理']) await expect(art).toContainText(t)
  await answer(page, ['インジェクション', '設定ミス', 'アクセス制御の不備', 'サプライチェーン', '設定ミス'], 0)
  await answer(page, ['適切でない', '適切', '適切', '適切でない', '適切', '適切でない'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Top 10:2025')
})

test('セキュリティ-4: 漏えいの実態、管理の推奨、置き場所、事故対応、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/se-4'))
  await expect(page.locator('article h1')).toContainText('秘密情報の扱い')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['10 万を超えるリポジトリ', '20 秒', '81%', '一元化', 'ローテーション', '環境変数', '失効', 'このサービスの整理']) await expect(art).toContainText(t)
  await answer(page, ['沿っていない', '沿っていない', '沿っていない', '沿っている', '沿っている'], 0)
  await answer(page, ['適切', '適切でない', '適切でない', '適切', '適切でない', '適切'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('How Bad Can It Git')
})

test('セキュリティ-5: 4 つの問い、STRIDE、脅威への 4 つの対応、アンチパターン、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/se-5'))
  await expect(page.locator('article h1')).toContainText('脅威モデリング')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['4 つの問い', 'STRIDE', 'なりすまし', '緩和', '移転', 'ヒーローの脅威モデラー', 'このサービスの整理']) await expect(art).toContainText(t)
  await answer(page, ['なりすまし', '改ざん', '否認', '情報の漏えい', 'サービス拒否', '権限の昇格'], 0)
  await answer(page, ['適切でない', '適切でない', '適切でない', '適切でない', '適切', '適切'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('Threat Modeling')
})

test('セキュリティ-6: 事故の定義と位置づけ、危機の判断、役割、OpSec、連絡、責めない振り返り、判定問題、クイズ、出典', async ({ page }) => {
  await page.goto(go('/lesson/se-6'))
  await expect(page.locator('article h1')).toContainText('インシデント対応')
  await expect(page.locator('.quiz fieldset')).toHaveCount(4)
  const art = page.locator('article')
  for (const t of ['800-61', 'トリアージ', '慌てない', '事故指揮官', '運用上のセキュリティ', 'ぼかし', '責めない', 'このサービスの整理']) await expect(art).toContainText(t)
  await answer(page, ['よい', '避ける', '避ける', 'よい', '避ける'], 0)
  await answer(page, ['適切でない', '適切', '適切でない', '適切でない', '適切でない', '適切'], 1)
  await page.locator('.source-note summary').click()
  await expect(page.locator('.source-note')).toContainText('800-61r3')
})

test('講座の目次: セキュリティは、基礎・実践・応用のすべてが公開されている', async ({ page }) => {
  await page.goto(go('/course/security'))
  await expect(page.getByTestId('writing-status')).toContainText('本文 6 / 予定 6 レッスン')
  await expect(page.locator('.planned-item')).toHaveCount(0)
  await expect(page.locator('.stage-card', { hasText: '脅威モデリングと、事故への対応' })).toBeVisible()
  await page.locator('.stage-card', { hasText: '脅威モデリングと、事故への対応' }).click()
  await expect(page.locator('.lesson-list a')).toHaveCount(2)
})
