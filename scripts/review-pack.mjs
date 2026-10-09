// 確認の材料の自動生成: 講座(または段階)ごとに、公開前にあなたが見る材料を、1つの Markdown にまとめる。
//   node scripts/review-pack.mjs <講座の id> [--tier basic|practice|advanced] [--checks] [--links] [--out ファイル]
//   例: npm run review -- evidence --checks
// 機械で分かることだけを載せる。主張を出典と突き合わせる作業は、verify-lesson が行い、その結果(docs/verify/<レッスン ID>.md)を取り込む。
//   --checks      型・ビルド・全テスト・まっさらな環境でのビルドを実行して、結果を載せる(数分かかる)
//   --links       出典の外部リンクを確認する(ネットワークが要る)
//   --verify-dir  verify-lesson の結果を探す場所(既定: docs/verify)
//   --now 日付     古さの判定の基準日(試験用)
import { spawnSync, execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { courses, evidenceInfo, levelLabel, priorityOf, statusLabel, courseStatus } from '../src/data/catalog.ts'
import { stages } from '../src/data/curriculum.ts'
import { ageDays, lawLessonErrors, maxAgeDays } from '../src/data/gates.ts'
import { checkLinks } from './lib/links.mjs'
import { readLessonFiles } from './lib/lessons.mjs'

const args = process.argv.slice(2)
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined)
const courseId = args.find((a) => !a.startsWith('--') && a !== opt('--tier') && a !== opt('--out') && a !== opt('--verify-dir') && a !== opt('--now'))
const course = courses.find((c) => c.id === courseId)
if (!course) {
  console.error(`使い方: node scripts/review-pack.mjs <講座の id> [--tier basic|practice|advanced] [--checks] [--links] [--out ファイル]\n講座の id: ${courses.map((c) => c.id).join(', ')}`)
  process.exit(1)
}
const tierFilter = opt('--tier')
const verifyDir = opt('--verify-dir') ?? 'docs/verify'
const now = opt('--now') ? new Date(opt('--now')) : new Date()
const today = now.toISOString().slice(0, 10)

const sources = JSON.parse(readFileSync('src/data/lesson-sources.json', 'utf8'))
const history = JSON.parse(readFileSync('src/data/lesson-history.json', 'utf8'))
const stats = existsSync('src/data/lesson-stats.json') ? JSON.parse(readFileSync('src/data/lesson-stats.json', 'utf8')) : {}
const loaders = readLessonFiles() // レッスン ID → 本文のファイル

const statusText = { verified: '原典・公式で確認', partial: '一部を確認', original: 'このアプリ独自の整理', unverified: '未確認' }
const kindText = { read: '原文を読んだ', search: '検索で確認', skill: 'スキル', repo: 'リポジトリ', calc: '計算' }
// 注記に、これらの語を含む文は、読者に伝えるべき「限界」の可能性が高い(機械の目印。判断は人が行う)
const limitWords = ['要旨', '未読', '第三者', '取得できな', '遮断', '確認していない', '確認できていない', '未確認', '写し', '検索結果', '本文は', '全文は']

const tiers = course.tiers.filter((t) => !tierFilter || t.level === tierFilter)
const stageList = tiers.flatMap((t) => (t.stageIds ?? []).map((id) => stages.find((s) => s.id === id)).filter(Boolean))
const lessons = stageList.flatMap((s) => s.lessons.filter((l) => loaders.has(l.id)).map((l) => ({ ...l, stage: s })))

const git = (...a) => { try { return execFileSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() } catch { return '' } }
const red = []
const yellow = []
const sections = []
const evidence = evidenceInfo[course.evidence]
const isLaw = course.evidence === 'law'

// ---- 各レッスン ----
for (const l of lessons) {
  const e = sources[l.id]
  const h = history[l.id]
  const st = stats[l.id]
  const file = loaders.get(l.id)
  const lessonDate = git('log', '-1', '--format=%cs', '--', file) || today
  const out = [`### ${l.label ?? l.id} ${l.title}`, '']
  if (!e) {
    red.push(`${l.id}: 出典の記録がありません`)
    out.push('- 出典の記録: **なし**', '')
  } else {
    const age = e.checkedAt ? ageDays(e.checkedAt, now) : undefined
    out.push(`- 確認の状況: **${statusText[e.status] ?? e.status}**${e.checkedAt ? `(確認日 ${e.checkedAt}、${age} 日前)` : ''}`)
    if (e.status === 'unverified') red.push(`${l.id}: 未確認です`)
    if (e.status === 'partial') yellow.push(`${l.id}: 一部だけ確認(記録の注記を読む)`)
    if (e.status === 'original') yellow.push(`${l.id}: このアプリ独自の整理(外部の根拠がない)`)
    if (age !== undefined && age > maxAgeDays[course.evidence]) yellow.push(`${l.id}: 確認日が ${maxAgeDays[course.evidence]} 日をこえています`)
    if (st) out.push(`- 分量: 本文 ${st.chars} 字、デモ ${st.demos}、クイズ ${st.questions} 問`)
    if (h) out.push(`- 履歴: 作成 ${h.created}、変更 ${h.commits?.length ?? 0} 回(最後: ${h.commits?.[0]?.date ?? '-'} ${h.commits?.[0]?.subject ?? ''})`)
    out.push('', '| 出典 | 確認の方法 | 使った箇所 |', '|---|---|---|')
    for (const s of e.sources ?? []) out.push(`| ${s.url ? `[${s.title}](${s.url})` : s.title} | ${kindText[s.how] ?? s.how} | ${s.use} |`)
    if (!(e.sources ?? []).length) out.push('| (なし) | | |')
    if (e.note) {
      out.push('', `記録の注記: ${e.note}`)
      const hits = e.note.split('。').filter((x) => limitWords.some((w) => x.includes(w)))
      if (hits.length) {
        yellow.push(`${l.id}: 注記に、限界を示す語がある(${hits.length} 文)`)
        out.push('', '**限界の可能性(注記から抽出)**', ...hits.map((x) => `- ${x}。`))
      }
    }
  }
  // 別の目の確認
  const vf = join(verifyDir, `${l.id}.md`)
  if (existsSync(vf)) {
    const text = readFileSync(vf, 'utf8')
    const vdate = text.split('\n')[0].match(/\d{4}-\d{2}-\d{2}/)?.[0]
    const stale = vdate && vdate < lessonDate
    out.push('', `- 別の目の確認: **実施済み**(${vdate ?? '日付なし'})${stale ? ` — ⚠ 本文は、そのあとに変更されています(${lessonDate})。再確認が要ります` : ''}`)
    if (stale) yellow.push(`${l.id}: 別の目の確認のあとに、本文が変更されています`)
    out.push('', '<details><summary>確認の結果(主張 → 出典)</summary>', '', text.trim(), '', '</details>')
  } else {
    out.push('', '- 別の目の確認: **未実施**(`verify-lesson`)')
    yellow.push(`${l.id}: 別の目の確認が未実施です`)
  }
  // 法令・基準のゲート
  if (isLaw) {
    const errs = lawLessonErrors(e, now)
    out.push('', errs.length ? `- 🔴 法令・基準のゲート: 通りません(${errs.join(' / ')})` : '- 法令・基準のゲート: 通過')
    for (const x of errs) red.push(`${l.id}: 法令・基準のゲート — ${x}`)
  }
  sections.push(out.join('\n'))
}

// ---- 外部リンク ----
let linkText = '未実行(`--links` で確認する)'
if (args.includes('--links')) {
  const urls = new Map()
  for (const l of lessons) for (const s of sources[l.id]?.sources ?? []) if (s.url?.startsWith('https://')) urls.set(s.url, [...(urls.get(s.url) ?? []), l.id])
  const results = await checkLinks(urls.keys())
  const broken = results.filter((r) => r.kind === 'broken')
  const unv = results.filter((r) => r.kind === 'unverifiable')
  for (const r of broken) red.push(`リンク切れ: ${r.url}(${urls.get(r.url).join(', ')})`)
  if (unv.length) yellow.push(`確認できない外部リンクが ${unv.length} 件(ボットを拒む可能性。手元で開く)`)
  linkText = [`${results.length} 件を確認: 切れ ${broken.length} 件、確認できない ${unv.length} 件`, ...broken.map((r) => `- **切れ** ${r.url}`), ...unv.map((r) => `- 確認できない(${r.note ?? '不明'}) ${r.url}`)].join('\n')
}

// ---- 検査 ----
let checksText = '未実行(`--checks` で、型・ビルド・全テスト・まっさらな環境でのビルドを実行する)'
if (args.includes('--checks')) {
  const rows = []
  const run = (name, cmd, cwd = '.', env = {}) => {
    const r = spawnSync(cmd, { shell: true, cwd, encoding: 'utf8', env: { ...process.env, ...env }, maxBuffer: 1 << 28 })
    const ok = r.status === 0
    rows.push({ name, ok, r })
    if (!ok) red.push(`検査に失敗: ${name}`)
    return r
  }
  run('型(tsc)', 'npx tsc --noEmit')
  run('型(e2e)', 'npm run typecheck:e2e')
  run('ビルド(出典の検査を含む)', 'npm run build')
  const jsonOut = join(mkdtempSync(join(tmpdir(), 'pack-')), 'pw.json')
  const pw = run('全テスト(Playwright)', 'npx playwright test --reporter=json', '.', { PLAYWRIGHT_JSON_OUTPUT_NAME: jsonOut })
  let counts = ''
  try { const j = JSON.parse(readFileSync(jsonOut, 'utf8')); counts = `${j.stats.expected} 件が通過、${j.stats.unexpected} 件が失敗、${j.stats.skipped} 件がスキップ` } catch { counts = '件数を読めませんでした' }
  // まっさらな環境でのビルド
  const dir = mkdtempSync(join(tmpdir(), 'clean-'))
  try {
    for (const f of execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean)) {
      mkdirSync(dirname(join(dir, f)), { recursive: true })
      cpSync(f, join(dir, f))
    }
    run('まっさらな環境での npm ci と、ビルド', 'npm ci > /dev/null 2>&1 && npm run build', dir)
  } finally { rmSync(dir, { recursive: true, force: true }) }
  checksText = ['| 検査 | 結果 |', '|---|---|', ...rows.map((x) => `| ${x.name} | ${x.ok ? '通過' : '**失敗**'}${x.name.startsWith('全テスト') ? `(${counts})` : ''} |`)].join('\n')
}

// ---- 組み立て ----
const prereq = (course.requires ?? []).map((id) => { const c = courses.find((x) => x.id === id); return `- ${c?.title}: ${course.needs?.[id] ?? ''}` })
const plan = priorityOf(course)
const head = [
  `# 確認の材料: ${course.title}${tierFilter ? `(${levelLabel[tierFilter]})` : ''}`,
  '',
  `生成日 ${today}。機械で分かることだけをまとめています。主張と出典の突き合わせは、各レッスンの「別の目の確認」を読んでください。`,
  '',
  '## 0. 判定の要約',
  '',
  `- 🔴 公開を止める理由: **${red.length} 件**`,
  ...red.map((x) => `  - ${x}`),
  `- 🟡 確認してほしい点: **${yellow.length} 件**`,
  ...yellow.map((x) => `  - ${x}`),
  red.length === 0 && yellow.length === 0 ? '- 🟢 機械が見つけた問題は、ありません。' : '',
  '',
  isLaw
    ? '**この講座は、高リスクの分野(法令・基準)です。公開前に、あなたが全レッスンを確認してください。**'
    : '高リスクの分野ではありません。上の 🔴 がなく、🟡 を確認して問題なければ、公開の判断ができます(方針の変更があれば、そこはあなたの確認が要ります)。',
  '',
  '## 1. 設計の要点',
  '',
  `- 講座: ${course.title}(${statusLabel[courseStatus(course)]}${plan ? `、執筆の優先度: ${plan.title}` : ''})`,
  `- 根拠の種類: ${evidence.label} — ${evidence.basis}。${evidence.note}`,
  `- なぜ学ぶのか: ${course.why}`,
  ...(prereq.length ? ['- 先に学ぶとよい講座:', ...prereq] : ['- 先に学ぶとよい講座: なし']),
  ...tiers.flatMap((t) => [
    `- ${levelLabel[t.level]}(${t.scope}): ${(t.stageIds ?? []).map((id) => stages.find((s) => s.id === id)?.title).join('、') || '(本文なし)'}${t.planned?.length ? ` / 準備中: ${t.planned.join('、')}` : ''}`,
  ]),
  '',
  `## 2. レッスンごと(${lessons.length} 本)`,
  '',
  lessons.length ? sections.join('\n\n') : '公開済みのレッスンは、ありません。',
  '',
  '## 3. 外部リンク',
  '',
  linkText,
  '',
  '## 4. 検査の結果',
  '',
  checksText,
  '',
].join('\n')

const outPath = opt('--out') ?? `reviews/${course.id}${tierFilter ? `-${tierFilter}` : ''}-${today}.md`
mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, head)
console.log(`書き出しました: ${outPath}\n🔴 ${red.length} 件 / 🟡 ${yellow.length} 件`)
