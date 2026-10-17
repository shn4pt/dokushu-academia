// 全展開の、生成ページの一覧を、既存のデータから作り、検査する(Issue #33 の A)。**一覧を作る・検査するだけで、ページは生成しない・診断しない**。
//   node scripts/rollout-plan.mjs --check     一覧を検査し、件数を表示(問題があれば、終了コード 1)
//   node scripts/rollout-plan.mjs --json      一覧・件数・検査の結果を、JSON で標準出力へ
//   node scripts/rollout-plan.mjs --write     .rollout/plan.json に書く(診断の検査が、読む。.gitignore 対象)
import { mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'vite'
import { buildPageList, summarize, validatePageList } from './lib/page-list.mjs'

const mode = process.argv[2]
if (!['--check', '--json', '--write'].includes(mode)) {
  console.error('使い方: node scripts/rollout-plan.mjs --check | --json | --write')
  process.exit(2)
}
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true } })
try {
  const cat = await vite.ssrLoadModule('/src/data/catalog.ts')
  const cur = await vite.ssrLoadModule('/src/data/curriculum.ts')
  const les = await vite.ssrLoadModule('/src/lessons/index.ts')
  const seo = await vite.ssrLoadModule('/src/seo.ts')
  const data = {
    courses: cat.courses.map((c) => ({ id: c.id })),
    stages: cur.stages.map((s) => ({ id: s.id })),
    lessons: cur.stages.flatMap((s) => s.lessons).filter((l) => les.isReady(l.id)).map((l) => ({ id: l.id })),
  }
  const list = buildPageList(data)
  const problems = validatePageList(list, data, { routeMeta: (r) => seo.routeMeta(r) })
  const summary = summarize(list)
  const out = { summary, problems, list }
  if (mode === '--json') process.stdout.write(JSON.stringify(out))
  else if (mode === '--write') {
    mkdirSync('.rollout', { recursive: true })
    writeFileSync('.rollout/plan.json', JSON.stringify(out, null, 2) + '\n')
    console.log(`.rollout/plan.json に書きました(生成 ${summary.generate} ページ、殻 ${summary.shells}、問題 ${problems.length} 件)`)
  } else {
    console.log(JSON.stringify(summary, null, 2))
    if (problems.length) console.error('問題:\n' + problems.join('\n'))
  }
  process.exitCode = problems.length ? 1 : 0
} finally {
  await vite.close()
}
