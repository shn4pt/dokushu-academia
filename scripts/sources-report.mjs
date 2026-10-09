// 再確認の作業リストを出す。確認日が古い順に、レッスンと、参考にした資料(原文を読んだもの)を並べる。
// 使い方: npm run sources:report [件数]   例: npm run sources:report 10
import { readFileSync } from 'node:fs'

const limit = Number(process.argv[2] ?? 20)
const sources = JSON.parse(readFileSync('src/data/lesson-sources.json', 'utf8'))
const rows = Object.entries(sources)
  .filter(([, e]) => e.checkedAt)
  .sort((a, b) => a[1].checkedAt.localeCompare(b[1].checkedAt))
  .slice(0, limit)
const days = (d) => Math.floor((Date.now() - Date.parse(d)) / 86400000)
for (const [id, e] of rows) {
  console.log(`${id}  確認日 ${e.checkedAt}(${days(e.checkedAt)}日前)  ${e.status}`)
  for (const s of e.sources.filter((x) => x.url)) console.log(`    - ${s.title}\n      ${s.url}`)
}
const today = new Date().toISOString().slice(0, 10)
console.log(`\n(${rows.length} 件を表示。再確認したら、src/data/lesson-sources.json の checkedAt を ${today} のように、実際に確認した日に更新します)`)
