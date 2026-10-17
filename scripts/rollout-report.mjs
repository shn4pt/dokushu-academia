// Playwright の JSON の結果から、対象 ID ごとの結果表を作る(Issue #33 の A)。
//   node scripts/rollout-report.mjs <Playwright の JSON> [出力の接頭辞] [--partial]     → <接頭辞>.json と <接頭辞>.md
// 対象 ID は、テストの題名の先頭(`[ID]` または `ID(` の形)から求める。検査は種類ごと(行列・操作・引き継ぎ 2 種)に集計し、**スキップ・欠落は『未検証』**(成功にしない)。
// 承認済みの 10 対象 × 4 検査がすべて成功したときだけ、終了コード 0。`--partial` は、意図的な部分実行(欠落を許す。失敗は、許さない)。
import { readFileSync, writeFileSync } from 'node:fs'
import { CHECKS, CHECK_LABEL, summarizeReport } from './lib/rollout-summary.mjs'

const input = process.argv[2]
const partial = process.argv.includes('--partial')
const prefix = process.argv.slice(3).find((a) => !a.startsWith('--')) ?? 'rollout-results/report'
if (!input) { console.error('使い方: node scripts/rollout-report.mjs <Playwright の JSON> [出力の接頭辞]'); process.exit(2) }
const report = JSON.parse(readFileSync(input, 'utf8'))

const summary = summarizeReport(report, { partial })
const out = summary.rows
const mark = (x, c) => x.state[c]
const md = [
  '| 対象 ID | 検査 | 成功 | 失敗 | スキップ | A1 | A2(生成済み / 計画のみ) | A6b | A7 | A8 | 操作 | 行列 | 操作・進捗の保護 | 引き継ぎ(進捗なし) | 引き継ぎ(進捗あり) |',
  '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|',
  ...out.map((x) => {
    const d = x.data
    const a2 = d.a2 ? `${d.a2.generated} / ${d.a2.plannedNotGenerated}` : '—'
    return `| ${x.id} | ${x.tests} | ${x.passed} | ${x.failed} | ${x.skipped} | ${d.a1 ?? '—'}${d.headings ? `(見出し ${d.headings})` : ''} | ${a2} | ${d.a6b ?? '—'} | ${d.a7 ?? '—'} | ${d.a8 ?? '—'} | ${(d.ops ?? []).join('、') || '—'} | ${mark(x, 'matrix')} | ${mark(x, 'ops')} | ${mark(x, 'handoffNone')} | ${mark(x, 'handoffProgress')} |`
  }),
].join('\n')
writeFileSync(`${prefix}.json`, JSON.stringify({ stats: report.stats, complete: summary.complete, partial, missingTargets: summary.missingTargets, outOfScope: summary.outOfScope, rows: out }, null, 2) + '\n')
writeFileSync(`${prefix}.md`, md + '\n')
console.log(md)
console.log(`\n対象 ${out.length} 件、検査 ${out.reduce((n, x) => n + x.tests, 0)} 件、失敗の対象 ${summary.failed.length} 件、未検証の対象 ${summary.incomplete.length} 件${partial ? '(--partial: 欠落を許す部分実行)' : ''}`)
for (const x of summary.failed) console.error(`NG: ${x.id}: ${x.failures.join(' / ')}`)
for (const x of summary.incomplete) console.error(`未検証: ${x.id}: ${CHECKS.filter((c) => x.state[c] !== 'OK').map((c) => `${CHECK_LABEL[c]}=${x.state[c]}`).join('、')}`)
if (summary.missingTargets.length) console.error(`承認済みの対象が、結果に無い: ${summary.missingTargets.join('、')}`)
if (summary.outOfScope.length) console.error(`承認範囲外の対象が、結果にある: ${summary.outOfScope.join('、')}`)
console.log(summary.complete ? '基盤の完了判定: 完了(承認済みの対象 × 必要な検査が、すべて成功)' : '基盤の完了判定: 未完了(失敗・未検証・欠落・範囲外のいずれかがある)')
process.exitCode = summary.complete ? 0 : 1
