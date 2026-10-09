import { go, expect, test } from './fixtures'
import { courseStageIds, courses, groups, isAvailable } from '../src/data/catalog'
import { stages } from '../src/data/curriculum'

test.describe('講座一覧のデータ', () => {
  test('すべてのステージが、ちょうど1つの講座に入っている', () => {
    const used = courses.flatMap(courseStageIds)
    expect(new Set(used).size).toBe(used.length) // 重複なし
    expect([...used].sort()).toEqual(stages.map((s) => s.id).sort()) // 漏れなし・存在しない ID なし
  })
  test('講座の id は一意で、分野は定義済み、どの講座も基礎・実践・応用の3段階', () => {
    expect(new Set(courses.map((c) => c.id)).size).toBe(courses.length)
    for (const c of courses) {
      expect(groups.map((g) => g.id)).toContain(c.group)
      expect(c.tiers.map((t) => t.level)).toEqual(['basic', 'practice', 'advanced'])
    }
  })
  test('公開中の講座は、全段階にステージがあり、目次のみの講座は、全段階にレッスンの案がある', () => {
    for (const c of courses) {
      for (const t of c.tiers) {
        if (isAvailable(c)) expect(t.stageIds?.length, `${c.id}/${t.level}`).toBeGreaterThan(0)
        else expect(t.planned?.length, `${c.id}/${t.level}`).toBeGreaterThan(0)
      }
    }
  })
  test('法令・基準の講座は、条文などの根拠の基準が、全体像と考え方に限ると明記される', async () => {
    const { evidenceInfo } = await import('../src/data/catalog')
    expect(evidenceInfo.law.note).toContain('全体像と考え方')
    expect(evidenceInfo.law.note).toContain('確認した日')
  })
})

test('講座一覧: 4つの分野に、全講座が並び、構成案であることが明記される', async ({ page }) => {
  await page.goto(go('/catalog'))
  await expect(page.locator('h1')).toContainText('講座一覧')
  await expect(page.getByRole('note')).toContainText('構成案です')
  await expect(page.locator('section[aria-labelledby^=group-]')).toHaveCount(groups.length)
  await expect(page.locator('.course-card')).toHaveCount(courses.length)
  await expect(page.locator('.course-card', { hasText: '公開中' })).toHaveCount(courses.filter(isAvailable).length)
  await expect(page.locator('.course-card', { hasText: '目次のみ' })).toHaveCount(courses.filter((c) => !isAvailable(c)).length)
})

test('講座の目次(公開中): 既存のステージに移れる', async ({ page }) => {
  await page.goto(go('/catalog'))
  await page.locator('.course-card', { hasText: 'AI エージェント開発' }).click()
  await expect(page.locator('h1')).toContainText('AI エージェント開発')
  await expect(page.locator('.tier h2')).toHaveText(['基礎', '実践', '応用'])
  await expect(page.getByText('発展編:第2部の続き')).toBeVisible()
  await page.locator('.stage-card', { hasText: '発展編' }).click()
  await expect(page.locator('h1')).toContainText('発展編')
})

test('講座の目次(目次のみ): 準備中のレッスンの案と、根拠の基準が表示される', async ({ page }) => {
  await page.goto(go('/course/legal'))
  await expect(page.locator('h1')).toContainText('法務')
  await expect(page.locator('.why-card')).toContainText('法令・基準')
  await expect(page.locator('.why-card')).toContainText('個別の事案は扱いません')
  await expect(page.getByRole('note')).toContainText('目次の案')
  await expect(page.locator('.planned-item').first()).toContainText('準備中')
  await expect(page.locator('.planned-item a')).toHaveCount(0) // リンクではない(本文がない)
})

test('存在しない講座は、講座一覧に戻る', async ({ page }) => {
  await page.goto(go('/course/nothing'))
  await expect(page.locator('h1')).toContainText('講座一覧')
})

test('ヘッダーのタイトルを押すと、講座一覧に移る', async ({ page }) => {
  await page.goto(go('/lesson/0-1'))
  await page.locator('.site-header .brand').click()
  await expect(page).toHaveURL(/#\/catalog$/)
  await expect(page.locator('h1')).toContainText('講座一覧')
})

test('講座一覧から、続きのレッスンに移れる', async ({ page }) => {
  await page.goto(go('/catalog'))
  const resume = page.getByRole('region', { name: '続きから学ぶ' }).getByRole('link')
  await expect(resume).toContainText('学習を始める')
  await resume.click()
  await expect(page).toHaveURL(/#\/lesson\//)
})
