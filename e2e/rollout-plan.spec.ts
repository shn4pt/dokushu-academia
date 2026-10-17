import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { buildPageList, summarize, validatePageList } from '../scripts/lib/page-list.mjs'
import { APPROVED_LESSONS, APPROVED_PAGES } from '../scripts/lib/rollout-scope.mjs'
import { expectedIds, summarizeReport } from '../scripts/lib/rollout-summary.mjs'

// 全展開のローカル検証基盤(Issue #33 の A)の、生成一覧と、承認範囲のガードの検査。ブラウザなし。**ページの生成・診断は、しない**。
const small = {
  courses: [{ id: 'pm' }, { id: 'ai' }],
  stages: [{ id: 's1' }, { id: 's2' }],
  lessons: [{ id: 'pm-1' }, { id: 'pm-2' }, { id: 'a-1' }],
}
const okMeta = (route: string) => {
  const m = /^\/(lesson|course|stage)\/(.+)$/.exec(route)
  if (m) {
    const ids = { lesson: small.lessons, course: small.courses, stage: small.stages }[m[1] as 'lesson' | 'course' | 'stage'].map((x) => x.id)
    return ids.includes(m[2]) ? { noindex: false, canonical: route } : { noindex: true, canonical: null }
  }
  if (['/search', '/review', '/progress', '/api-key'].includes(route)) return { noindex: true, canonical: route }
  if (route === '/') return { noindex: false, canonical: '/catalog' }
  if (['/catalog', '/map', '/roadmap', '/glossary', '/sources', '/licenses', '/licenses/materials', '/report', '/llm'].includes(route)) return { noindex: false, canonical: route }
  return { noindex: true, canonical: null }
}

test.describe('生成一覧の検査(合成のデータ。検出の自己検査)', () => {
  test('正しい一覧は、問題なし。件数が、データと一致する', () => {
    const list = buildPageList(small)
    expect(validatePageList(list, small, { routeMeta: okMeta })).toEqual([])
    const s = summarize(list)
    expect(s.byKind.lesson).toBe(3)
    expect(s.byKind.course).toBe(2)
    expect(s.byKind.stage).toBe(2)
    expect(s.shells).toBe(4)
    expect(s.pendingDecision).toEqual(['/llm'])
    expect(summarize(buildPageList(small, { includeLlm: false })).pendingDecision).toEqual([])
  })

  test('重複・漏れ・未知の ID・不正なルートを、検出する', () => {
    const base = buildPageList(small)
    expect(validatePageList([...base, { ...base.find((p) => p.route === '/catalog')! }], small)).toContain('重複: /catalog')
    expect(validatePageList(base.filter((p) => p.route !== '/lesson/pm-2'), small).some((x) => x.startsWith('漏れ: /lesson/pm-2'))).toBe(true)
    expect(validatePageList([...base, { route: '/lesson/ghost', kind: 'lesson', mode: 'generate', noindex: false, sitemap: true, canonical: '/lesson/ghost' }], small).some((x) => x.startsWith('未知の ID: /lesson/ghost'))).toBe(true)
    expect(validatePageList([...base, { route: '/lesson/a b', kind: 'other', mode: 'generate', noindex: false, sitemap: false, canonical: null }], small).some((x) => x.startsWith('不正なルート'))).toBe(true)
    expect(validatePageList(base.filter((p) => p.route !== '/course/ai'), small).some((x) => x.startsWith('漏れ: /course/ai'))).toBe(true)
    expect(validatePageList(base.filter((p) => p.route !== '/stage/s2'), small).some((x) => x.startsWith('漏れ: /stage/s2'))).toBe(true)
  })

  test('sitemap・noindex・殻・重複ページの規則を、検出する', () => {
    const base = buildPageList(small)
    const mod = (route: string, patch: Record<string, unknown>) => base.map((p) => (p.route === route ? { ...p, ...patch } : p))
    expect(validatePageList(mod('/progress', { sitemap: true }), small).some((x) => x.includes('/progress'))).toBe(true) // 殻を sitemap に載せる
    expect(validatePageList(mod('/progress', { noindex: false }), small).some((x) => x.includes('殻・404 は noindex'))).toBe(true)
    expect(validatePageList(mod('/catalog', { noindex: true }), small).some((x) => x.includes('sitemap に載せられない'))).toBe(true) // noindex なのに sitemap
    expect(validatePageList(mod('/', { sitemap: true }), small).some((x) => x.includes('重複ページ'))).toBe(true)
    expect(validatePageList(mod('/', { canonical: '/' }), small).some((x) => x.includes('重複ページ'))).toBe(true)
  })

  test('メタ情報との不一致、未知のルートが見つかったページとして扱われる場合を、検出する', () => {
    const list = buildPageList(small)
    const badNoindex = (r: string) => (r === '/catalog' ? { noindex: true, canonical: '/catalog' } : okMeta(r))
    expect(validatePageList(list, small, { routeMeta: badNoindex }).some((x) => x.includes('noindex が違う: /catalog'))).toBe(true)
    const badCanon = (r: string) => (r === '/lesson/pm-1' ? { noindex: false, canonical: '/lesson/pm-2' } : okMeta(r))
    expect(validatePageList(list, small, { routeMeta: badCanon }).some((x) => x.includes('canonical が違う: /lesson/pm-1'))).toBe(true)
    const everythingFound = () => ({ noindex: false, canonical: '/x' })
    expect(validatePageList(list, small, { routeMeta: everythingFound }).some((x) => x.includes('未知のルートが'))).toBe(true)
  })
})

test.describe('実際のデータ(既存のデータから作った一覧。ページは生成しない)', () => {
  type Out = { summary: ReturnType<typeof summarize>; problems: string[]; list: { route: string; sitemap: boolean; noindex: boolean }[] }
  let out: Out
  test.beforeAll(() => {
    out = JSON.parse(execFileSync('node', ['scripts/rollout-plan.mjs', '--json'], { encoding: 'utf8', maxBuffer: 20_000_000 })) as Out
  })

  test('問題なし。件数が、rollout.md の範囲一覧(§1)と一致する', () => {
    expect(out.problems).toEqual([])
    expect(out.summary.byKind.course).toBe(20)
    expect(out.summary.byKind.stage).toBe(73)
    expect(out.summary.byKind.lesson).toBe(172)
    expect(out.summary.generateWithoutRoot).toBe(274) // `/` を除く(`/llm/` を含む)。rollout.md §1: `/` を含めて 274 は /llm/ を含まない → /llm/ を含めると 275、`/` を除くと 274
    expect(out.summary.generate).toBe(275)
    expect(out.summary.shells).toBe(4)
    expect(out.summary.pendingDecision).toEqual(['/llm'])
  })

  test('承認済みの範囲は、一覧に含まれる。試作の prerender の対象の、sitemap・noindex の扱いは、一覧と一致する', () => {
    const routes = new Set(out.list.map((p) => p.route))
    for (const r of APPROVED_PAGES) expect(routes.has(r), r).toBe(true)
    for (const id of APPROVED_LESSONS) expect(routes.has(`/lesson/${id}`), id).toBe(true)
    // scripts/prerender.mjs の PAGES(本文の文字列から読む)
    const src = readFileSync('scripts/prerender.mjs', 'utf8')
    const pages = [...src.matchAll(/\{ route: '([^']+)', file: '[^']+', ssr: (true|false), sitemap: (true|false) \}/g)]
    expect(pages.length).toBeGreaterThan(8)
    for (const [, route, ssr, sitemap] of pages) {
      if (route === '/__not-found__') continue
      const p = out.list.find((x) => x.route === route)
      expect(p, `${route} が、一覧にある`).toBeTruthy()
      expect(p!.sitemap, `${route} の sitemap`).toBe(sitemap === 'true')
      expect(p!.noindex, `${route} の noindex(殻 = ssr false)`).toBe(ssr === 'false')
    }
  })

  test('診断の対象のレッスンは、package.json の build:path:diag と一致する(承認範囲の唯一の元は rollout-scope.mjs)', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> }
    for (const name of ['build:path:diag', 'build:path:diag:dev']) {
      const ids = /PRERENDER_DIAG=([^ ]+)/.exec(pkg.scripts[name])![1].split(',')
      expect(ids, name).toEqual(APPROVED_LESSONS)
    }
  })
})

test.describe('全 172 教材の実行を、誤って始めないためのガード(Issue #33 の B は、未承認)', () => {
  test('prerender は、承認範囲の外のレッスン ID を拒否する(出力先に diag を含む場合でも)', () => {
    const out = join(mkdtempSync(join(tmpdir(), 'rollout-')), 'diag-out')
    const r = spawnSync('node', ['scripts/build-path.mjs'], { env: { ...process.env, SITE_BASE: '/', OUT_DIR: out, PRERENDER_DIAG: 'pm-1,1-1' }, encoding: 'utf8' })
    expect(r.status).not.toBe(0)
    expect(`${r.stdout}${r.stderr}`).toContain('承認済みの診断の範囲')
    expect(existsSync(join(out, 'lesson', '1-1'))).toBe(false)
  })

  test('PRERENDER_DIAG は、出力先に diag を含まないと使えない(従来の規則)', () => {
    const out = join(mkdtempSync(join(tmpdir(), 'rollout-')), 'plain-out')
    const r = spawnSync('node', ['scripts/build-path.mjs'], { env: { ...process.env, SITE_BASE: '/', OUT_DIR: out, PRERENDER_DIAG: 'pm-1' }, encoding: 'utf8' })
    expect(r.status).not.toBe(0)
  })

  test('rollout-diag は、--scope=full(全件)を拒否する。--dry-run は、何も実行しない', () => {
    const full = spawnSync('node', ['scripts/rollout-diag.mjs', '--scope=full'], { encoding: 'utf8' })
    expect(full.status).toBe(2)
    expect(full.stderr).toContain('承認')
    const all = spawnSync('node', ['scripts/rollout-diag.mjs', '--scope=all'], { encoding: 'utf8' })
    expect(all.status).toBe(2)
    const dry = spawnSync('node', ['scripts/rollout-diag.mjs', '--dry-run'], { encoding: 'utf8' })
    expect(dry.status).toBe(0)
    expect(dry.stdout).toContain('build:path:diag')
    expect(dry.stdout).toContain('全 172 教材は、対象外')
  })

  test('承認範囲は、10 ページ(3 ページ + 7 件 + 対照。pm-1 は重複)に限られる', () => {
    const uniq = new Set([...APPROVED_PAGES, ...APPROVED_LESSONS.map((id: string) => `/lesson/${id}`)])
    expect(uniq.size).toBe(10)
  })
})

// 結果表の集計(レビュー指摘: 引き継ぎ検査のスキップ・欠落を、成功にしない)。合成の Playwright JSON で確かめる。ブラウザ・生成なし。
test.describe('結果表の集計: 承認済みの対象 × 必要な 4 検査が、実際に成功したときだけ、完了', () => {
  type Status = 'expected' | 'skipped' | 'unexpected' | 'flaky'
  const titles = (id: string) => {
    const head = id.startsWith('/') ? `[${id}]` : `[${id}]`
    const handoff = (p: string) => (id.startsWith('/') ? `[${id}] 引き継ぎ: ${p}で、警告・回復可能なエラーがない` : `${id}(メモ): ${p}で、警告・回復可能なエラーがない`)
    return { matrix: `${head} 行列: 初期 HTML`, ops: `${head} 部品の操作と進捗の保護(保存済みの進捗あり)`, handoffNone: handoff('進捗なし'), handoffProgress: handoff('進捗あり') }
  }
  const make = (override: (id: string, check: string) => Status | 'omit' = () => 'expected') => ({
    stats: {},
    suites: [{ specs: expectedIds().flatMap((id) => Object.entries(titles(id)).flatMap(([check, title]) => { const st = override(id, check); return st === 'omit' ? [] : [{ title, tests: [{ status: st, results: [{ annotations: [] }] }] }] })) }],
  })
  test('すべて成功: 10 対象 × 4 検査で完了', () => {
    expect(expectedIds()).toHaveLength(10)
    const r = summarizeReport(make())
    expect(r.complete).toBe(true)
    expect(r.rows.every((x) => x.complete)).toBe(true)
  })
  test('引き継ぎ検査のスキップ(行列は成功)は、引き継ぎ OK にせず、未完了', () => {
    const r = summarizeReport(make((id, c) => (id === 'pm-1' && c.startsWith('handoff') ? 'skipped' : 'expected')))
    const row = r.rows.find((x) => x.id === 'pm-1')!
    expect(row.state.matrix).toBe('OK')
    expect(row.state.handoffNone).toBe('未検証')
    expect(row.state.handoffProgress).toBe('未検証')
    expect(r.complete).toBe(false)
  })
  test('引き継ぎ検査の欠落・対象 ID の欠落・失敗(flaky を含む)・範囲外の対象は、未完了。--partial は、欠落だけ許し、失敗は許さない', () => {
    const noHandoff = make((id, c) => (id === '4-3' && c === 'handoffProgress' ? 'omit' : 'expected'))
    expect(summarizeReport(noHandoff).complete).toBe(false)
    expect(summarizeReport(noHandoff, { partial: true }).complete).toBe(true)
    const noTarget = make((id) => (id === '/catalog' ? 'omit' : 'expected'))
    const rt = summarizeReport(noTarget)
    expect(rt.missingTargets).toEqual(['/catalog'])
    expect(rt.complete).toBe(false)
    for (const bad of ['unexpected', 'flaky'] as const) {
      const f = make((id, c) => (id === '9-2' && c === 'matrix' ? bad : 'expected'))
      expect(summarizeReport(f).complete, bad).toBe(false)
      expect(summarizeReport(f, { partial: true }).complete, `${bad} + partial`).toBe(false)
    }
    const extra = make()
    extra.suites[0].specs.push({ title: '[1-1] 行列: 初期 HTML', tests: [{ status: 'expected', results: [{ annotations: [] }] }] })
    const re = summarizeReport(extra)
    expect(re.outOfScope).toEqual(['1-1'])
    expect(re.complete).toBe(false)
  })
  test('CLI: 完了は終了コード 0、スキップは 1(合成の JSON)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'rollout-report-'))
    const run = (name: string, json: unknown, extra: string[] = []) => {
      const f = join(dir, `${name}.json`)
      writeFileSync(f, JSON.stringify(json))
      return spawnSync('node', ['scripts/rollout-report.mjs', f, join(dir, name), ...extra], { encoding: 'utf8' }).status
    }
    expect(run('ok', make())).toBe(0)
    expect(run('skip', make((id, c) => (id === 'pm-1' && c === 'handoffNone' ? 'skipped' : 'expected')))).toBe(1)
    expect(run('skip-partial', make((id, c) => (id === 'pm-1' && c === 'handoffNone' ? 'omit' : 'expected')), ['--partial'])).toBe(0)
  })
})
