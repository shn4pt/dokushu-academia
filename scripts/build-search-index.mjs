// レッスン本文を描画してテキストを取り出し、検索用の索引(src/data/search-index.json)を作る。
// 復習用に、全レッスンのクイズをまとめた src/data/quiz-bank.json も作る。
// 学習時間の目安の算出に使う、レッスンごとの統計(src/data/lesson-stats.json)も作る。
// npm run dev / build の前に自動で実行される。
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { parse } from 'node-html-parser'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'

const OUT = 'src/data/search-index.json'
const QUIZ_OUT = 'src/data/quiz-bank.json'
const STATS_OUT = 'src/data/lesson-stats.json'
const clean = (s) => s.replace(/\s+/g, ' ').trim()

const GREEK = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', eta: 'η', theta: 'θ', lambda: 'λ', mu: 'μ',
  pi: 'π', sigma: 'σ', phi: 'φ', omega: 'ω', nabla: '∇', infty: '∞', times: '×', cdot: '·', leq: '≤', geq: '≥',
  approx: '≈', to: '→', leftarrow: '←', in: '∈', mid: '|',
}

/** 文中の短い数式を、検索・表示に使える簡易的な文字列にする(完全なTeX変換ではない)。 */
function texToText(tex) {
  return tex
    .replace(/\\(?:mathbf|mathrm|mathbb|text|vec|boldsymbol|hat)\{([^{}]*)\}/g, '$1')
    .replace(/\\([a-zA-Z]+)/g, (_, name) => GREEK[name] ?? '')
    .replace(/[{}\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractSections(html) {
  // 項目や段落の境目に空白を入れて、テキスト化したときに単語が連結しないようにする
  const spaced = html.replace(/<\/(li|td|th|p|h4|tr)>/g, '</$1> ')
  const root = parse(`<div>${spaced}</div>`).firstChild
  // 数式は描画用のマークアップが長く読みにくい。独立した数式は索引に含めず、文中の数式だけ簡易変換して残す
  for (const k of root.querySelectorAll('.katex')) {
    const inline = !k.parentNode?.classList?.contains('katex-display')
    k.replaceWith(inline ? ` ${texToText(k.querySelector('annotation')?.text ?? '')} ` : ' ')
  }
  const sections = []
  let cur = { h: '', parts: [] }
  const flush = () => {
    const t = clean(cur.parts.join(' '))
    if (t || cur.h) sections.push({ h: cur.h, t })
  }
  // Markdown 形式のレッスンは、本文が div.md に包まれている。見出しなどを、本文の直下の要素として扱う
  const nodes = root.childNodes.flatMap((n) => (n.nodeType === 1 && n.classList?.contains('md') ? n.childNodes : [n]))
  for (const el of nodes) {
    if (el.nodeType !== 1) continue
    if (el.tagName === 'H3') {
      flush()
      cur = { h: clean(el.text), parts: [] }
    } else if (el.classList?.contains('demo')) {
      // デモは、見出しと説明文だけを対象にする(値や操作部品は含めない)
      for (const n of el.querySelectorAll('h4, p')) cur.parts.push(n.text)
    } else {
      cur.parts.push(el.text)
    }
  }
  flush()
  return sections
}

/** 学習時間の目安の算出に使う、本文の統計。実際の時間の計算は src/time.ts で行う。 */
function extractStats(html, questions) {
  const root = parse(`<div>${html}</div>`).firstChild
  const formulas = root.querySelectorAll('.katex-display').length
  const demos = root.querySelectorAll('.demo')
  const demoCount = demos.length
  for (const d of demos) d.remove()
  let codeChars = 0
  let listingChars = 0 // ファイル全文の掲載(参照用)は、説明のためのコード例と分けて数える
  for (const pre of root.querySelectorAll('pre')) {
    if (pre.classList.contains('code-file')) listingChars += clean(pre.text).length
    else codeChars += clean(pre.text).length
    pre.remove()
  }
  for (const k of root.querySelectorAll('.katex')) k.remove()
  return { chars: clean(root.text).length, codeChars, listingChars, formulas, demos: demoCount, questions }
}

// レッスンの描画中に、これから生成するファイル(学習時間の統計など)を読み込むレッスンがある。
// まっさらな環境でも描画できるよう、まだ無ければ空の仮ファイルを置いておく(最後に本物で上書きする)。
mkdirSync('src/data', { recursive: true })
for (const [file, empty] of [[OUT, { version: 1, sections: [] }], [QUIZ_OUT, {}], [STATS_OUT, {}]]) {
  if (!existsSync(file)) writeFileSync(file, JSON.stringify(empty))
}

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
  optimizeDeps: { noDiscovery: true },
})
try {
  const lessons = await vite.ssrLoadModule('/src/lessons/index.ts')
  const sections = []
  const bank = {}
  const stats = {}
  for (const id of lessons.lessonIds) {
    const { Body, quiz } = await lessons.loadLessonContent(id)
    bank[id] = quiz
    // 本文がリンク(Link)を含むことがあるため、Router の中で描画する
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Body)))
    stats[id] = extractStats(html, quiz.length)
    for (const s of extractSections(html)) {
      sections.push({ id, ...s })
    }
  }
  mkdirSync('src/data', { recursive: true })
  writeFileSync(OUT, JSON.stringify({ version: 1, sections }))
  writeFileSync(QUIZ_OUT, JSON.stringify(bank))
  writeFileSync(STATS_OUT, JSON.stringify(stats))
  console.log(`search index: ${lessons.lessonIds.length} lessons, ${sections.length} sections; quiz bank: ${Object.values(bank).flat().length} questions`)
} finally {
  await vite.close()
}
