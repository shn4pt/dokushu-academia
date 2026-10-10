import { go, expect, test } from './fixtures'

test('キーワードで検索でき、結果から該当レッスンへ移れる', async ({ page }) => {
  await page.goto(go('/search'))
  await page.getByLabel('レッスン内を検索').fill('METR')
  const hit = page.locator('.result-title').filter({ hasText: '14-2' })
  await expect(hit.first()).toBeVisible()
  await hit.first().click()
  await expect(page.locator('article h1')).toContainText('14-2')
})

test('スペース区切りは AND 検索になる', async ({ page }) => {
  await page.goto(go('/search?q=' + encodeURIComponent('plan モード')))
  await expect(page.locator('.result-title').filter({ hasText: '16-1' })).not.toHaveCount(0)
  await page.getByLabel('レッスン内を検索').fill('plan モード 存在しない語xyz')
  await expect(page.locator('.result')).toHaveCount(0)
})

test('用語集の項目も検索結果に出る', async ({ page }) => {
  await page.goto(go('/search?q=' + encodeURIComponent('理解の負債')))
  await expect(page.locator('main')).toContainText('理解の負債')
  await expect(page.locator('.result-title').filter({ hasText: '18-3' })).not.toHaveCount(0)
})

test('出典の欄の文字は、検索の索引に入らない', async ({ page }) => {
  await page.goto(go('/search?q=' + encodeURIComponent('Choose a permission mode')))
  await expect(page.locator('.result')).toHaveCount(0)
})
