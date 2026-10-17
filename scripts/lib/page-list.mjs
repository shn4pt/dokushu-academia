// 全展開の、生成ページの一覧(Issue #33 の A、docs/seo/rollout.md §1)。**既存のデータ(講座・段階・レッスン)から作る**。手書きのリストにしない。
// 純粋な関数だけ(ブラウザ・vite なし)。データの読み込みは、scripts/rollout-plan.mjs。**この一覧を作ることは、ページを生成することではない**(生成は、承認済みの範囲だけ)。

/**
 * @param {{ courses: {id:string}[], stages: {id:string}[], lessons: {id:string}[] }} data  lessons は、公開扱い(本文がある)のレッスン
 * @param {{ includeLlm?: boolean }} [opt]  /llm/ は、要判断(初回は、現行ルートの生成維持を推奨)。既定は、含める
 */
export function buildPageList(data, opt = {}) {
  const gen = (route, kind, extra = {}) => ({ route, kind, mode: 'generate', noindex: false, sitemap: true, canonical: route, ...extra })
  const shell = (route, kind) => ({ route, kind, mode: 'shell', noindex: true, sitemap: false, canonical: null })
  const list = [
    gen('/', 'home', { sitemap: false, canonical: '/catalog', duplicateOf: '/catalog' }),
    gen('/catalog', 'catalog'),
    gen('/map', 'map'),
    gen('/roadmap', 'roadmap'),
    gen('/glossary', 'glossary'),
    gen('/sources', 'sources'),
    gen('/licenses', 'licenses'),
    gen('/licenses/materials', 'licenses-materials'),
    gen('/report', 'report'),
  ]
  if (opt.includeLlm !== false) list.push(gen('/llm', 'llm', { pendingDecision: true }))
  for (const c of data.courses) list.push(gen(`/course/${c.id}`, 'course'))
  for (const s of data.stages) list.push(gen(`/stage/${s.id}`, 'stage'))
  for (const l of data.lessons) list.push(gen(`/lesson/${l.id}`, 'lesson'))
  for (const [route, kind] of [['/search', 'search'], ['/review', 'review'], ['/progress', 'progress'], ['/api-key', 'api-key']]) list.push(shell(route, kind))
  list.push({ route: '/__not-found__', kind: 'not-found', mode: 'not-found', noindex: true, sitemap: false, canonical: null })
  return list
}

/**
 * 一覧の検査。問題の文字列の配列を返す(空なら、問題なし)。
 *  - 重複、不正なルート、未知の ID(データにない)、漏れ(データにある ID が、一覧にない)
 *  - sitemap ⊆ 生成ページ ∧ noindex でない、殻・404 は noindex ∧ sitemap に載せない、重複ページは sitemap に載せず canonical が別
 *  - routeMeta(あれば)との一致: noindex と canonical が、一覧と同じ(未知の ID が、一覧にない / メタ情報が、見つからない扱い)
 * @param {ReturnType<typeof buildPageList>} list
 * @param {{ courses: {id:string}[], stages: {id:string}[], lessons: {id:string}[] }} data
 * @param {{ routeMeta?: (route:string) => {noindex:boolean, canonical:string|null} }} [opt]
 */
export function validatePageList(list, data, opt = {}) {
  const problems = []
  const seen = new Set()
  for (const p of list) {
    if (seen.has(p.route)) problems.push(`重複: ${p.route}`)
    seen.add(p.route)
    if (!/^\/([A-Za-z0-9._~-]+(\/[A-Za-z0-9._~-]+)*)?$/.test(p.route) && p.route !== '/__not-found__') problems.push(`不正なルート: ${p.route}`)
    if (p.sitemap && (p.mode !== 'generate' || p.noindex)) problems.push(`sitemap に載せられないページが載っている: ${p.route}`)
    if (p.mode !== 'generate' && !p.noindex) problems.push(`殻・404 は noindex が必要: ${p.route}`)
    if (p.mode !== 'generate' && p.sitemap) problems.push(`殻・404 を sitemap に載せない: ${p.route}`)
    if (p.duplicateOf && (p.sitemap || p.canonical === p.route)) problems.push(`重複ページは sitemap に載せず、canonical を別にする: ${p.route}`)
  }
  const lessonRoutes = new Set(list.filter((p) => p.kind === 'lesson').map((p) => p.route))
  for (const [kind, ids, prefix] of [['lesson', data.lessons, '/lesson/'], ['course', data.courses, '/course/'], ['stage', data.stages, '/stage/']]) {
    const have = new Set(list.filter((p) => p.kind === kind).map((p) => p.route))
    for (const { id } of ids) if (!have.has(prefix + id)) problems.push(`漏れ: ${prefix + id}(データにあるが、一覧にない)`)
    const known = new Set(ids.map((x) => prefix + x.id))
    for (const r of have) if (!known.has(r)) problems.push(`未知の ID: ${r}(データにない)`)
  }
  if (opt.routeMeta) {
    for (const p of list.filter((x) => x.mode === 'generate' || x.mode === 'shell')) {
      const m = opt.routeMeta(p.route)
      if (m.noindex !== p.noindex) problems.push(`メタ情報と一覧の noindex が違う: ${p.route}(メタ ${m.noindex}、一覧 ${p.noindex})`)
      // canonical は、検索に出すページ(生成ページ)だけを比べる(noindex の殻は、canonical を使わない)
      if (p.mode === 'generate' && (m.canonical ?? null) !== (p.canonical ?? null)) problems.push(`メタ情報と一覧の canonical が違う: ${p.route}(メタ ${m.canonical}、一覧 ${p.canonical})`)
    }
    // 一覧にない(未知の)ルートは、メタ情報が「見つからない」扱い(noindex・canonical なし)になること
    for (const bad of ['/lesson/__no-such-lesson__', '/course/__no__', '/stage/__no__', '/no-such-page']) {
      if (lessonRoutes.has(bad)) continue
      const m = opt.routeMeta(bad)
      if (!m.noindex || m.canonical !== null) problems.push(`未知のルートが、見つかったページとして扱われる: ${bad}`)
    }
  }
  return problems
}

/** 件数の集計(rollout.md §1 の表と、突き合わせる) */
export function summarize(list) {
  const by = {}
  for (const p of list) by[p.kind] = (by[p.kind] ?? 0) + 1
  const generate = list.filter((p) => p.mode === 'generate')
  return {
    total: list.length,
    generate: generate.length,
    generateWithoutRoot: generate.filter((p) => p.route !== '/').length,
    shells: list.filter((p) => p.mode === 'shell').length,
    sitemap: list.filter((p) => p.sitemap).length,
    pendingDecision: list.filter((p) => p.pendingDecision).map((p) => p.route),
    byKind: by,
  }
}
