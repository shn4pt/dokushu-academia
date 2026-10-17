// 全展開のローカル検証基盤の実行(Issue #33 の A)。**承認済みの範囲(既存の 3 ページ + 7 件 + 対照 = 10 ページ)だけ**を、生成・診断する。
//   node scripts/rollout-diag.mjs [--scope=approved] [--kind=prod|dev|both] [--dry-run]
//   node scripts/rollout-diag.mjs --list      全教材の生成ページの一覧を、検査・表示するだけ(生成も、診断もしない)
// `--scope=full`(全 172 教材の生成・診断)は、**未承認(Issue #33 の B)なので、実行しない**。この基盤に、全件を実行する経路は、ない。
import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { APPROVED_LESSONS, APPROVED_PAGES } from './lib/rollout-scope.mjs'

const arg = (name, def) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] ?? def
const flag = (name) => process.argv.includes(`--${name}`)
const scope = arg('scope', 'approved')
const kind = arg('kind', 'both')
const dry = flag('dry-run')

if (scope !== 'approved') {
  console.error(`--scope=${scope} は、実行できません。承認済みの範囲(approved)だけです。全 172 教材の生成・診断は、作者の別の承認(Issue #33 の B)が要ります。この基盤には、全件を実行する経路は、ありません。`)
  process.exit(2)
}
if (!['prod', 'dev', 'both'].includes(kind)) { console.error('--kind は、prod / dev / both'); process.exit(2) }

const run = (cmd, args, env = {}) => {
  const line = `${cmd} ${args.join(' ')}`
  console.log(`$ ${line}`)
  if (dry) return 0
  return spawnSync(cmd, args, { stdio: 'inherit', env: { ...process.env, ...env } }).status ?? 1
}

if (flag('list')) process.exit(run('node', ['scripts/rollout-plan.mjs', '--check']))

console.log(`範囲: 承認済み(3 ページ + レッスン ${APPROVED_LESSONS.length} 件: ${APPROVED_LESSONS.join('、')}。pm-1 は重複するので、合わせて 10 ページ)。全 172 教材は、対象外。`)
mkdirSync('rollout-results', { recursive: true })
let code = run('node', ['scripts/rollout-plan.mjs', '--check'])
const kinds = kind === 'both' ? ['prod', 'dev'] : [kind]
for (const k of kinds) {
  if (code !== 0) break
  code = run('npm', ['run', k === 'dev' ? 'build:path:diag:dev' : 'build:path:diag'])
  if (code !== 0) break
  const raw = `rollout-results/raw-${k}.json`
  const t = run('npx', ['playwright', 'test', '--project=diag', '--reporter=line,json'], { PLAYWRIGHT_JSON_OUTPUT_NAME: raw })
  const r = run('node', ['scripts/rollout-report.mjs', raw, `rollout-results/report-${k}`])
  code = t !== 0 || r !== 0 ? 1 : 0
}
process.exit(code)
