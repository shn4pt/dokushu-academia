// Playwright の JSON から、承認済みの対象 ID ごとの結果を作る(Issue #33 の A)。**検査の種類ごと**に、成功・失敗・未検証(スキップ・欠落)を区別する。
// 判定: 承認済みの 10 対象 × 必要な 4 検査(行列・操作・引き継ぎ(進捗なし)・引き継ぎ(進捗あり))が**すべて実際に成功**したときだけ、完了(complete)。
//   スキップ・欠落・失敗は、完了にしない。意図的な部分実行は、`partial: true`(CLI は `--partial`)を明示したときだけ、欠落を許す(失敗は、常に非完了)。
import { APPROVED_LESSONS, APPROVED_PAGES } from './rollout-scope.mjs'

export const CHECKS = ['matrix', 'ops', 'handoffNone', 'handoffProgress']
export const CHECK_LABEL = { matrix: '行列', ops: '操作・進捗の保護', handoffNone: '引き継ぎ(進捗なし)', handoffProgress: '引き継ぎ(進捗あり)' }

/** 承認済みの対象 ID: レッスンは ID、ページは route(`/lesson/pm-1` は、レッスン pm-1 と同じ対象) */
export const expectedIds = () => [...new Set([...APPROVED_PAGES.filter((r) => !r.startsWith('/lesson/')), ...APPROVED_LESSONS])]

export const idOf = (title) => /^\[([^\]]+)\]/.exec(title)?.[1] ?? /^([A-Za-z0-9-]+)\(/.exec(title)?.[1] ?? null
/** テストの題名から、検査の種類を求める。求められなければ null(集計に含めない) */
export const checkOf = (title) => {
  if (title.includes('行列:')) return 'matrix'
  if (title.includes('部品の操作と進捗の保護')) return 'ops'
  if (title.includes('進捗なしで')) return 'handoffNone'
  if (title.includes('進捗ありで')) return 'handoffProgress'
  return null
}

export function summarizeReport(report, { partial = false } = {}) {
  const rows = new Map()
  const row = (id) => {
    if (!rows.has(id)) rows.set(id, { id, tests: 0, passed: 0, failed: 0, skipped: 0, builds: new Set(), data: {}, failures: [], checks: Object.fromEntries(CHECKS.map((c) => [c, { passed: 0, failed: 0, skipped: 0 }])) })
    return rows.get(id)
  }
  const walk = (suite) => {
    for (const spec of suite.specs ?? []) {
      const id = idOf(spec.title)
      const check = checkOf(spec.title)
      for (const t of spec.tests ?? []) {
        if (!id) continue
        const r = t.results?.[t.results.length - 1]
        const x = row(id)
        x.tests++
        const bucket = t.status === 'skipped' ? 'skipped' : t.status === 'expected' ? 'passed' : 'failed' // flaky・unexpected は失敗
        x[bucket]++
        if (check) x.checks[check][bucket]++
        if (bucket === 'failed') x.failures.push(spec.title)
        for (const a of r?.annotations ?? t.annotations ?? []) {
          if (a.type !== 'rollout' || !a.description) continue
          const d = JSON.parse(a.description)
          if (d.build) x.builds.add(d.build)
          Object.assign(x.data, d)
        }
      }
    }
    for (const s of suite.suites ?? []) walk(s)
  }
  for (const s of report.suites ?? []) walk(s)

  const expected = expectedIds()
  const missingTargets = expected.filter((id) => !rows.has(id))
  const outOfScope = [...rows.keys()].filter((id) => !expected.includes(id))
  for (const id of expected) row(id) // 欠落した対象も、行に出す(未検証)
  // 検査の状態: OK = 実際に成功(スキップなし)/ NG = 失敗(flaky を含む)/ 未検証 = スキップがある / 欠落 = その検査の結果が、そもそも無い
  const state = (c) => (c.failed ? 'NG' : c.skipped ? '未検証' : c.passed ? 'OK' : '欠落')
  const out = [...rows.values()]
    .map((x) => {
      const checks = Object.fromEntries(CHECKS.map((c) => [c, state(x.checks[c])]))
      return { ...x, builds: [...x.builds], checks: x.checks, state: checks, complete: CHECKS.every((c) => checks[c] === 'OK') }
    })
    .sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }))
  const inScope = out.filter((x) => expected.includes(x.id))
  const failed = out.filter((x) => x.failed)
  const incomplete = inScope.filter((x) => !x.complete && !x.failed)
  const hasSkipped = inScope.some((x) => CHECKS.some((c) => x.state[c] === '未検証'))
  // 全体の完了(allComplete): 承認済みの 10 対象 × 4 検査が、すべて実際に成功。**部分実行でも、これは true にならない**
  const allComplete = failed.length === 0 && outOfScope.length === 0 && incomplete.length === 0
  // 部分実行の許容(accepted): 明示した `partial` のときだけ、**欠落**を許す。失敗・スキップ・範囲外は、常に不可
  const accepted = allComplete || (partial && failed.length === 0 && outOfScope.length === 0 && !hasSkipped)
  return { rows: out, expected, missingTargets, outOfScope, failed, incomplete, allComplete, accepted, partial }
}
