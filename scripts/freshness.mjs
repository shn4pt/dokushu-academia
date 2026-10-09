// 鮮度の点検: 確認日が古いレッスンと、切れた外部リンクを調べ、報告を書き出す。AI は使わない(費用がかからない)。
//   node scripts/freshness.mjs                  確認日の古さだけ
//   node scripts/freshness.mjs --links          外部リンクの確認も行う(ネットワークが要る)
//   node scripts/freshness.mjs --out report.md  報告を、ファイルにも書く
// 問題があるときだけ、報告の先頭に「<!-- has-issues -->」を入れる(定期実行が、issue を作る目印)。
// 古さの基準は src/data/gates.ts の maxAgeDays。Node 22.18 以上(型を取り除いて読む)が必要。
import { readFileSync, writeFileSync } from 'node:fs'
import { courses } from '../src/data/catalog.ts'
import { stages } from '../src/data/curriculum.ts'
import { ageDays, courseOfLesson, maxAgeDays } from '../src/data/gates.ts'
import { checkLinks } from './lib/links.mjs'

const args = process.argv.slice(2)
const withLinks = args.includes('--links')
const out = args.includes('--out') ? args[args.indexOf('--out') + 1] : undefined
const now = args.includes('--now') ? new Date(args[args.indexOf('--now') + 1]) : new Date() // --now 日付: 古さの判定を試すとき用
const sources = JSON.parse(readFileSync('src/data/lesson-sources.json', 'utf8'))
const ready = new Set([...readFileSync('src/lessons/index.ts', 'utf8').matchAll(/'([0-9a-z-]+)': \(\) => import\(/g)].map((m) => m[1]))

const lines = []
let problems = 0

// ---- 1. 確認日の古さ ----
const stale = []
for (const id of ready) {
  const e = sources[id]
  if (!e?.checkedAt) continue
  const kind = courseOfLesson(id, stages, courses)?.evidence ?? 'tech'
  const age = ageDays(e.checkedAt, now)
  if (age > maxAgeDays[kind]) stale.push({ id, kind, age, limit: maxAgeDays[kind], checkedAt: e.checkedAt, urls: (e.sources ?? []).filter((s) => s.how === 'read' && s.url).map((s) => s.url) })
}
stale.sort((a, b) => b.age - b.limit - (a.age - a.limit))
lines.push(`## 確認日が古いレッスン(${stale.length} 件)`, '')
if (stale.length === 0) lines.push('なし。', '')
for (const s of stale) {
  problems++
  lines.push(`- **${s.id}**: 確認日 ${s.checkedAt}(${s.age} 日前。基準は ${s.limit} 日、根拠の種類は ${s.kind}${s.kind === 'law' ? '。**公開を止める基準を超えています**' : ''})`)
  for (const u of s.urls) lines.push(`  - ${u}`)
}
if (stale.length) lines.push('', '再確認したら、`src/data/lesson-sources.json` の checkedAt を、実際に確認した日に更新する(読んでいない資料の確認日は、更新しない)。', '')

// ---- 2. 外部リンク ----
if (withLinks) {
  const urls = new Map() // url -> そのリンクを使うレッスン
  for (const [id, e] of Object.entries(sources)) for (const s of e.sources ?? []) if (s.url?.startsWith('https://')) urls.set(s.url, [...(urls.get(s.url) ?? []), id])
  const results = await checkLinks(urls.keys())
  const broken = results.filter((r) => r.kind === 'broken')
  const unv = results.filter((r) => r.kind === 'unverifiable')
  lines.push(`## 外部リンク(${results.length} 件を確認)`, '', `- 切れている: ${broken.length} 件`, `- 確認できない(ボットを拒む、時間切れなど。手元で開いて確かめる): ${unv.length} 件`, '')
  for (const r of broken) { problems++; lines.push(`- **切れ(${r.note})** ${r.url} … ${urls.get(r.url).join(', ')}`) }
  if (unv.length) lines.push('', '<details><summary>確認できなかったリンク</summary>', '')
  for (const r of unv) lines.push(`- ${r.url}(${r.note ?? '不明'}) … ${urls.get(r.url).join(', ')}`)
  if (unv.length) lines.push('', '</details>')
  lines.push('')
}

const body = [`# 鮮度の点検(${now.toISOString().slice(0, 10)})`, '', ...lines].join('\n')
const report = (problems > 0 ? '<!-- has-issues -->\n' : '') + body + '\n'
console.log(body)
console.log(problems > 0 ? `\n要対応: ${problems} 件` : '\n要対応なし')
if (out) writeFileSync(out, report)
