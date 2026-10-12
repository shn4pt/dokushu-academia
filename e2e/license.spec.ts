import { go, expect, test } from './fixtures'
import { readFileSync } from 'node:fs'
import { licenseNotes } from '../src/license'

const rawSources = JSON.parse(readFileSync('src/data/lesson-sources.json', 'utf8')) as Record<string, { sources: { title: string; use: string; how: 'read'; url?: string }[] }>
const lessonIds = Object.keys(rawSources)
const sourcesFor = (id: string) => rawSources[id]

// 資料のライセンスの扱い(docs/licenses.md)。出典の題名から、レッスンの末尾に利用条件が出る。
test.describe('利用条件の表示', () => {
  test('継承(CC BY-SA 4.0)の資料を使うレッスン: OWASP', async ({ page }) => {
    await page.goto(go('/lesson/se-5'))
    const note = page.getByTestId('license-note')
    await expect(note).toContainText('CC BY-SA 4.0')
    await expect(note).toContainText('同じ条件(継承)')
    await expect(note.getByRole('link', { name: 'CC BY-SA 4.0' }).first()).toHaveAttribute('href', 'https://creativecommons.org/licenses/by-sa/4.0/deed.ja')
    await expect(note).toContainText('Threat Modeling Cheat Sheet')
    await expect(note).toContainText('docs/licenses.md')
  })

  test('継承・非営利(CC BY-NC-SA 4.0)の資料を使うレッスンは、非営利に限ると出る', async ({ page }) => {
    await page.goto(go('/lesson/ac-1'))
    const note = page.getByTestId('license-note')
    await expect(note).toContainText('CC BY-NC-SA 4.0')
    await expect(note).toContainText('非営利の目的に限ります')
  })

  test('改変禁止(CC BY-NC-ND 4.0)の資料は、要約と短い引用にとどめる、と出る', async ({ page }) => {
    await page.goto(go('/lesson/sw-1'))
    await expect(page.getByTestId('license-note')).toContainText('原文を改変した版を配るものではありません')
  })

  test('表示だけ(CC BY 4.0)の資料: 継承の文は出ない', async ({ page }) => {
    await page.goto(go('/lesson/ps-1'))
    const note = page.getByTestId('license-note')
    await expect(note).toContainText('出典:')
    await expect(note).not.toContainText('同じ条件(継承)')
  })

  test('Creative Commons の表記がないレッスンには、出ない', async ({ page }) => {
    await page.goto(go('/lesson/au-1'))
    await expect(page.getByTestId('license-note')).toHaveCount(0)
  })

  test('出典の題名に継承のライセンスがあるレッスンは、すべて、継承の表示を持つ', () => {
    let n = 0
    for (const id of lessonIds) {
      const lic = licenseNotes(sourcesFor(id).sources)
      const hasSA = sourcesFor(id).sources.some((s) => /CC BY(-NC)?-SA/.test(s.title))
      if (hasSA) { n++; expect(lic.share.length, id).toBeGreaterThan(0) }
    }
    expect(n).toBeGreaterThan(20) // OWASP、Scrum Guide、OpenStax の非営利・継承の教科書
  })
})
