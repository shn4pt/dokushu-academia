import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { classifyFile, decide } from '../scripts/ci-classify.mjs'

// CI の変更分類(Issue #32、docs/seo/ci-plan.md)の検査。ブラウザなし。**workflow には、つないでいない**(草案の検証)。
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
    expect(ci).toContain('取得に失敗した場合・基準がない場合は、完全な検査') // 安全側
    expect(ci).toContain("'^0+$'") // push で前の基準がない場合は、完全
    expect((ci.match(/if: steps\.c\.outputs\.full == 'true'/g) ?? []).length).toBeGreaterThanOrEqual(7) // 重い手順は、すべて分類の結果に従う
    expect(ci).toContain('if: failure()') // 失敗時の artifact は、従来どおり
    const deploy = strip(readFileSync('docs/seo/ci-plan-draft/deploy.yml', 'utf8'))
    expect(deploy).not.toMatch(/paths-ignore|paths:/)
    expect(deploy).toMatch(/uses: \.\/\.github\/workflows\/ci\.yml/) // 検査は、ci.yml を呼び出す(従来どおり)
    expect(deploy).toMatch(/build:[\s\S]*if: needs\.test\.outputs\.full == 'true'/)
    expect(deploy).toMatch(/deploy:[\s\S]*concurrency:[\s\S]*group: pages/) // 同時実行の制御は、配信のジョブだけ
    expect(deploy.split('concurrency:').length - 1).toBe(1)
  })
})
