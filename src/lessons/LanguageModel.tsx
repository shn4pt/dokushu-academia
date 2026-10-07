import { useMemo, useState } from 'react'
import { Tex } from '../Tex'
import type { LessonContent } from './types'

const corpus = [
  '猫 が 魚 を 食べた 。',
  '猫 が 鳥 を 見た 。',
  '犬 が 魚 を 見た 。',
  '犬 が 猫 を 追った 。',
  '魚 が 泳いだ 。',
]

// 直前の1トークンだけを文脈にする最小の言語モデル(bigram)
function buildModel() {
  const counts = new Map<string, Map<string, number>>()
  for (const line of corpus) {
    const toks = line.split(' ')
    for (let i = 0; i < toks.length - 1; i++) {
      const m = counts.get(toks[i]) ?? new Map<string, number>()
      m.set(toks[i + 1], (m.get(toks[i + 1]) ?? 0) + 1)
      counts.set(toks[i], m)
    }
  }
  return counts
}

function BigramDemo() {
  const model = useMemo(buildModel, [])
  const [seq, setSeq] = useState<string[]>(['猫'])
  const last = seq[seq.length - 1]
  const nexts = model.get(last)
  const total = nexts ? [...nexts.values()].reduce((a, b) => a + b, 0) : 0
  const dist = nexts ? [...nexts].map(([t, c]) => ({ t, p: c / total })).sort((a, b) => b.p - a.p) : []

  function sample() {
    let r = Math.random()
    for (const { t, p } of dist) {
      r -= p
      if (r <= 0) return setSeq([...seq, t])
    }
    setSeq([...seq, dist[dist.length - 1].t])
  }

  return (
    <div className="demo">
      <h4>デモ:ミニ言語モデルで文を生成する</h4>
      <details>
        <summary>学習データ(5文)</summary>
        <ul>{corpus.map((c) => <li key={c}>{c}</li>)}</ul>
      </details>
      <p className="muted">このモデルは「直前の1トークン」だけを見て、次に来るトークンの確率を数え上げで求めています。</p>
      <div className="row">
        <span>開始:</span>
        {['猫', '犬', '魚'].map((s) => (
          <button key={s} className="secondary" onClick={() => setSeq([s])}>{s}</button>
        ))}
      </div>
      <div className="token-row">
        {seq.map((t, i) => <span key={i} className="token merged">{t}</span>)}
      </div>
      {dist.length > 0 ? (
        <>
          <p>「<strong>{last}</strong>」の次のトークンの確率分布:</p>
          {dist.map(({ t, p }) => (
            <div key={t} className="attn-row sim-row">
              <button className="secondary" onClick={() => setSeq([...seq, t])}>{t}</button>
              <div className="bar-track" aria-hidden><div className="bar-fill" style={{ width: `${p * 100}%` }} /></div>
              <span className="attn-weight">{(p * 100).toFixed(0)}%</span>
            </div>
          ))}
          <div className="row">
            <button onClick={sample}>確率に従って1つ選ぶ</button>
            <button className="secondary" onClick={() => setSeq([seq[0]])}>やり直す</button>
          </div>
        </>
      ) : (
        <p className="muted">この先の候補はありません(文の終わり)。</p>
      )}
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>言語モデル = 次のトークンの確率分布</h3>
      <p>
        言語モデルとは、ここまでのトークン列を受け取り、<strong>次に来るトークンの確率分布</strong>を返すモデルです。
        語彙のすべてのトークンに確率を割り当て、合計は1になります。
      </p>
      <Tex block tex={String.raw`P(x_t \mid x_1, \dots, x_{t-1})`} />

      <h3>文全体の確率は積に分解できる</h3>
      <p>確率の連鎖律により、文全体の確率は「次トークン確率」の積になります。</p>
      <Tex block tex={String.raw`P(x_1,\dots,x_T)=\prod_{t=1}^{T} P(x_t \mid x_{<t})`} />
      <p>
        そのため、次トークンを予測するモデルが1つあれば、文章の生成も評価もできます。
        生成は「分布から1つ選んで末尾に足す」を繰り返すだけです。
      </p>

      <BigramDemo />

      <h3>LLMとの違い</h3>
      <ul>
        <li>デモのモデルは直前の1トークンしか見ず、確率は<strong>数え上げ</strong>で求めています。</li>
        <li>LLMは、長い文脈全体を見て(Transformer)、確率を<strong>ニューラルネットで計算</strong>します。文脈が長くても、未見の組み合わせにも対応できます。</li>
        <li>それでも「次トークンの確率分布を出して、1つ選んで足す」という骨格は同じです。</li>
      </ul>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: '言語モデルが出力するものはどれですか?',
      choices: ['次のトークンの確率分布', '文章の正誤の判定', '入力文の要約'],
      answer: 0,
      explanation: '語彙のすべてのトークンについて、次に来る確率を出力します。',
    },
    {
      question: '文全体の確率はどのように表せますか?',
      choices: [
        '各トークンの確率の和',
        '各位置の「それまでの文脈で条件づけた次トークン確率」の積',
        '最初のトークンの確率のみ',
      ],
      answer: 1,
      explanation: '確率の連鎖律により、条件付き確率の積に分解できます。',
    },
    {
      question: 'デモのbigramモデルとLLMの大きな違いはどれですか?',
      choices: [
        'LLMは次のトークンを予測しない',
        'bigramは確率を出力しない',
        'LLMは長い文脈全体を見て、ニューラルネットで確率を計算する',
      ],
      answer: 2,
      explanation: 'どちらも次トークン確率を出しますが、見る文脈の長さと確率の求め方が異なります。',
    },
  ],
}

export default content
