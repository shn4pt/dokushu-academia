import { go, expect, test } from './fixtures'
import { ids, llmLessonIds, llmStageIds, stageIds } from './lessons'

test('レッスンは67本以上ある(定義の読み取りが壊れていない)', () => {
  expect(ids.length).toBeGreaterThanOrEqual(67)
})

for (const id of ids) {
  test(`レッスン ${id} が表示でき、出典の欄とクイズがある`, async ({ page }) => {
    await page.goto(go(`/lesson/${id}`))
    await expect(page.locator('article h1')).not.toBeEmpty()
    await expect(page.locator('.source-note')).toBeVisible()
    await expect(page.locator('.quiz')).toBeVisible()
    await expect(page.locator('.prose')).not.toBeEmpty()
  })
}

for (const id of stageIds) {
  test(`ステージ ${id} が表示できる`, async ({ page }) => {
    await page.goto(go(`/stage/${id}`))
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('.lesson-list')).toBeVisible()
  })
}

for (const path of ['/llm', '/roadmap', '/glossary', '/search', '/review', '/progress', '/api-key', '/sources']) {
  test(`ページ ${path} が表示できる`, async ({ page }) => {
    await page.goto(go(path))
    await expect(page.locator('main h1, main h2').first()).toBeVisible()
    await expect(page.locator('.site-footer')).toContainText('AI(Claude Code)が執筆')
  })
}

test('存在しないレッスン・不明な URL でも、起動して講座一覧に戻る', async ({ page }) => {
  await page.goto(go('/no-such-page'))
  await expect(page.locator('h1')).toContainText('講座一覧')
})

test('ルート(/)は、講座一覧を表示する', async ({ page }) => {
  await page.goto(go('/'))
  await expect(page).toHaveURL(/#\/catalog$/)
  await expect(page.locator('h1')).toContainText('講座一覧')
  await expect(page.locator('.brand')).toContainText('独習アカデミア')
})

test('サイト名に説明が添えられ、レッスンへ直接来た場合も、ヘッダーとタイトルに出る', async ({ page }) => {
  const tagline = 'AIと事業・プロダクトをつくる人の学び直し'
  for (const path of ['/catalog', '/lesson/pm-1']) {
    await page.goto(go(path))
    await expect(page.locator('.site-header .brand')).toContainText('独習アカデミア')
    await expect(page.locator('.site-header')).toContainText(tagline)
  }
  const title = await page.title()
  expect(title.startsWith('独習アカデミア')).toBe(true) // 名前を先頭に置く
  expect(title).toContain(tagline)
  // 固定表示のヘッダーが、説明の追加で、表示領域を大きく圧迫しない(1000px 幅)
  const h = await page.locator('.site-header').evaluate((e) => e.getBoundingClientRect().height)
  expect(h).toBeLessThanOrEqual(80)
})

test('ロードマップに、LLM の講座のすべてのレッスンが並ぶ', async ({ page }) => {
  await page.goto(go('/roadmap'))
  await expect(page.locator('a.lesson-chip')).toHaveCount(llmLessonIds.length)
})

test('LLM の講座のホームのステージ数の表示が、定義と一致する', async ({ page }) => {
  await page.goto(go('/llm'))
  await expect(page.locator('main')).toContainText(`序論と${llmStageIds.length - 1}のステージ`)
})
