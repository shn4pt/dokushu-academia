import { expect, test } from '@playwright/test'
import { LessonFormatError, parseLesson, renderMarkdown } from '../src/lessons/mdparse'
import { go, test as pageTest, expect as pageExpect } from './fixtures'

// Markdown 形式のレッスンの読み取り(mdparse.ts)。形式の誤りは、ビルド(索引の生成)で気づけるよう、読み取りの時点で失敗させる。
const quiz = '```component quiz\n[{"question":"問","choices":["あ","い"],"answer":0,"explanation":"解説"}]\n```'

test.describe('読み取り', () => {
  test('本文と部品とクイズに分かれる', () => {
    const r = parseLesson(`### 見出し\n\n本文です。\n\n\`\`\`component anscombe\n{}\n\`\`\`\n\n続きの本文。\n\n${quiz}\n`, 't')
    expect(r.segments.map((s) => s.kind)).toEqual(['html', 'component', 'html'])
    expect(r.quiz).toHaveLength(1)
    expect(r.quiz[0].answer).toBe(0)
  })

  test('見出しは h3、内部リンクは # つき、表は既存の見た目、外部リンクは rel つき', () => {
    const html = renderMarkdown('### 題\n\n[内部](/lesson/e-1) と [外部](https://example.com/a)\n\n| a | b |\n|---|---|\n| 1 | 2 |\n')
    expect(html).toContain('<h3>題</h3>')
    expect(html).toContain('<a href="#/lesson/e-1">内部</a>')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).toContain('<table class="calc text">')
  })

  test('クイズがないと、失敗する', () => {
    expect(() => parseLesson('### a\n\n本文', 't')).toThrow(/クイズ/)
  })

  const bad = (name: string, body: string, message: RegExp) =>
    test(`誤り: ${name}`, () => {
      let error: unknown
      try { parseLesson(body, 't') } catch (e) { error = e }
      expect(error).toBeInstanceOf(LessonFormatError)
      expect((error as Error).message).toMatch(message)
    })
  bad('JSON として読めない', `\`\`\`component classify\n{ title: 'x' }\n\`\`\`\n${quiz}`, /JSON として読めません/)
  bad('知らない部品', `\`\`\`component nothing\n{}\n\`\`\`\n${quiz}`, /知らない部品/)
  bad('必須の項目がない', `\`\`\`component classify\n{"title":"x"}\n\`\`\`\n${quiz}`, /description がありません/)
  bad('囲みの閉じ忘れ(次の囲みまで、JSON と見なされて失敗する)', `\`\`\`component anscombe\n{}\n\n${quiz}`, /JSON として読めません|読み取れないところ/)
  bad('クイズが2つ', `${quiz}\n\n${quiz}`, /1つだけ/)
  bad('クイズの answer が範囲外', '```component quiz\n[{"question":"問","choices":["あ","い"],"answer":2,"explanation":"解説"}]\n```', /answer は、0〜1/)
  bad('クイズの解説が空', '```component quiz\n[{"question":"問","choices":["あ","い"],"answer":0,"explanation":""}]\n```', /explanation/)
  bad('クイズの選択肢が1つ', '```component quiz\n[{"question":"問","choices":["あ"],"answer":0,"explanation":"解"}]\n```', /choices/)
  test('誤りの場所(行)が、メッセージに入る', () => {
    expect(() => parseLesson(`行1\n行2\n\`\`\`component nothing\n{}\n\`\`\`\n${quiz}`, 'レッスンX')).toThrow(/レッスンX\(3 行目の nothing\)/)
  })
})

pageTest.describe('画面(st-1)', () => {
  pageTest('Markdown のレッスンが、見出し・表・部品・クイズ・出典つきで表示される', async ({ page }) => {
    await page.goto(go('/lesson/st-1'))
    await pageExpect(page.locator('article h1')).toContainText('数字を見て、安心していないか')
    await pageExpect(page.locator('article h3')).toHaveCount(5)
    await pageExpect(page.locator('article table.calc').first()).toContainText('x の分散')
    await pageExpect(page.locator('.quiz fieldset')).toHaveCount(4)
    await pageExpect(page.locator('.source-note summary')).toContainText('原典・公式で確認')
    await pageExpect(page.locator('.crumb')).toContainText('データ分析・統計')
  })

  pageTest('Anscombe のデモ: 組を切り替えると、図と注記が変わり、要約の数字は(ほぼ)同じまま', async ({ page }) => {
    await page.goto(go('/lesson/st-1'))
    const demo = page.locator('.anscombe-demo')
    const nums = async () => ({ mx: await demo.locator('#an-mx').innerText(), my: await demo.locator('#an-my').innerText(), vx: await demo.locator('#an-vx').innerText(), r: await demo.locator('#an-r').innerText(), line: await demo.locator('#an-line').innerText() })
    const first = await nums()
    expect(first).toEqual({ mx: '9.00', my: '7.50', vx: '11.00', r: '0.816', line: 'y = 3.00 + 0.500x' })
    for (const id of ['II', 'III', 'IV']) {
      await demo.getByLabel(id, { exact: true }).check()
      await pageExpect(demo.locator('#anscombe-note')).toContainText(`組 ${id}`)
      const n = await nums()
      // 相関係数だけは、小数第3位で 0.816 か 0.817(組 IV は 0.8165)になる
      expect({ ...n, r: undefined }).toEqual({ ...first, r: undefined })
      expect(Math.abs(Number(n.r) - 0.816)).toBeLessThanOrEqual(0.0011)
    }
    await pageExpect(demo.locator('circle')).toHaveCount(11)
  })

  pageTest('判定問題に答えられ、内部リンクで 20-2 に移れる', async ({ page }) => {
    await page.goto(go('/lesson/st-1'))
    const ex = page.locator('.demo').filter({ has: page.getByRole('button', { name: '答え合わせ' }) })
    const answers = ['適切でない', '適切', '適切でない', '適切', '適切でない']
    for (let i = 0; i < answers.length; i++) await ex.locator('.task-row').nth(i).getByRole('button', { name: answers[i], exact: true }).click()
    await ex.getByRole('button', { name: '答え合わせ' }).click()
    await pageExpect(ex).toContainText('5 / 5')
    await page.locator('article a', { hasText: '20-2 評価を自動化する' }).click()
    await pageExpect(page).toHaveURL(/#\/lesson\/20-2$/)
  })

  pageTest('検索で、Markdown のレッスンの本文が見つかる', async ({ page }) => {
    await page.goto(go('/search?q=' + encodeURIComponent('Anscombe')))
    await pageExpect(page.locator('.result').first()).toContainText('数字を見て')
  })

  pageTest('講座の目次: データ分析・統計は、一部公開で、ステージから辿れる', async ({ page }) => {
    await page.goto(go('/course/statistics'))
    await pageExpect(page.locator('.badge', { hasText: '一部公開' })).toBeVisible()
    await page.locator('.stage-card', { hasText: '序論:データから何が言えるか' }).click()
    await page.locator('.lesson-list a').first().click()
    await pageExpect(page.locator('article h1')).toContainText('数字を見て')
  })
})
