import { go, expect, test } from './fixtures'
import { answerQuiz, quizOf } from './quiz'

test.beforeEach(async ({ page }) => {
  await page.goto(go('/'))
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('間違えた問題が復習に溜まり、復習で2回連続で正解すると外れる', async ({ page }) => {
  await page.goto(go('/review'))
  await expect(page.locator('main')).toContainText('復習が必要な問題: 0 問')
  await expect(page.getByRole('button', { name: /復習を始める/ })).toBeDisabled()

  await page.goto(go('/lesson/0-1'))
  await answerQuiz(page, '0-1', [0])
  await expect(page.locator('.site-header .count-badge')).toHaveText('1')

  await page.goto(go('/review'))
  await expect(page.locator('main')).toContainText('復習が必要な問題: 1 問')
  await expect(page.locator('.due-list')).toContainText('間違えた回数 1')

  for (const round of [1, 2]) {
    await page.getByRole('button', { name: /復習を始める/ }).click()
    // 選択肢はシャッフルされるので、正解の文言を、クイズの定義から探す
    const bank = quizOf('0-1')[0]
    await page.getByRole('radio', { name: bank.choices[bank.answer] }).check()
    await page.getByRole('button', { name: '答え合わせ' }).click()
    await expect(page.locator('main')).toContainText('正解')
    await page.getByRole('button', { name: '結果を見る' }).click()
    await page.getByRole('button', { name: '復習のトップへ' }).click()
    if (round === 1) await expect(page.locator('.due-list')).toContainText('連続正解 1/2')
  }
  await expect(page.locator('main')).toContainText('復習が必要な問題: 0 問')
})

test('完了にしたレッスンがないと、ランダム練習はできない', async ({ page }) => {
  await page.goto(go('/review'))
  await expect(page.getByRole('button', { name: '練習する' })).toBeDisabled()
  await page.goto(go('/lesson/0-1'))
  await page.getByRole('button', { name: 'このレッスンを完了にする' }).click()
  await page.goto(go('/review'))
  await expect(page.getByRole('button', { name: '練習する' })).toBeEnabled()
})
