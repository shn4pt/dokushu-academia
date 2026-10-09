import { test as base, expect } from '@playwright/test'

/** どのテストでも、ページ内のエラー(未処理の例外・console.error)が出たら失敗にする。 */
export const test = base.extend({
  page: async ({ page }, use) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
    page.on('console', (m) => {
      if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console.error: ' + m.text())
    })
    await use(page)
    expect(errors, 'ページ内でエラーが出ていない').toEqual([])
  },
})
export { expect }

export const PROGRESS_KEY = 'llm-learning:progress'
export const go = (path: string) => '/#' + path
