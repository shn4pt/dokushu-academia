import { readFileSync } from 'node:fs'
import { go, expect, test } from './fixtures'
import { courseStageIds, courses } from '../src/data/catalog'
import { audience, entries } from '../src/data/course-entry'
import { findStage } from '../src/data/curriculum'

// 学習時間の統計(ビルドの前に scripts/build-search-index.mjs が全レッスンから作る)。本文のあるレッスンだけが載る。
const stats = JSON.parse(readFileSync('src/data/lesson-stats.json', 'utf8')) as Record<string, { chars: number }>

// 講座の入口(src/data/course-entry.ts)のデータと画面。文章の全文は検査せず、欠落・リンク切れ・長さの目安だけを見る。
const lessonsOf = (courseId: string) =>
  new Set(courseStageIds(courses.find((c) => c.id === courseId)!).flatMap((sid) => findStage(sid)?.lessons.map((l) => l.id) ?? []))

test.describe('講座の入口のデータ', () => {
  test('全講座に入口があり、存在しない講座の入口はない', () => {
    expect(Object.keys(entries).sort()).toEqual(courses.map((c) => c.id).sort())
  })
  test('想定する読者と約束が、すべて書かれている', () => {
    for (const [k, v] of Object.entries(audience)) expect(v.length, k).toBeGreaterThan(10)
  })
  test('どの入口も、必要な項目がそろい、カードが長すぎない', () => {
    for (const c of courses) {
      const e = entries[c.id]
      expect(e.decision.length, `${c.id}: decision`).toBeGreaterThan(10)
      expect(e.decision.length, `${c.id}: decision はカードに収まる長さ`).toBeLessThanOrEqual(90)
      expect(e.when.length, `${c.id}: when`).toBeGreaterThan(10)
      expect(e.questions.length, `${c.id}: questions`).toBeGreaterThanOrEqual(2)
      expect(e.gains.length, `${c.id}: gains`).toBeGreaterThanOrEqual(3)
      expect(e.scope.length, `${c.id}: scope`).toBeGreaterThan(10)
      expect(e.solo.text.length, `${c.id}: solo`).toBeGreaterThan(10)
    }
  })
  test('持ち帰れることのレッスン ID は、その講座の、本文のあるレッスンである', () => {
    for (const c of courses) {
      const own = lessonsOf(c.id)
      for (const g of entries[c.id].gains) {
        expect(g.lessons.length, `${c.id}: ${g.text}`).toBeGreaterThan(0)
        for (const id of g.lessons) {
          expect(own.has(id), `${c.id}: ${id} は、この講座のレッスンではない`).toBe(true)
          expect(stats[id]?.chars ?? 0, `${c.id}: ${id} に本文(学習時間の統計)がない`).toBeGreaterThan(0)
        }
      }
    }
  })
  test('どの講座も、全部の段階(基礎・実践・応用)の少なくとも1つのレッスンを、持ち帰れることが指している', () => {
    for (const c of courses) {
      const cited = new Set(entries[c.id].gains.flatMap((g) => g.lessons))
      for (const t of c.tiers) {
        const inTier = (t.stageIds ?? []).flatMap((sid) => findStage(sid)?.lessons.map((l) => l.id) ?? [])
        expect(inTier.some((id) => cited.has(id)), `${c.id}/${t.level}`).toBe(true)
      }
    }
  })
  test('読者設定は、検証済みの需要として書かれず、約束しないことが明記される', () => {
    expect(audience.background).toContain('確かめたものではありません')
    expect(audience.notPromised).toContain('約束しません')
    expect(audience.notPromised).toContain('専門家に確認')
  })
})

test('講座一覧: 読者と約束、各カードの「どんな判断に役立つか」が見える', async ({ page }) => {
  await page.goto(go('/catalog'))
  const note = page.getByLabel('想定する読者と約束')
  await expect(note).toContainText(audience.promise)
  await expect(note).toContainText(audience.short)
  await note.locator('summary').click()
  await expect(note).toContainText('約束しません')
  await expect(note).toContainText(audience.reader)
  await expect(page.locator('.course-card')).toHaveCount(courses.length)
  for (const c of courses) await expect(page.locator('.course-card', { hasText: c.title }).first()).toContainText(entries[c.id].decision)
})

test('講座の目次: 場面・持ち帰れること・前提が、目次より前にあり、レッスンへ移れる', async ({ page }) => {
  await page.goto(go('/course/pm'))
  const entry = page.locator('.entry-card')
  await expect(entry).toHaveCount(3)
  await expect(page.getByLabel('こんな場面で読む')).toBeVisible()
  await expect(page.getByLabel('学ぶと持ち帰れること')).toBeVisible()
  await expect(page.getByLabel('前提と範囲')).toContainText('AI と一人で取り組む場面との関係')
  // 入口のカードは、3 枚とも、基礎・実践・応用の見出しより前にある
  const before = await page.evaluate(() => {
    const tier = document.querySelector('.tier')!
    return [...document.querySelectorAll('.entry-card')].map((card) => !!(card.compareDocumentPosition(tier) & Node.DOCUMENT_POSITION_FOLLOWING))
  })
  expect(before).toEqual([true, true, true])
  // リンクには、番号だけでなく、レッスンの題名が見える
  const link = page.getByLabel('学ぶと持ち帰れること').getByRole('link', { name: /PM-1/ })
  await expect(link).toContainText('PM の仕事の全体像')
  await link.click()
  await expect(page.locator('article h1')).toContainText('PM の仕事の全体像')
})

test('全講座の入口が、エラーなく表示される', async ({ page }) => {
  for (const c of courses) {
    await page.goto(go(`/course/${c.id}`))
    await expect(page.locator('h1')).toContainText(c.title)
    await expect(page.locator('.entry-card')).toHaveCount(3)
    await expect(page.getByLabel('こんな場面で読む')).toContainText(entries[c.id].when)
  }
})

test('地図: 読者と約束があり、本文のない講座がないときは「目次の案」と書かない', async ({ page }) => {
  await page.goto(go('/map'))
  await expect(page.getByLabel('想定する読者と約束')).toContainText(audience.promise)
  if (courses.every((c) => courseStageIds(c).length > 0)) await expect(page.locator('main')).not.toContainText('残りは目次の案です')
})
