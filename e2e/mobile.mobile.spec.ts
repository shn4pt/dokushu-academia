import type { Page } from '@playwright/test'
import { go, expect, test } from './fixtures'
import { ids, stageIds } from './lessons'

// iPhone 13(390px 幅)・タッチ操作(pointer: coarse)で確かめる。

const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

for (const id of ids) {
  test(`スマホ: レッスン ${id} は横スクロールしない`, async ({ page }) => {
    await page.goto(go(`/lesson/${id}`))
    await expect(page.locator('article h1')).toBeVisible()
    await page.locator('.source-note summary').click() // 開いた状態でもはみ出さない
    expect(await overflow(page)).toBeLessThanOrEqual(0)
  })
}

for (const path of ['/', '/roadmap', '/glossary', '/search', '/review', '/progress', '/api-key', '/sources', '/catalog', '/map', '/course/pm', ...stageIds.map((s) => `/stage/${s}`)]) {
  test(`スマホ: ${path} は横スクロールしない`, async ({ page }) => {
    await page.goto(go(path))
    await expect(page.locator('main')).toBeVisible()
    expect(await overflow(page)).toBeLessThanOrEqual(0)
  })
}

/** 指で押す部品が、44px 四方以上か。文章の中のリンク(行の一部)は対象外。単独で置かれたリンクは対象。 */
async function smallTargets(page: Page) {
  return page.evaluate(() => {
    const out: string[] = []
    const sel = 'button, a, input:not([type=hidden]), select, textarea, summary, label'
    for (const el of document.querySelectorAll<HTMLElement>(sel)) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      const style = getComputedStyle(el)
      if (style.visibility === 'hidden' || style.display === 'none') continue
      // 文の途中にあるリンク(親の要素に、リンク以外の文字もある)は、行の一部なので対象外
      if (el.tagName === 'A') {
        const host = el.parentElement
        if (host && (host.textContent ?? '').trim() !== (el.textContent ?? '').trim()) continue
      }
      if (el.tagName === 'INPUT' && el.closest('label')) continue // 押す範囲は、囲んでいる label
      if (el.tagName === 'LABEL' && !el.querySelector('input,select,textarea')) continue
      if (Math.min(r.width, r.height) < 43.5) out.push(`${el.tagName.toLowerCase()}「${(el.textContent ?? '').trim().slice(0, 12)}」 ${Math.round(r.width)}x${Math.round(r.height)}`)
    }
    return out
  })
}

for (const path of ['/', '/roadmap', '/glossary', '/search?q=attention', '/review', '/progress', '/api-key', '/sources', '/lesson/7-2', '/lesson/14-3', '/lesson/16-3', '/lesson/19-1', '/lesson/15-2', '/lesson/9-1', '/lesson/20-1', '/lesson/20-2', '/lesson/20-3', '/catalog', '/map', '/course/pm', '/course/agents', '/course/evidence', '/lesson/e-1']) {
  test(`スマホ: ${path} の操作部品は 44px 以上`, async ({ page }) => {
    await page.goto(go(path))
    await expect(page.locator('main')).toBeVisible()
    await page.waitForTimeout(300)
    expect(await smallTargets(page)).toEqual([])
  })
}

test('スマホ: 検索ページで、キーボードが開かないよう自動でフォーカスしない', async ({ page }) => {
  await page.goto(go('/search'))
  await expect(page.getByLabel('レッスン内を検索')).not.toBeFocused()
})

test('スマホ: 7-2 の A/B の選択肢はタップで切り替えられ、矢印キーでも動く', async ({ page }) => {
  await page.goto(go('/lesson/7-2'))
  const d = page.locator('.demo').first()
  await d.locator('label', { hasText: 'B' }).first().tap()
  await expect(d).toContainText('「Bが選ばれる」')
  await page.keyboard.press('ArrowLeft')
  await expect(d).toContainText('「Aが選ばれる」')
})
