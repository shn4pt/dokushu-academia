import type { Page } from '@playwright/test'
import { bank } from './lessons'

export const quizOf = (id: string) => bank[id]

/** クイズに答える。wrong に問題の番号(0始まり)を渡すと、その問題には、わざと誤答する。 */
export async function answerQuiz(page: Page, id: string, wrong: number[] = []) {
  const qs = quizOf(id)
  for (let i = 0; i < qs.length; i++) {
    const n = wrong.includes(i) ? (qs[i].answer + 1) % qs[i].choices.length : qs[i].answer
    await page.locator('.quiz fieldset').nth(i).locator('input[type=radio]').nth(n).check()
  }
  await page.locator('.quiz button', { hasText: '答え合わせ' }).click()
}
