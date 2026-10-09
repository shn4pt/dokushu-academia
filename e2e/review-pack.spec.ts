import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'

// 確認の材料の自動生成(scripts/review-pack.mjs)。ブラウザは使わない。
const tmp = mkdtempSync(join(tmpdir(), 'pack-test-'))
function pack(args: string[], verify: Record<string, string> = {}) {
  const dir = mkdtempSync(join(tmp, 'v-'))
  for (const [id, text] of Object.entries(verify)) writeFileSync(join(dir, `${id}.md`), text)
  const out = join(mkdtempSync(join(tmp, 'o-')), 'pack.md')
  execFileSync('node', ['scripts/review-pack.mjs', ...args, '--out', out, '--verify-dir', dir], { encoding: 'utf8' })
  return readFileSync(out, 'utf8')
}

test.describe('確認の材料', () => {
  test('設計の要点と、レッスンごとの出典・状況・限界の目印が載る', () => {
    const md = pack(['evidence'])
    expect(md).toContain('# 確認の材料: 根拠の読み方')
    expect(md).toContain('## 0. 判定の要約')
    expect(md).toContain('原典・公式で確認')
    expect(md).toContain('根拠-1 根拠があるとは、どういうことか')
    expect(md).toContain('[Primary vs. Secondary Sources(Columbia College Chicago 図書館)](https://libguides.colum.edu/PrimarySources)')
    expect(md).toContain('**限界の可能性(注記から抽出)**')
    expect(md).toContain('本文は未読')
    expect(md).toContain('学術 — 査読された論文')
    expect(md).toContain('同じデータが、見方で逆になる') // 公開済みの、ほかのレッスンも載る
    expect(md).toContain('根拠が少ない分野での判断')
    expect(pack(['statistics'])).toContain('準備中: 平均・ばらつき・分布') // 目次の案も載る
  })

  test('別の目の確認が未実施なら、黄色の目印が出る。実施済みなら、結果が取り込まれる', () => {
    expect(pack(['statistics'])).toMatch(/別の目の確認: \*\*未実施\*\*/)
    const done = pack(['statistics'], { 'st-1': '# 別の目の確認: st-1(2099-01-01)\n\n| 主張 | 判定 |\n|---|---|\n| 例の主張 | 裏づく |\n' })
    expect(done).toContain('別の目の確認: **実施済み**(2099-01-01)')
    expect(done).toContain('| 例の主張 | 裏づく |')
    expect(done).not.toContain('別の目の確認が未実施です')
  })

  test('本文が、別の目の確認のあとに変更されていたら、警告する', () => {
    const md = pack(['statistics'], { 'st-1': '# 別の目の確認: st-1(2000-01-01)\n\n表\n' })
    expect(md).toContain('別の目の確認のあとに、本文が変更されています')
  })

  test('古さの判定: 基準日を進めると、確認日の古さが警告される', () => {
    const md = pack(['evidence', '--now', '2028-01-01'])
    expect(md).toMatch(/確認日が \d+ 日をこえています/)
  })

  test('段階を絞れる(本文のない段階は、レッスンなし)', () => {
    const md = pack(['statistics', '--tier', 'advanced'])
    expect(md).toContain('# 確認の材料: データ分析・統計(応用)')
    expect(md).toContain('公開済みのレッスンは、ありません')
  })

  test('法令・基準の講座は、高リスクとして、人の確認が必須だと示す', () => {
    const md = pack(['legal'])
    expect(md).toContain('高リスクの分野(法令・基準)です')
    expect(md).toContain('あなたが全レッスンを確認してください')
  })

  test('高リスクでない講座は、そう示す', () => {
    expect(pack(['evidence'])).toContain('高リスクの分野ではありません')
  })

  test('知らない講座を指定すると、使い方を出して、失敗する', () => {
    const r = spawnSync('node', ['scripts/review-pack.mjs', 'no-such-course'], { encoding: 'utf8' })
    expect(r.status).toBe(1)
    expect(r.stderr).toContain('使い方')
    expect(r.stderr).toContain('evidence')
  })

  test('実行しない検査は、未実行と書く(実行したことにしない)', () => {
    const md = pack(['evidence'])
    expect(md).toContain('未実行(`--checks`')
    expect(md).toContain('未実行(`--links`')
  })
})
