// 出典の記録(src/data/lesson-sources.json)を検査する。npm run build の前に自動で実行される。
//  - 記録の誤り(存在しないレッスン、確認済みなのに出典や確認日がない、など)と、記録のないレッスンは、ビルドを失敗させる。
//    レッスンを足したら、出典の記録も足す。まだ確認できていないなら、status を "unverified" と明記する(隠さない)。
//  - 明記された「未確認」と、確認日が古いこと(180日以上)は、警告にとどめる。
import { readFileSync } from 'node:fs'

const STALE_DAYS = 180
const STATUSES = ['verified', 'partial', 'original', 'unverified']
const HOWS = ['read', 'search', 'skill', 'repo', 'calc']
const PARTIAL_WORDS = ['要旨のみ', '要旨だけ', '本文は未読', '未読', '原文は未取得', '見出しのみ']

const ids = [...readFileSync('src/lessons/index.ts', 'utf8').matchAll(/'([0-9a-z-]+)': \(\) => import\(/g)].map((m) => m[1])
const sources = JSON.parse(readFileSync('src/data/lesson-sources.json', 'utf8'))
const history = JSON.parse(readFileSync('src/data/lesson-history.json', 'utf8'))
const errors = []
const warnings = []
const today = Date.now()

for (const id of Object.keys(sources)) if (!ids.includes(id)) errors.push(`${id}: 存在しないレッスンの記録があります`)
for (const id of Object.keys(history)) if (!ids.includes(id)) errors.push(`${id}: 存在しないレッスンの変更履歴があります`)

const count = Object.fromEntries(STATUSES.map((s) => [s, 0]))
for (const id of ids) {
  const e = sources[id]
  if (!e) { errors.push(`${id}: 出典の記録がありません(src/data/lesson-sources.json に追加してください。まだ確認できていなければ status を "unverified" にします)`); count.unverified++; continue }
  if (!STATUSES.includes(e.status)) { errors.push(`${id}: status が不正です(${e.status})`); continue }
  count[e.status]++
  if (e.status === 'unverified') warnings.push(`${id}: 未確認です`)
  if ((e.status === 'verified' || e.status === 'partial') && !(e.sources?.length > 0)) errors.push(`${id}: ${e.status} なのに出典がありません`)
  if ((e.status === 'verified' || e.status === 'partial') && !/^\d{4}-\d{2}-\d{2}$/.test(e.checkedAt ?? '')) errors.push(`${id}: ${e.status} なのに確認日(YYYY-MM-DD)がありません`)
  if (e.status === 'verified' && !e.sources.some((s) => s.how === 'read' || s.how === 'repo')) errors.push(`${id}: verified には、原文を読んで確認した出典(how: read か repo)が要ります`)
  for (const s of e.sources ?? []) {
    if (!s.title || !s.use) errors.push(`${id}: 出典に title と use が要ります`)
    if (!HOWS.includes(s.how)) errors.push(`${id}: 出典「${s.title}」の how が不正です(${s.how})`)
    if (s.url && !/^https:\/\//.test(s.url)) errors.push(`${id}: 出典「${s.title}」の url は https で始めてください`)
    if (s.how === 'read' && !s.url) errors.push(`${id}: 出典「${s.title}」は read ですが url がありません`)
    // 要旨や見出しだけを読んだ資料を、「原文を読んだ(read)」にしない(docs/production.md の原則1)
    if (s.how === 'read' && PARTIAL_WORDS.some((w) => s.use.includes(w))) errors.push(`${id}: 出典「${s.title}」は、使った箇所に「${PARTIAL_WORDS.find((w) => s.use.includes(w))}」とあるのに read です(原文を読んでいないなら search にする)`)
  }
  if (e.checkedAt) {
    const t = Date.parse(e.checkedAt)
    if (Number.isNaN(t)) errors.push(`${id}: 確認日が日付として読めません`)
    else if (t > today + 86400000) errors.push(`${id}: 確認日が未来の日付です`)
    else if ((today - t) / 86400000 > STALE_DAYS) warnings.push(`${id}: 確認日(${e.checkedAt})から ${STALE_DAYS} 日以上たっています。再確認してください`)
  }
}
for (const id of ids) if (!history[id]) warnings.push(`${id}: 変更履歴がありません(コミットしてから npm run history で更新できます)`)

console.log(`出典の記録: 原典で確認 ${count.verified} / 一部を確認 ${count.partial} / このアプリ独自の整理 ${count.original} / 未確認 ${count.unverified}(全 ${ids.length} レッスン)`)
if (warnings.length) console.log(`警告 ${warnings.length} 件:\n` + warnings.map((w) => '  - ' + w).join('\n'))
if (errors.length) { console.error(`エラー ${errors.length} 件:\n` + errors.map((w) => '  - ' + w).join('\n')); process.exit(1) }
