// Playwright の JSON の結果から、対象 ID ごとの結果表を作る(Issue #33 の A)。
//   node scripts/rollout-report.mjs <Playwright の JSON> [出力の接頭辞]     → <接頭辞>.json と <接頭辞>.md
// 対象 ID は、テストの題名の先頭(`[ID]` または `ID(` の形)から求める。検査の結果(annotation `rollout`)も、ID ごとにまとめる。
import { readFileSync, writeFileSync } from 'node:fs'

const input = process.argv[2]
const prefix = process.argv[3] ?? 'rollout-results/report'
if (!input) { console.error('使い方: node scripts/rollout-report.mjs <Playwright の JSON> [出力の接頭辞]'); process.exit(2) }
const report = JSON.parse(readFileSync(input, 'utf8'))

const rows = new Map()
const row = (id) => { if (!rows.has(id)) rows.set(id, { id, tests: 0, passed: 0, failed: 0, skipped: 0, builds: new Set(), data: {} }); return rows.get(id) }
const idOf = (title) => /^\[([^\]]+)\]/.exec(title)?.[1] ?? /^([A-Za-z0-9-]+)\(/.exec(title)?.[1] ?? null

const walk = (suite) => {
  for (const spec of suite.specs ?? []) {
    const id = idOf(spec.title)
    for (const t of spec.tests ?? []) {
      const r = t.results?.[t.results.length - 1]
      if (!id) continue
      const x = row(id)
      x.tests++
      const ok = t.status === 'expected'
      if (t.status === 'skipped') x.skipped++
      else if (ok) x.passed++
      else x.failed++
      for (const a of r?.annotations ?? t.annotations ?? []) {
        if (a.type !== 'rollout' || !a.description) continue
        const d = JSON.parse(a.description)
        if (d.build) x.builds.add(d.build)
        Object.assign(x.data, d)
      }
      if (!x.failures) x.failures = []
      if (!ok && t.status !== 'skipped') x.failures.push(spec.title)
    }
  }
  for (const s of suite.suites ?? []) walk(s)
}
for (const s of report.suites ?? []) walk(s)

const out = [...rows.values()].map((x) => ({ ...x, builds: [...x.builds] })).sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }))
const status = (x) => (x.failed ? 'NG' : x.passed ? 'OK' : '—')
const md = [
  '| 対象 ID | 検査 | 成功 | 失敗 | A1 | A2(生成済み / 計画のみ) | A6b | A7 | A8 | 操作 | 引き継ぎ(別の検査) |',
  '|---|---|---|---|---|---|---|---|---|---|---|',
  ...out.map((x) => {
    const d = x.data
    const a2 = d.a2 ? `${d.a2.generated} / ${d.a2.plannedNotGenerated}` : '—'
    return `| ${x.id} | ${x.tests} | ${x.passed} | ${x.failed} | ${d.a1 ?? '—'}${d.headings ? `(見出し ${d.headings})` : ''} | ${a2} | ${d.a6b ?? '—'} | ${d.a7 ?? '—'} | ${d.a8 ?? '—'} | ${(d.ops ?? []).join('、') || '—'} | ${x.failed ? 'NG' : x.passed ? 'OK' : '—'} |`
  }),
].join('\n')
writeFileSync(`${prefix}.json`, JSON.stringify({ stats: report.stats, rows: out }, null, 2) + '\n')
writeFileSync(`${prefix}.md`, md + '\n')
const failed = out.filter((x) => x.failed)
console.log(md)
console.log(`\n対象 ${out.length} 件、検査 ${out.reduce((n, x) => n + x.tests, 0)} 件、失敗の対象 ${failed.length} 件`)
for (const x of failed) console.error(`NG: ${x.id}: ${(x.failures ?? []).join(' / ')}`)
process.exitCode = failed.length ? 1 : 0
