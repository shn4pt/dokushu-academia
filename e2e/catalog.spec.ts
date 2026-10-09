import { go, expect, test } from './fixtures'
import { courseStageIds, courseStatus, courses, groups, isAvailable, layers, writingPlan } from '../src/data/catalog'
import { stages } from '../src/data/curriculum'

test.describe('講座一覧のデータ', () => {
  test('すべてのステージが、ちょうど1つの講座に入っている', () => {
    const used = courses.flatMap(courseStageIds)
    expect(new Set(used).size).toBe(used.length) // 重複なし
    expect([...used].sort()).toEqual(stages.map((s) => s.id).sort()) // 漏れなし・存在しない ID なし
  })
  test('講座の id は一意で、分野は定義済み、どの講座も基礎・実践・応用の3段階', () => {
    expect(new Set(courses.map((c) => c.id)).size).toBe(courses.length)
    for (const c of courses) {
      expect(groups.map((g) => g.id)).toContain(c.group)
      expect(c.tiers.map((t) => t.level)).toEqual(['basic', 'practice', 'advanced'])
    }
  })
  test('どの領域にも、講座が1つ以上ある(空の領域を出さない)', () => {
    for (const g of groups) expect(courses.some((c) => c.group === g.id), g.id).toBe(true)
  })
  test('前提の関係: 存在する講座だけを指し、自分自身を指さず、循環しない', () => {
    const ids = new Set(courses.map((c) => c.id))
    for (const c of courses) for (const r of c.requires ?? []) {
      expect(ids.has(r), `${c.id} → ${r}`).toBe(true)
      expect(r).not.toBe(c.id)
    }
    // 循環の検出(深さ優先)
    const state = new Map<string, number>()
    const visit = (id: string) => {
      if (state.get(id) === 1) throw new Error(`循環: ${id}`)
      if (state.get(id) === 2) return
      state.set(id, 1)
      for (const r of courses.find((c) => c.id === id)?.requires ?? []) visit(r)
      state.set(id, 2)
    }
    for (const c of courses) visit(c.id)
  })
  test('全講座に「なぜ学ぶのか」があり、前提の関係には、それぞれ理由がある', () => {
    for (const c of courses) {
      expect(c.why.length, `${c.id}: why`).toBeGreaterThan(20)
      expect(Object.keys(c.needs ?? {}).sort(), `${c.id}: needs は requires と一致`).toEqual([...(c.requires ?? [])].sort())
      for (const note of Object.values(c.needs ?? {})) expect(note.length).toBeGreaterThan(10)
    }
  })
  test('地図の層は、すべての領域をちょうど1回ずつ含む', () => {
    const inLayers = layers.flatMap((l) => [...l.groupIds]).sort()
    expect(inLayers).toEqual(groups.map((g) => g.id).sort())
  })
  test('各段階に、ステージか目次の案があり、状態(公開中・一部公開・目次のみ)と一致する', () => {
    for (const c of courses) {
      for (const t of c.tiers) expect((t.stageIds?.length ?? 0) + (t.planned?.length ?? 0), `${c.id}/${t.level}`).toBeGreaterThan(0)
      const withStage = c.tiers.filter((t) => t.stageIds?.length).length
      expect(courseStatus(c), c.id).toBe(withStage === 0 ? 'outline' : withStage === c.tiers.length ? 'open' : 'partial')
    }
  })
  test('執筆の計画: 公開済み以外の全講座が、ちょうど1回ずつ入っている', () => {
    const planned = writingPlan.flatMap((w) => w.ids)
    expect(new Set(planned).size).toBe(planned.length)
    const notOpen = courses.filter((c) => courseStatus(c) !== 'open').map((c) => c.id)
    expect([...planned].sort()).toEqual(notOpen.sort())
  })
  test('執筆の計画: 前提の講座は、公開済みか、より先に書く', () => {
    const order = writingPlan.flatMap((w) => w.ids)
    const open = new Set(courses.filter((c) => courseStatus(c) === 'open').map((c) => c.id))
    for (const id of order) {
      const c = courses.find((x) => x.id === id)!
      for (const r of c.requires ?? []) {
        const ok = open.has(r) || (order.indexOf(r) >= 0 && order.indexOf(r) < order.indexOf(id))
        expect(ok, `${id} の前提 ${r}`).toBe(true)
      }
    }
  })
  test('法令・基準の講座は、条文などの根拠の基準が、全体像と考え方に限ると明記される', async () => {
    const { evidenceInfo } = await import('../src/data/catalog')
    expect(evidenceInfo.law.note).toContain('全体像と考え方')
    expect(evidenceInfo.law.note).toContain('確認した日')
  })
})

test('講座一覧: 4つの分野に、全講座が並び、構成案であることが明記される', async ({ page }) => {
  await page.goto(go('/catalog'))
  await expect(page.locator('h1')).toContainText('講座一覧')
  await expect(page.getByRole('note')).toContainText('構成案です')
  await expect(page.locator('section[aria-labelledby^=group-]')).toHaveCount(groups.length)
  await expect(page.locator('.course-card')).toHaveCount(courses.length)
  for (const [label, status] of [['公開中', 'open'], ['一部公開', 'partial'], ['目次のみ', 'outline']] as const) {
    await expect(page.locator('.course-card .badge', { hasText: new RegExp(`^${label}$`) })).toHaveCount(courses.filter((c) => courseStatus(c) === status).length)
  }
})

test('講座の目次(公開中): 既存のステージに移れる', async ({ page }) => {
  await page.goto(go('/catalog'))
  await page.locator('.course-card', { hasText: 'AI エージェント開発' }).click()
  await expect(page.locator('h1')).toContainText('AI エージェント開発')
  await expect(page.locator('.tier h2')).toHaveText(['基礎', '実践', '応用'])
  await expect(page.getByText('発展編:第2部の続き')).toBeVisible()
  await page.locator('.stage-card', { hasText: '発展編' }).click()
  await expect(page.locator('h1')).toContainText('発展編')
})

test('講座の目次(目次のみ): 準備中のレッスンの案と、根拠の基準が表示される', async ({ page }) => {
  await page.goto(go('/course/legal'))
  await expect(page.locator('h1')).toContainText('法務')
  const basis = page.locator('.why-card', { hasText: '根拠の基準' })
  await expect(basis).toContainText('法令・基準')
  await expect(basis).toContainText('個別の事案は扱いません')
  await expect(page.getByRole('region', { name: 'なぜ学ぶのか' })).toContainText('専門家に相談すべき場面')
  await expect(page.getByRole('note')).toContainText('目次の案')
  await expect(page.locator('.planned-item').first()).toContainText('準備中')
  await expect(page.locator('.planned-item a')).toHaveCount(0) // リンクではない(本文がない)
})

test('存在しない講座は、講座一覧に戻る', async ({ page }) => {
  await page.goto(go('/course/nothing'))
  await expect(page.locator('h1')).toContainText('講座一覧')
})

test('ヘッダーのタイトルを押すと、講座一覧に移る', async ({ page }) => {
  await page.goto(go('/lesson/0-1'))
  await page.locator('.site-header .brand').click()
  await expect(page).toHaveURL(/#\/catalog$/)
  await expect(page.locator('h1')).toContainText('講座一覧')
})

test('講座一覧から、続きのレッスンに移れる', async ({ page }) => {
  await page.goto(go('/catalog'))
  const resume = page.getByRole('region', { name: '続きから学ぶ' }).getByRole('link')
  await expect(resume).toContainText('学習を始める')
  await resume.click()
  await expect(page).toHaveURL(/#\/lesson\//)
})

test('地図: 全講座が図に並び、独自の整理であることと、前提の表が表示される', async ({ page }) => {
  await page.goto(go('/map'))
  await expect(page.locator('h1')).toContainText('このサービスの地図')
  await expect(page.getByRole('note')).toContainText('独自の整理')
  await expect(page.locator('.map .chip')).toHaveCount(courses.length)
  await expect(page.locator('.map-layer h3')).toHaveCount(layers.length)
  await expect(page.locator('.chip-open')).toHaveCount(courses.filter(isAvailable).length)
  const row = page.locator('table.calc tr', { hasText: '行動心理学・行動経済学' })
  await expect(row).toContainText('心理学')
  await expect(row).toContainText('データ分析・統計')
  await page.locator('.chip', { hasText: '法務' }).click()
  await expect(page.locator('h1')).toContainText('法務')
})

test('講座の目次: 先に学ぶとよい講座と、そのあとの講座が出る', async ({ page }) => {
  await page.goto(go('/course/statistics'))
  const rel = page.getByRole('region', { name: '講座の関係' })
  await expect(rel).toContainText('根拠の読み方')
  await expect(rel).toContainText('行動心理学・行動経済学')
  await expect(rel).toContainText('必須ではありません')
  await expect(rel).toContainText('実験と相関、因果の違い') // 先に学ぶ理由
  await expect(rel).toContainText('この講座の知識を使う講座')
  await page.goto(go('/course/evidence'))
  await page.getByRole('link', { name: /このサービスの地図/ }).first().click()
  await expect(page).toHaveURL(/#\/map$/)
})

test('講座の目次: 「なぜ学ぶのか」が先頭に出る', async ({ page }) => {
  await page.goto(go('/course/pm'))
  const why = page.getByRole('region', { name: 'なぜ学ぶのか' })
  await expect(why).toContainText('判断の根拠を自分で組み立てられる')
  const rel = page.getByRole('region', { name: '講座の関係' })
  await expect(rel).toContainText('指標の設計と、実験')
})

test.describe('根拠の読み方・序論(最初の、LLM 以外のレッスン)', () => {
  test('講座の目次: 一部公開で、ステージから、レッスンに移れる', async ({ page }) => {
    await page.goto(go('/course/evidence'))
    await expect(page.locator('.badge', { hasText: '一部公開' })).toBeVisible()
    await expect(page.getByRole('note')).toContainText('一部だけ公開中')
    await page.locator('.stage-card', { hasText: '序論:根拠とは何か' }).click()
    await expect(page.locator('.crumb')).toContainText('根拠の読み方')
    await expect(page.locator('.notice')).toHaveCount(0) // LLM の最後のステージが、前提として出ない
    await page.locator('.lesson-list a').first().click()
    await expect(page.locator('article h1')).toContainText('根拠があるとは、どういうことか')
  })

  test('レッスン: 講座のパンくず、前後のレッスンは講座の中だけ、出典は原典で確認', async ({ page }) => {
    await page.goto(go('/lesson/e-1'))
    await expect(page.locator('.crumb')).toContainText('講座一覧')
    await expect(page.locator('.crumb a', { hasText: '根拠の読み方' })).toBeVisible()
    await expect(page.locator('.pager a')).toHaveCount(0) // 他の講座の最後のレッスンに続かない
    await expect(page.locator('.source-note summary')).toContainText('原典・公式で確認')
    await page.locator('.source-note summary').click()
    await expect(page.locator('.source-note')).toContainText('Evidence based medicine')
    await expect(page.locator('.source-note')).toContainText('Open Science Collaboration')
    await expect(page.locator('.source-note')).toContainText('第三者')
  })

  test('レッスン: 読んだ数字だけを使い、医療の例であることと、独自の整理が明記される', async ({ page }) => {
    await page.goto(go('/lesson/e-1'))
    const body = page.locator('article')
    for (const t of ['97%', '36%', '100 件', 'これは医療の話です', 'このサービス独自の整理です']) await expect(body).toContainText(t)
  })

  test('レッスン: 一次情報・二次情報の判定と、考え方の判定に、答え合わせできる', async ({ page }) => {
    await page.goto(go('/lesson/e-1'))
    const demos = page.locator('.demo').filter({ has: page.getByRole('button', { name: '答え合わせ' }) })
    await expect(demos).toHaveCount(2)
    const first = demos.nth(0)
    const answers = ['一次情報', '二次情報', '二次情報', '一次情報', '二次情報', '一次情報']
    for (let i = 0; i < answers.length; i++) await first.locator('.task-row').nth(i).getByRole('button', { name: answers[i], exact: true }).click()
    await first.getByRole('button', { name: '答え合わせ' }).click()
    await expect(first).toContainText('6 / 6')
    const second = demos.nth(1)
    const ok = ['適切でない', '適切', '適切でない', '適切でない', '適切でない']
    for (let i = 0; i < ok.length; i++) await second.locator('.task-row').nth(i).getByRole('button', { name: ok[i], exact: true }).click()
    await second.getByRole('button', { name: '答え合わせ' }).click()
    await expect(second).toContainText('5 / 5')
  })

  test('進捗: 完了すると、全体の進捗と講座一覧の進捗に反映される', async ({ page }) => {
    await page.goto(go('/lesson/e-1'))
    await page.getByRole('button', { name: /完了/ }).first().click()
    await page.goto(go('/catalog'))
    await expect(page.locator('.course-card', { hasText: '根拠の読み方' })).toContainText('1 / 1 レッスン')
  })
})

test('執筆の優先度と状況: 講座一覧と、講座の目次に表示される', async ({ page }) => {
  await page.goto(go('/catalog'))
  const plan = page.getByRole('region', { name: '執筆の優先度' })
  await expect(plan).toContainText('作者の計画で、期日の約束ではありません')
  for (const w of writingPlan) await expect(plan).toContainText(w.title)
  await expect(plan.locator('.chip')).toHaveCount(writingPlan.flatMap((w) => w.ids).length)
  await expect(page.locator('.course-card', { hasText: 'プロダクトマネジメント' })).toContainText('執筆の優先度: 最優先')
  await expect(page.locator('.course-card', { hasText: '監査・内部統制' })).toContainText('執筆の優先度: あとで')
  await expect(page.locator('.course-card', { hasText: 'LLM のしくみ' })).not.toContainText('執筆の優先度')

  await page.goto(go('/course/pm'))
  await expect(page.getByTestId('writing-status')).toContainText('本文 0 / 予定 7 レッスン')
  await expect(page.getByTestId('writing-status')).toContainText('最優先')
  await page.goto(go('/course/evidence'))
  await expect(page.getByTestId('writing-status')).toContainText('本文 1 / 予定 5 レッスン')
  await page.goto(go('/course/llm'))
  await expect(page.getByTestId('writing-status')).toContainText('すべての段階が公開済み')
})

test('LLM の講座の目次から、LLM の講座のホームに移れる', async ({ page }) => {
  await page.goto(go('/course/llm'))
  await page.getByRole('link', { name: /LLM の講座のホーム/ }).click()
  await expect(page).toHaveURL(/#\/llm$/)
  await expect(page.locator('h1')).toContainText('LLMのしくみを、段階的に学ぶ')
  await expect(page.locator('.crumb a', { hasText: '講座一覧' })).toBeVisible()
})
