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
  const state = (c) => (c.failed ? 'NG' : c.passed && !c.skipped ? 'OK' : '未検証')
  const out = [...rows.values()]
    .map((x) => {
      const checks = Object.fromEntries(CHECKS.map((c) => [c, state(x.checks[c])]))
      const all = CHECKS.every((c) => checks[c] === 'OK')
      return { ...x, builds: [...x.builds], checks: x.checks, state: checks, complete: all }
    })
    .sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }))
  const failed = out.filter((x) => x.failed)
  const incomplete = out.filter((x) => expected.includes(x.id) && !x.complete && !x.failed)
  const complete = failed.length === 0 && outOfScope.length === 0 && (partial || incomplete.length === 0)
  return { rows: out, expected, missingTargets, outOfScope, failed, incomplete, complete, partial }
}
