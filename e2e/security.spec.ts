import { go, expect, test } from './fixtures'

// セキュリティの序論(セキュリティ-1、セキュリティ-2)の画面。
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

test('講座の目次: セキュリティは、基礎が公開され、実践・応用が準備中', async ({ page }) => {
  await page.goto(go('/course/security'))
  await expect(page.getByTestId('writing-status')).toContainText('本文 2 / 予定 6 レッスン')
  await expect(page.locator('.badge', { hasText: '一部公開' })).toBeVisible()
  await expect(page.locator('.stage-card', { hasText: '序論:何を、誰から守るか' })).toBeVisible()
  await expect(page.locator('.planned-item')).toHaveCount(4)
  await page.locator('.stage-card', { hasText: '序論:何を、誰から守るか' }).click()
  await expect(page.locator('.lesson-list a')).toHaveCount(2)
})
