import { readFileSync } from 'node:fs'
import { go, expect, test } from './fixtures'
import { courses } from '../src/data/catalog'
import { stages } from '../src/data/curriculum'
import { ageDays, courseOfLesson, lawLessonErrors, maxAgeDays, type SourceEntry } from '../src/data/gates'
import { ids } from './lessons'

// 公開前の品質ゲート。法令・基準の講座は、基準が厳しい(原典で確認済み・確認日が新しい・注記がある)。
const sources = JSON.parse(readFileSync('src/data/lesson-sources.json', 'utf8')) as Record<string, SourceEntry>
const now = new Date('2026-10-09')
const good: SourceEntry = { status: 'verified', checkedAt: '2026-09-20', sources: [{ how: 'read', url: 'https://example.com/law' }] }

test.describe('法令・基準のレッスンのゲート(関数)', () => {
  test('条件を満たせば通る', () => expect(lawLessonErrors(good, now)).toEqual([]))
  test('記録がなければ止める', () => expect(lawLessonErrors(undefined, now)).toHaveLength(1))
  test('原典で確認済みでなければ止める(一部を確認・独自の整理・未確認)', () => {
    for (const status of ['partial', 'original', 'unverified']) expect(lawLessonErrors({ ...good, status }, now).join()).toContain('verified')
  })
  test('原文を読んだ出典(read かつ url)がなければ止める', () => {
    expect(lawLessonErrors({ ...good, sources: [{ how: 'search', url: 'https://example.com' }] }, now).join()).toContain('原文を読んだ出典')
    expect(lawLessonErrors({ ...good, sources: [{ how: 'read' }] }, now).join()).toContain('原文を読んだ出典')
  })
  test('確認日が、基準(90日)を超えたら止める。境目は通る', () => {
    expect(maxAgeDays.law).toBe(90)
    expect(lawLessonErrors({ ...good, checkedAt: '2026-07-11' }, now)).toEqual([]) // ちょうど90日前
    expect(lawLessonErrors({ ...good, checkedAt: '2026-07-10' }, now).join()).toContain('90 日をこえています') // 91日前
    expect(lawLessonErrors({ ...good, checkedAt: undefined }, now).join()).toContain('確認日がありません')
  })
  test('日数の計算', () => expect(ageDays('2026-10-01', now)).toBe(8))
})

test.describe('実際のレッスンへの適用', () => {
  const lawLessons = ids.filter((id) => courseOfLesson(id, stages, courses)?.evidence === 'law')

  test('法令・基準の講座のレッスンは、すべてゲートを通る(いまは、該当なしでもよい)', () => {
    for (const id of lawLessons) expect(lawLessonErrors(sources[id], new Date()), id).toEqual([])
  })

  test('レッスンから講座を引ける(根拠の種類の判定に使う)', () => {
    expect(courseOfLesson('e-1', stages, courses)?.evidence).toBe('academic')
    expect(courseOfLesson('13-2', stages, courses)?.evidence).toBe('tech')
    expect(courseOfLesson('no-such', stages, courses)).toBeUndefined()
  })

  for (const id of lawLessons) {
    test(`法令・基準のレッスン ${id}: 全体像と考え方に限ること、専門家への確認の線引き、確認した日が書かれている`, async ({ page }) => {
      await page.goto(go(`/lesson/${id}`))
      const body = page.locator('article')
      await expect(body).toContainText('全体像と考え方')
      await expect(body).toContainText('専門家')
      await expect(body).toContainText('確認した日')
    })
  }
})
