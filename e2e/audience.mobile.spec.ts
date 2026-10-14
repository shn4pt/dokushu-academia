import { go, expect, test } from './fixtures'
import { courses } from '../src/data/catalog'

// スマートフォン幅で、講座一覧と講座の目次(入口のカード)が横にはみ出さない。
for (const path of ['/catalog', '/map', '/course/pm', '/course/legal', '/course/agents', '/lesson/pm-1']) {
  test(`スマホ: ${path} は、横スクロールが出ない`, async ({ page }) => {
    await page.goto(go(path))
    await expect(page.locator('h1')).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })
}

test('スマホ: 講座一覧に、全講座のカードが並ぶ', async ({ page }) => {
  await page.goto(go('/catalog'))
  await expect(page.locator('.course-card')).toHaveCount(courses.length)
})
