import { expect, test } from '@playwright/test'
import { DOWN_DOMAINS, LEVELS, UP_DOMAINS, certainty } from '../src/data/grade'
import { go, expect as pageExpect, test as pageTest } from './fixtures'

// GRADE の確実性の計算(Cochrane Handbook v6.5 第 14 章の規則)。手で数えた値と照合する。
test.describe('確実性の計算', () => {
  test('出発点: ランダム化試験は「高」、観察研究は「低」', () => {
    expect(certainty('randomized', {}).label).toBe('高')
    expect(certainty('observational', {}).label).toBe('低')
  })

  test('下げる: 深刻は 1 段階、非常に深刻は 2 段階', () => {
    expect(certainty('randomized', { riskOfBias: 1 }).label).toBe('中')
    expect(certainty('randomized', { riskOfBias: 2 }).label).toBe('低')
    expect(certainty('randomized', { riskOfBias: 1, imprecision: 1 }).label).toBe('低')
    expect(certainty('randomized', { riskOfBias: 2, inconsistency: 1 }).label).toBe('非常に低')
  })

  test('「非常に低」より下には、ならない', () => {
    const all = Object.fromEntries(DOWN_DOMAINS.map((d) => [d, 2])) as Record<(typeof DOWN_DOMAINS)[number], 2>
    expect(certainty('randomized', all).index).toBe(0)
    expect(certainty('observational', { riskOfBias: 2 }).label).toBe('非常に低')
  })

  test('上げる: 1 つにつき 1 段階。「高」を超えない。下げたランダム化試験にも、例外的に使える', () => {
    expect(certainty('observational', {}, { largeEffect: true }).label).toBe('中')
    expect(certainty('observational', {}, { largeEffect: true, doseResponse: true }).label).toBe('高')
    expect(certainty('observational', {}, Object.fromEntries(UP_DOMAINS.map((d) => [d, true]))).label).toBe('高') // 3 つ上げても、上限は高
    expect(certainty('randomized', {}, { largeEffect: true }).label).toBe('高') // 上限
    expect(certainty('randomized', { riskOfBias: 1, imprecision: 1 }, { confoundingWouldReduce: true }).label).toBe('中') // 下げたランダム化試験を、上げる
  })

  test('記号と、段階の表示', () => {
    expect(LEVELS).toEqual(['非常に低', '低', '中', '高'])
    expect([3, 2, 1, 0].map((i) => certainty(i === 3 ? 'randomized' : 'observational', i === 2 ? { riskOfBias: 0 } : {}, {}).symbol)[0]).toBe('⊕⊕⊕⊕')
    expect(certainty('randomized', { riskOfBias: 1 }).symbol).toBe('⊕⊕⊕◯')
    expect(certainty('observational', {}).symbol).toBe('⊕⊕◯◯')
    expect(certainty('observational', { riskOfBias: 1 }).symbol).toBe('⊕◯◯◯')
  })

  test('レッスンの判定問題の 6 つの答え', () => {
    expect(certainty('randomized', {}).label).toBe('高')
    expect(certainty('randomized', { riskOfBias: 1 }).label).toBe('中')
    expect(certainty('observational', {}).label).toBe('低')
    expect(certainty('observational', {}, { largeEffect: true }).label).toBe('中')
    expect(certainty('randomized', { riskOfBias: 1, imprecision: 1 }).label).toBe('低')
    expect(certainty('observational', { riskOfBias: 1 }).label).toBe('非常に低')
  })
})

pageTest('確実性のデモ: 出発点、下げる、観察研究への切り替えと、上げる要因', async ({ page }) => {
  await page.goto(go('/lesson/e-4'))
  const lab = page.locator('.grade-lab')
  await pageExpect(lab.locator('#grade-label')).toHaveText('高')
  await lab.getByLabel('バイアスのリスク', { exact: false }).selectOption('1')
  await pageExpect(lab.locator('#grade-label')).toHaveText('中')
  await lab.getByLabel('不精確さ', { exact: false }).selectOption('1')
  await pageExpect(lab.locator('#grade-label')).toHaveText('低')
  await lab.getByLabel('非ランダム化の研究', { exact: false }).check()
  await pageExpect(lab.locator('#grade-label')).toHaveText('非常に低') // 低 − 2、下限
  await lab.getByLabel('バイアスのリスク', { exact: false }).selectOption('0')
  await lab.getByLabel('不精確さ', { exact: false }).selectOption('0')
  await pageExpect(lab.locator('#grade-label')).toHaveText('低')
  await lab.getByLabel('大きな効果', { exact: false }).check()
  await pageExpect(lab.locator('#grade-label')).toHaveText('中')
  await lab.getByLabel('ランダム化試験', { exact: false }).check() // 出発点が「高」。上げる要因を選んでも、上限は「高」
  await pageExpect(lab.locator('#grade-label')).toHaveText('高')
  await lab.getByLabel('バイアスのリスク', { exact: false }).selectOption('2') // 高 − 2 + 1(大きな効果)= 中
  await pageExpect(lab.locator('#grade-label')).toHaveText('中')
})
