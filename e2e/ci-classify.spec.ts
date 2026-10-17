import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { expect, test } from '@playwright/test'
import { classifyFile, decide } from '../scripts/ci-classify.mjs'
import { gate } from '../scripts/ci-publish-gate.mjs'

// CI の変更分類(Issue #32、docs/seo/ci-plan.md)の検査。ブラウザなし。**workflow には、つないでいない**(草案の検証)。
const dj0 = (d: string) => d.slice(d.indexOf('  deploy:'))
test.describe('変更の分類: 文書だけと確定したときだけ、完全な検査を省く', () => {
  test('文書だけの変更は、完全な検査を省き、配信も省く', () => {
    for (const files of [['docs/seo/plan.md'], ['README.md'], ['docs/seo/prototype/a.png', 'docs/memory/MEMORY.md'], ['reviews/x.md', 'docs/pilot/a.md']]) {
      const d = decide(files)
      expect(d.fullTests, files.join(',')).toBe(false)
      expect(d.deploy, files.join(',')).toBe(false)
    }
  })

  test('文書に見えて、ビルド・テストが読むファイルは、完全な検査にする(LICENSE、LICENSE-CONTENT.md、docs/licenses.md)', () => {
    for (const f of ['LICENSE', 'LICENSE-CONTENT.md', 'docs/licenses.md']) {
      expect(decide([f]).fullTests, f).toBe(true)
      expect(decide(['docs/seo/plan.md', f]).fullTests, `docs + ${f}`).toBe(true)
    }
  })

  test('コード・データ・教材・設定・テスト・スクリプトは、完全な検査にする。文書が混ざっていても同じ', () => {
    for (const f of ['src/App.tsx', 'src/data/lesson-sources.json', 'src/content/pm-1.md', 'scripts/prerender.mjs', 'e2e/a.spec.ts', 'package.json', 'package-lock.json', 'vite.config.ts', 'playwright.config.ts', 'tsconfig.json', 'index.html']) {
      expect(decide([f]).fullTests, f).toBe(true)
      expect(decide(['docs/seo/plan.md', f]).fullTests, `docs + ${f}`).toBe(true)
    }
  })

  test('workflow の変更は、完全な検査にし、理由に明示する', () => {
    const d = decide(['.github/workflows/ci.yml', 'docs/seo/ci-plan.md'])
    expect(d.fullTests).toBe(true)
    expect(d.classes).toContain('ci')
    expect(d.reason).toContain('workflow')
  })

  test('空の一覧(取得失敗の可能性)・未知のパス・名前の揺れは、すべて完全な検査(安全側)', () => {
    expect(decide([]).fullTests).toBe(true)
    expect(decide(['', '  ']).fullTests).toBe(true)
    expect(decide(['unknown/thing.bin']).fullTests).toBe(true)
    expect(decide(['docs']).fullTests).toBe(true) // docs という名前のファイル(ディレクトリ配下ではない)
    expect(decide(['docsx/a.md']).fullTests).toBe(true)
    expect(decide(['./docs/seo/plan.md']).fullTests).toBe(false) // 先頭の ./ は、同じ
    expect(decide(['docs\\seo\\plan.md']).fullTests).toBe(false) // 区切りの違いは、同じ
    expect(classifyFile('DOCS/seo/plan.md')).toBe('code') // 大文字小文字は、区別する(安全側)
  })

  test('検査が読むファイルの一覧は、実際の読み取りと一致する(ビルド・テストが、リポジトリの文書を読むなら、ここに足す)', () => {
    // vite.config.ts が読む文書(公開文書の生成)と、テストが読む文書
    const vite = readFileSync('vite.config.ts', 'utf8')
    for (const f of ['LICENSE-CONTENT.md', 'docs/licenses.md', 'LICENSE']) {
      expect(vite.includes(`'${f}'`), f).toBe(true)
      expect(classifyFile(f), f).toBe('code')
    }
  })

  test('草案の workflow: ジョブは従来と同じ名前の 1 つ(test)。workflow ごと省かず、必須チェックが Pending のままにならない。main の実行は取り消さない', () => {
    const strip = (t: string) => t.split('\n').filter((l) => !l.trim().startsWith('#')).join('\n') // コメントは除く
    const ci = strip(readFileSync('docs/seo/ci-plan-draft/ci.yml', 'utf8'))
    expect(ci).toMatch(/jobs:\s*\n\s+test:/) // ジョブ名は従来の test のまま(必須チェックの名前が、変わらない)
    expect(ci.match(/^  [a-z]+:\s*$/gm)?.filter((x) => !/^  (pull_request|workflow_call|workflow_dispatch|test):/.test(x)) ?? []).toEqual([]) // ジョブは 1 つだけ
    expect(ci).not.toMatch(/paths-ignore|paths:/) // workflow ごと省くと、必須チェックが Pending のままになる(公式資料)
    expect(ci).toContain("cancel-in-progress: ${{ github.event_name == 'pull_request' }}") // main の実行は、取り消さない
    expect(ci).toContain('github.run_id') // main は実行ごとに別の group(待機中の実行が、置き換えられない)
    expect(ci).toContain('--no-renames') // 移動元の削除を見落とさない
    expect(ci).toContain('merge-base --is-ancestor') // 強制 push など、基準が祖先でない場合は、完全
    expect(ci).toContain('environment=github-pages') // main の基準は、最後に配信したコミット
    expect(ci).toContain('基準がない場合・基準が祖先でない場合は、完全な検査') // 安全側
    expect((ci.match(/if: steps\.c\.outputs\.full == 'true'/g) ?? []).length).toBeGreaterThanOrEqual(7) // 重い手順は、すべて分類の結果に従う
    expect(ci).toContain('if: failure()') // 失敗時の artifact は、従来どおり
    const deploy = strip(readFileSync('docs/seo/ci-plan-draft/deploy.yml', 'utf8'))
    expect(deploy).not.toMatch(/paths-ignore|paths:/)
    expect(deploy).toMatch(/uses: \.\/\.github\/workflows\/ci\.yml/) // 検査は、ci.yml を呼び出す(従来どおり)
    expect(deploy).toMatch(/build:[\s\S]*if: needs\.test\.outputs\.full == 'true'/)
    expect(deploy).toMatch(/deploy:[\s\S]*concurrency:[\s\S]*group: pages/) // 同時実行の制御は、配信のジョブだけ
    expect(deploy.split('concurrency:').length - 1).toBe(1)
    expect(deploy).not.toContain('cancel-in-progress: true') // 配信を取り消さない(queue: max とも併用できない)
    expect(dj0(deploy)).toContain('queue: max') // 待機を 1 件にしない(古い実行が、待機中の最新版を置き換えない)
    // 順序の逆転: 判定は、排他区間(concurrency: pages を持つ deploy ジョブ)の中の、実配信より前のステップ。build ジョブには置かない
    const dj = deploy.slice(deploy.indexOf('  deploy:'))
    expect(dj.indexOf('ci-publish-gate.mjs')).toBeGreaterThan(dj.indexOf('group: pages'))
    expect(dj.indexOf('ci-publish-gate.mjs')).toBeLessThan(dj.indexOf('actions/deploy-pages'))
    expect(deploy.slice(0, deploy.indexOf('  deploy:'))).not.toContain('ci-publish-gate')
    expect(dj).toContain('set -o pipefail') // 判定の失敗を、パイプで隠さない
  })

  test('検査が読む文書: 検査・ビルドの中で、リポジトリの文書を直接読んでいるものは、分類で完全な検査になる(自動発見。動的なパスは見つけられない)', () => {
    const files = ['vite.config.ts', ...readdirSync('e2e').filter((f) => f.endsWith('.ts')).map((f) => `e2e/${f}`), ...readdirSync('scripts').filter((f) => f.endsWith('.mjs')).map((f) => `scripts/${f}`)]
    const re = /readFileSync\(\s*['"`]((?:docs|reviews)\/[^'"`$]+|README\.md|LICENSE[^'"`$]*)['"`]/g
    const found = new Set<string>()
    for (const f of files) for (const m of readFileSync(f, 'utf8').matchAll(re)) found.add(m[1])
    expect(found.size).toBeGreaterThan(0)
    // e2e/ci-classify.spec.ts 自身の読み取り(草案)も含まれる
    for (const f of found) expect(classifyFile(f), `${f} を読む検査があるのに、文書として省かれる`).toBe('code')
  })

  test('草案(docs/seo/ci-plan-draft/)は、検査が構造を読むので、完全な検査にする', () => {
    expect(decide(['docs/seo/ci-plan-draft/ci.yml']).fullTests).toBe(true)
    expect(decide(['docs/seo/ci-plan-draft/deploy.yml', 'docs/seo/plan.md']).fullTests).toBe(true)
    expect(decide(['docs/seo/ci-plan.md']).fullTests).toBe(false)
  })
})

// 実際の Git の差分で確かめる(移動・削除。レビュー指摘: 既定の `git diff --name-only` は、移動で、移動先だけを返す)
test.describe('実際の Git の差分の分類(一時リポジトリ)', () => {
  const git = (cwd: string, ...a: string[]) => execFileSync('git', ['-c', 'user.email=t@example.com', '-c', 'user.name=t', ...a], { cwd, encoding: 'utf8' })
  const run = (setup: (d: string) => void, change: (d: string) => void) => {
    const d = mkdtempSync(join(tmpdir(), 'ci-classify-'))
    try {
      git(d, 'init', '-q', '-b', 'main')
      setup(d)
      git(d, 'add', '-A'); git(d, 'commit', '-q', '-m', 'base')
      git(d, 'checkout', '-q', '-b', 'topic')
      change(d)
      git(d, 'add', '-A'); git(d, 'commit', '-q', '-m', 'change')
      const out = execFileSync('node', [join(process.cwd(), 'scripts/ci-classify.mjs'), 'main'], { cwd: d, encoding: 'utf8' })
      return JSON.parse(out) as { fullTests: boolean; deploy: boolean }
    } finally { rmSync(d, { recursive: true, force: true }) }
  }
  const put = (d: string, p: string, c: string) => { mkdirSync(dirname(join(d, p)), { recursive: true }); writeFileSync(join(d, p), c) }
  const mv = (d: string, a: string, b: string) => { mkdirSync(dirname(join(d, b)), { recursive: true }); git(d, 'mv', a, b) }
  const body = Array.from({ length: 30 }, (_, i) => `line ${i}`).join('\n') // 十分に大きい内容(rename として検出される)

  test('コード → docs の移動(内容が同じ)は、完全な検査', () => {
    const r = run((d) => put(d, 'src/input.txt', body), (d) => mv(d, 'src/input.txt', 'docs/input.txt'))
    expect(r.fullTests).toBe(true)
  })
  test('docs/licenses.md → 別の docs の移動は、完全な検査(ライセンス入力の削除)', () => {
    const r = run((d) => put(d, 'docs/licenses.md', body), (d) => mv(d, 'docs/licenses.md', 'docs/archive/licenses-old.md'))
    expect(r.fullTests).toBe(true)
  })
  test('docs → docs の移動だけなら、文書だけ(省く)', () => {
    const r = run((d) => put(d, 'docs/a.md', body), (d) => mv(d, 'docs/a.md', 'docs/b/a.md'))
    expect(r.fullTests).toBe(false)
  })
  test('コードの削除は、完全な検査', () => {
    const r = run((d) => put(d, 'src/x.ts', body), (d) => rmSync(join(d, 'src/x.ts')))
    expect(r.fullTests).toBe(true)
  })
})

// 配信順の保証(PR #35 のレビュー指摘)。判定(gate)と、排他区間(concurrency: pages)の状態遷移を、合成の状態で確かめる。Actions の動作の確認ではない。
test.describe('配信の可否の判定と、排他区間での順序', () => {
  test('gate: 先頭のときだけ配信。先頭を取得できない場合・古い場合は、配信しない', () => {
    expect(gate('A', 'A').publish).toBe(true)
    expect(gate('A', 'B').publish).toBe(false)
    expect(gate('A', '').publish, '先頭を取得できない').toBe(false)
    expect(gate('A', undefined).publish).toBe(false)
    expect(gate('', 'A').publish).toBe(false)
  })

  // 状態遷移: 2 つの実行 A(古い)・B(新しい)。main の先頭は、B の push で A から B に替わる。deploy ジョブは、排他区間(1 つずつ)で、
  // 『判定 → 配信』を行う。判定は、区間に入った時点の main の先頭で行う。許す並びを、すべて列挙する。
  type Ev = 'pushB' | 'A' | 'B'
  const simulate = (order: Ev[], apiFails = false) => {
    let head = 'A'
    const deployed: string[] = []
    for (const e of order) {
      if (e === 'pushB') head = 'B'
      else {
        const g = gate(e, apiFails ? '' : head) // 区間の中で、判定と配信が連続する(割り込まれない)
        if (g.publish) deployed.push(e)
      }
    }
    return deployed
  }
  const orders: Ev[][] = [
    ['A', 'pushB', 'B'], // A が先に配信 → B が配信(正しい順)
    ['pushB', 'A', 'B'], // 確認後に A が遅延 → B が先に push。A が区間に入る時点で、先頭は B → A は配信しない
    ['pushB', 'B', 'A'], // B が先に配信を終え、A が後から再開 → A は配信しない(旧版へ戻らない)
  ]
  test('A が遅延しても、B が先に配信しても、旧版 A が B の後に配信されない', () => {
    for (const o of orders) {
      const d = simulate(o)
      expect(d.lastIndexOf('B'), o.join('→')).toBeGreaterThanOrEqual(d.indexOf('A'))
      expect(d.join(''), o.join('→')).not.toContain('BA') // B の後に A が来ない
      expect(d[d.length - 1], o.join('→')).toBe('B') // 最後に配信されるのは、新しい版
    }
    expect(simulate(['pushB', 'A', 'B'])).toEqual(['B'])
    expect(simulate(['pushB', 'B', 'A'])).toEqual(['B'])
    expect(simulate(['A', 'pushB', 'B'])).toEqual(['A', 'B'])
  })
  test('先頭の取得に失敗した場合は、どちらも配信しない(旧版を公開しうる側へ進めない)', () => {
    expect(simulate(['pushB', 'A', 'B'], true)).toEqual([])
  })

  // 待機の置換(PR #35 の再々レビュー指摘): X が配信中に、B・A の順で push され、B のビルドが先に終わって待機、遅れて A が到着する。
  // 排他区間(1 つずつ)と待機の規則を模す。queue=single: 待機は 1 件で、新しい待機が古い待機を置き換える(取り消す)/ max: 待機は順に並ぶ(上限 100)
  const simulateQueue = (queue: 'single' | 'max', arrivals: string[], head: string, cap = 100) => {
    const pending: string[] = []
    const cancelled: string[] = []
    for (const r of arrivals) {
      if (queue === 'single') { for (const old of pending.splice(0)) cancelled.push(old); pending.push(r) }
      else if (pending.length >= cap) cancelled.push(r)
      else pending.push(r)
    }
    const deployed: string[] = []
    const failed: string[] = []
    for (const r of pending) (gate(r, head).publish ? deployed : failed).push(r) // X の完了後、順に区間へ入り、判定する
    return { deployed, failed, cancelled }
  }
  test('X 配信中に B が待機し、遅れて A が到着: 既定(single)では B が取り消されて配信されない / queue: max では B が配信される', () => {
    const single = simulateQueue('single', ['B', 'A'], 'B')
    expect(single.cancelled, '反例: 待機中の B が、A に置き換えられる').toEqual(['B'])
    expect(single.deployed, '反例: 先頭 B を配信する実行が残らない').toEqual([])
    const max = simulateQueue('max', ['B', 'A'], 'B')
    expect(max.cancelled).toEqual([])
    expect(max.deployed, 'B が配信される').toEqual(['B'])
    expect(max.failed, 'A は先頭でないので、判定で停止(配信しない)').toEqual(['A'])
  })
  test('queue: max の限界: 待機が上限を超えると、超えた分は取り消される(未配信の検知・手動再実行が要る)', () => {
    const r = simulateQueue('max', ['A', 'B', 'C'], 'C', 2)
    expect(r.cancelled).toEqual(['C']) // 先頭 C が、上限で取り消される → 配信されない
    expect(r.deployed).toEqual([])
  })
})
