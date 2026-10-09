import { useMemo, useState } from 'react'
import type { LessonContent } from './types'

type Merge = { pair: [string, string]; count: number }

function mergeOnce(words: string[][]): { words: string[][]; merge: Merge } | null {
  const counts = new Map<string, number>()
  for (const w of words) {
    for (let i = 0; i < w.length - 1; i++) {
      const k = w[i] + '\u0000' + w[i + 1]
      counts.set(k, (counts.get(k) ?? 0) + 1)
    }
  }
  let best: string | null = null
  let bestCount = 1 // 1回しか出ないペアは結合しない
  for (const [k, c] of counts) {
    if (c > bestCount) {
      best = k
      bestCount = c
    }
  }
  if (!best) return null
  const [a, b] = best.split('\u0000')
  const next = words.map((w) => {
    const out: string[] = []
    for (let i = 0; i < w.length; i++) {
      if (w[i] === a && w[i + 1] === b) {
        out.push(a + b)
        i++
      } else out.push(w[i])
    }
    return out
  })
  return { words: next, merge: { pair: [a, b], count: bestCount } }
}

function BpeDemo() {
  const [text, setText] = useState('low lower lowest newer wider newest')
  const [steps, setSteps] = useState(0)

  const { words, merges } = useMemo(() => {
    let words = text.split(/\s+/).filter(Boolean).map((w) => [...w])
    const merges: Merge[] = []
    for (let i = 0; i < steps; i++) {
      const r = mergeOnce(words)
      if (!r) break
      words = r.words
      merges.push(r.merge)
    }
    return { words, merges }
  }, [text, steps])

  const canStep = merges.length === steps && mergeOnce(words) !== null
  const vocab = [...new Set(words.flat())]

  return (
    <div className="demo">
      <h4>デモ:BPEで頻出ペアを結合していく</h4>
      <input
        className="text-input"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setSteps(0)
        }}
        aria-label="入力テキスト(スペース区切りの英単語)"
      />
      <div className="row">
        <button onClick={() => setSteps(steps + 1)} disabled={!canStep}>
          結合を1回実行
        </button>
        <button className="secondary" onClick={() => setSteps(0)} disabled={steps === 0}>
          リセット
        </button>
        <span className="muted">結合回数: {merges.length}</span>
      </div>
      <div className="token-rows">
        {words.map((w, i) => (
          <div key={i} className="token-row">
            {w.map((t, j) => (
              <span key={j} className={'token' + (t.length > 1 ? ' merged' : '')}>
                {t}
              </span>
            ))}
          </div>
        ))}
      </div>
      {merges.length > 0 && (
        <p className="muted">
          直近の結合:「{merges[merges.length - 1].pair.join('」+「')}」→「
          {merges[merges.length - 1].pair.join('')}」(出現 {merges[merges.length - 1].count} 回)
        </p>
      )}
      <p className="muted">語彙サイズ: {vocab.length}</p>
      {!canStep && merges.length === steps && <p className="muted">これ以上、2回以上現れるペアはありません。</p>}
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>モデルは文字列を直接読めない</h3>
      <p>
        ニューラルネットワークが扱えるのは数値だけです。そこでLLMは入力テキストを
        <strong>トークン</strong>という小さな単位に分割し、各トークンを語彙表の<strong>整数ID</strong>
        に置き換えてから処理します。この変換を担う部品が<strong>トークナイザ</strong>です。
      </p>
      <pre>{`"unbelievable" → ["un", "believ", "able"] → [403, 12871, 540]`}</pre>
      <p className="muted">この分割とIDは、流れを示すための例です。実際のトークナイザの出力ではありません。</p>

      <h3>分割の粒度のトレードオフ</h3>
      <ul>
        <li><strong>文字単位</strong>:語彙は小さいが、系列が長くなり、1トークンあたりの情報が少ない。</li>
        <li><strong>単語単位</strong>:系列は短いが、語彙が膨大になり、未知語(辞書にない語)に対応できない。</li>
        <li><strong>サブワード単位</strong>:両者の中間。頻出語は1トークン、まれな語は部品に分解する。現在のLLMはほぼこれ。</li>
      </ul>

      <h3>BPE(Byte Pair Encoding)</h3>
      <p>サブワードの語彙を作る代表的な方法です。手順は単純です。</p>
      <ol>
        <li>全テキストを1文字ずつに分割した状態から始める。</li>
        <li>隣り合うトークンのペアを数え、最も頻出するペアを1つの新しいトークンとして結合する。</li>
        <li>語彙が目標サイズになるまで2を繰り返す。</li>
      </ol>
      <p>結合の順序を記録しておけば、新しいテキストにも同じ順で結合を適用して分割できます。</p>

      <BpeDemo />

      <h3>実際のトークナイザの注意点</h3>
      <ul>
        <li>バイト単位(byte-level BPE や byte fallback)の仕組みを持つものが多く、どんな文字列でも必ず分割できる。</li>
        <li>日本語など英語以外では、同じ内容でもトークン数が多くなりがち。コストや文脈長に直接効く。</li>
        <li>数字や綴りの扱いが不得意になる原因の一部は、トークン化で文字の単位が見えなくなることにある。</li>
      </ul>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'LLMがテキストをトークンのID列に変換する主な理由はどれですか?',
      choices: [
        'ネットワークが数値しか扱えないため',
        'テキストを暗号化するため',
        'ファイルサイズを必ず小さくするため',
      ],
      answer: 0,
      explanation: 'ニューラルネットワークの計算は数値演算なので、文字列を数値(ID)に変換する必要があります。',
    },
    {
      question: 'BPEで新しいトークンとして結合されるのはどのペアですか?',
      choices: [
        'ランダムに選んだペア',
        '最も長いペア',
        '隣り合う出現回数が最も多いペア',
      ],
      answer: 2,
      explanation: '頻出するペアほど1つにまとめる効果が大きいため、最頻ペアから順に結合します。',
    },
    {
      question: '単語単位のトークン化に比べたサブワード単位の利点はどれですか?',
      choices: [
        '語彙表が不要になる',
        '未知語も既知の部品に分解して表現できる',
        '常に系列が最短になる',
      ],
      answer: 1,
      explanation: 'まれな語や新語も、より小さな部品(最悪でも文字やバイト)の列として表現できます。',
    },
  ],
}

export default content
