// レッスンごとの変更履歴(コミットの記録)を src/data/lesson-history.json に書き出す。
// 履歴の全体が必要なので、CI(浅いクローン)では実行せず、手元で実行した結果をコミットする: npm run history
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const index = readFileSync('src/lessons/index.ts', 'utf8')
const map = [...index.matchAll(/'([0-9i-]+)': \(\) => import\('\.\/([A-Za-z0-9]+)'\)/g)].map((m) => [m[1], m[2]])
if (map.length === 0) throw new Error('src/lessons/index.ts からレッスンの対応を読み取れませんでした')

const out = {}
for (const [id, file] of map) {
  const log = execFileSync('git', ['log', '--follow', '--format=%as%x09%h%x09%s', '--', `src/lessons/${file}.tsx`], { encoding: 'utf8' })
  const commits = log.split('\n').filter(Boolean).map((l) => {
    const [date, hash, ...rest] = l.split('\t')
    return { date, hash, subject: rest.join('\t') }
  })
  if (commits.length === 0) continue // まだコミットされていないレッスン
  out[id] = { created: commits[commits.length - 1].date, commits }
}
writeFileSync('src/data/lesson-history.json', JSON.stringify(out, null, 2) + '\n')
console.log(`変更履歴を書き出しました: ${Object.keys(out).length} / ${map.length} レッスン`)
