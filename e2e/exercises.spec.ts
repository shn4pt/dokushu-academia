import type { Locator, Page } from '@playwright/test'
import { go, expect, test } from './fixtures'

/** 項目ごとに選択肢を選び、まとめて答え合わせする(ClassifyItems・14-3 の分類)。 */
async function classify(demo: Locator, picks: string[]) {
  const rows = demo.locator('.task-row')
  for (let i = 0; i < picks.length; i++) await rows.nth(i).getByRole('button', { name: picks[i], exact: true }).click()
  await demo.getByRole('button', { name: '答え合わせ' }).click()
}
const demoWith = (page: Page, text: string) => page.locator('.demo', { hasText: text })

test.describe('第3部の演習', () => {
  test('14-1 水準を切り替えると、流れと人の役割が変わる', async ({ page }) => {
    await page.goto(go('/lesson/14-1'))
    await expect(page.locator('.flow')).toContainText('人が計画を確認する')
    await page.locator('.demo').getByRole('button', { name: 'L5 AI ネイティブ' }).click()
    await expect(page.locator('.flow')).toContainText('意図・制約・検証基準')
    await expect(page.locator('.flow-box.human')).toHaveCount(2)
  })

  test('14-3 リスクと検証のしやすさで目安が変わり、分類は答え合わせできる', async ({ page }) => {
    await page.goto(go('/lesson/14-3'))
    const m = page.locator('.demo').first()
    await m.locator('.row').nth(0).getByRole('button', { name: '高い' }).click()
    await m.locator('.row').nth(1).getByRole('button', { name: '低い' }).click()
    await expect(m).toContainText('L1〜L2')
    await m.locator('.row').nth(0).getByRole('button', { name: '低い' }).click()
    await m.locator('.row').nth(1).getByRole('button', { name: '高い' }).click()
    await expect(m).toContainText('L3〜L4')

    const d = demoWith(page, 'どの水準で任せる')
    await classify(d, ['L4', 'L3', 'L3', 'L2', 'L1', 'L3'])
    await expect(d).toContainText('6 / 6')
    await d.locator('.task-row').nth(4).getByRole('button', { name: 'L4', exact: true }).click()
    await d.getByRole('button', { name: '答え合わせ' }).click()
    await expect(d.locator('.task-row.ng')).toHaveCount(1)
    await expect(d).toContainText('5 / 6')
  })

  test('15-2 コードレビュー: 誤答では行番号を示し、正答で解説する', async ({ page }) => {
    await page.goto(go('/lesson/15-2'))
    const cr = page.locator('.code-review')
    await expect(cr).toHaveCount(3)
    await cr.nth(0).locator('input[type=radio]').nth(0).check()
    await cr.nth(0).getByRole('button', { name: '答え合わせ' }).click()
    await expect(cr.nth(0)).toContainText('3 行目')
    await cr.nth(0).locator('input[type=radio]').nth(2).check()
    await cr.nth(0).getByRole('button', { name: '答え合わせ' }).click()
    await expect(cr.nth(0)).toContainText('SQL インジェクション')
  })

  test('16-1 トレース読解に、テストの期待値の書き換えがある', async ({ page }) => {
    await page.goto(go('/lesson/16-1'))
    await expect(demoWith(page, 'トレース読解')).toContainText('期待値を 11 から 10 に変更')
  })

  test('16-2 CLAUDE.md に書くか: 全問正解で 6 / 6、選び直すと答え合わせが消える', async ({ page }) => {
    await page.goto(go('/lesson/16-2'))
    const d = demoWith(page, 'CLAUDE.md に書く?')
    await classify(d, ['書く', '書かない', '書かない', '書く', '書かない', '書く'])
    await expect(d).toContainText('6 / 6')
    await d.locator('.task-row').nth(1).getByRole('button', { name: '書く', exact: true }).click()
    await expect(d).not.toContainText('6 / 6')
  })

  test('16-3 権限ルールの判定(deny が先に評価される)', async ({ page }) => {
    await page.goto(go('/lesson/16-3'))
    const d = demoWith(page, 'この操作はどうなる')
    await expect(d.getByRole('button', { name: '答え合わせ' })).toBeDisabled()
    await classify(d, ['実行', '拒否', '確認', '拒否', '拒否', '確認'])
    await expect(d).toContainText('6 / 6')
    await expect(page.locator('table.calc.text', { hasText: 'bypassPermissions' }).locator('tbody tr')).toHaveCount(6)
  })

  test('17-1 / 17-2 / 18-1 / 18-3 の判定演習', async ({ page }) => {
    const cases: [string, string, string[], string][] = [
      ['/lesson/17-1', 'そのまま任せられる', ['先に書き直す', '任せられる', '任せられる', '先に書き直す', '任せられる'], '5 / 5'],
      ['/lesson/17-2', 'どこで守らせる', ['CLAUDE.md', '権限・フック', 'CI の必須チェック', 'CI の必須チェック', '人のレビュー', '権限・フック'], '6 / 6'],
      ['/lesson/18-1', '自動で判定できる?', ['判定できる', 'あいまい', '判定できる', 'あいまい', '判定できる'], '5 / 5'],
      ['/lesson/18-3', '自動で進めてよい?', ['自動で進める', '自動で進める', '人が判断する', '人が判断する', '人が判断する', '自動で進める', '人が判断する'], '7 / 7'],
    ]
    for (const [path, key, picks, score] of cases) {
      await page.goto(go(path))
      const d = demoWith(page, key)
      await classify(d, picks)
      await expect(d, path).toContainText(score)
    }
  })

  test('17-3 費用の計算機', async ({ page }) => {
    await page.goto(go('/lesson/17-3'))
    const calc = demoWith(page, '費用と効果')
    await expect(calc).toContainText('$2,340')
    await expect(calc).toContainText('約480,000円')
    await calc.locator('input[type=range]').nth(3).fill('0')
    await expect(calc).toContainText('約-351,000円')
  })

  test('18-2 トレース読解に、テストの無効化がある', async ({ page }) => {
    await page.goto(go('/lesson/18-2'))
    await expect(demoWith(page, '自動の修正ループ')).toContainText('it.skip')
  })
})

test.describe('19-1 成熟度の自己診断と 19-2 の計画', () => {
  const dims = (page: Page) => page.locator('.assess-dim')
  const pick = (page: Page, dim: number, v: number) => dims(page).nth(dim).locator('input[type=radio]').nth(v).check()

  test.beforeEach(async ({ page }) => {
    await page.goto(go('/llm'))
    await page.evaluate(() => localStorage.clear())
  })

  test('回答すると目安と最も弱い軸が出て、19-2 の計画に反映される', async ({ page }) => {
    await page.goto(go('/lesson/19-2'))
    await expect(demoWith(page, '計画のたたき台')).toContainText('まだ診断の結果がありません')

    await page.goto(go('/lesson/19-1'))
    await expect(dims(page)).toHaveCount(6)
    const picks = [2, 1, 0, 2, 1, 3] // 検証・文脈・権限・レビュー・計測・理解
    for (let i = 0; i < 4; i++) await pick(page, i, picks[i])
    await expect(page.locator('.assessment')).toContainText('あと 2 軸')
    for (let i = 4; i < 6; i++) await pick(page, i, picks[i])
    await expect(page.locator('.assessment')).toContainText('目安: L1〜L2')
    await expect(page.locator('.assessment')).toContainText('最も弱い軸: 権限と安全(段階0)')
    await expect(page.locator('.assess-result tr.weakest')).toHaveCount(1)

    await pick(page, 2, 1)
    await expect(page.locator('.assessment')).toContainText('目安: L3')
    await expect(page.locator('.assessment')).toContainText('最も弱い軸: 文脈と仕様、権限と安全、計測(段階1)')

    // 進捗とは別のキーに保存され、進捗には混ざらない
    const keys = await page.evaluate(() => ({ a: localStorage.getItem('llm-learning:assessment'), p: localStorage.getItem('llm-learning:progress') ?? '' }))
    expect(JSON.parse(keys.a!)).toEqual({ verify: 2, context: 1, guard: 1, process: 2, measure: 1, people: 3 })
    expect(keys.p).not.toContain('guard')

    await page.reload()
    await expect(page.locator('.assessment')).toContainText('目安: L3')

    await page.goto(go('/lesson/19-2'))
    const plan = demoWith(page, '計画のたたき台')
    await expect(plan).toContainText('現在の目安: L3 → 次の目標: L4')
    await expect(plan).toContainText('文脈と仕様(段階1 → 2)')
    await expect(plan).toContainText('計測(段階1 → 2)')
    await expect(plan).toContainText('検証(段階2)')
    await expect(plan).not.toContainText('人の理解(段階')
  })

  test('回答を消せる。壊れた保存データでも起動する', async ({ page }) => {
    await page.goto(go('/lesson/19-1'))
    await pick(page, 0, 1)
    await page.getByRole('button', { name: '回答を消す' }).click()
    expect(await page.evaluate(() => localStorage.getItem('llm-learning:assessment'))).toBeNull()
    await page.evaluate(() => localStorage.setItem('llm-learning:assessment', '{"verify":9,"context":"x"'))
    await page.reload()
    await expect(page.locator('.assessment')).toContainText('あと 6 軸')
  })
})
