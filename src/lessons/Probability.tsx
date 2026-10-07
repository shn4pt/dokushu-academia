import { useState } from 'react'
import { Slider } from '../components'
import { Tex } from '../Tex'
import type { LessonContent } from './types'

const outcomes = [
  { name: 'A', value: 1 },
  { name: 'B', value: 2 },
  { name: 'C', value: 3 },
]

function SamplingDemo() {
  const [weights, setWeights] = useState([5, 3, 2])
  const [counts, setCounts] = useState([0, 0, 0])
  const sum = weights.reduce((a, b) => a + b, 0)
  const probs = weights.map((w) => (sum === 0 ? 1 / weights.length : w / sum))
  const n = counts.reduce((a, b) => a + b, 0)
  const expected = probs.reduce((s, p, i) => s + p * outcomes[i].value, 0)
  const empirical = n === 0 ? 0 : counts.reduce((s, c, i) => s + c * outcomes[i].value, 0) / n

  function draw(times: number) {
    const next = [...counts]
    for (let t = 0; t < times; t++) {
      let r = Math.random()
      let k = 0
      for (; k < probs.length - 1; k++) {
        r -= probs[k]
        if (r < 0) break
      }
      next[k]++
    }
    setCounts(next)
  }

  return (
    <div className="demo">
      <h4>デモ:確率分布からのサンプリング</h4>
      <p className="muted">A・B・C の出やすさを決めて、サンプルを引いてみましょう。値は A=1、B=2、C=3 とします。</p>
      {outcomes.map((o, i) => (
        <Slider
          key={o.name}
          label={`${o.name} の重み`}
          value={weights[i]}
          min={0}
          max={10}
          step={1}
          onChange={(v) => {
            setWeights(weights.map((w, k) => (k === i ? v : w)))
            setCounts([0, 0, 0])
          }}
        />
      ))}
      <div className="row">
        <button onClick={() => draw(10)}>10回引く</button>
        <button onClick={() => draw(1000)}>1000回引く</button>
        <button className="secondary" onClick={() => setCounts([0, 0, 0])}>リセット</button>
        <span className="muted">試行回数: {n}</span>
      </div>
      {outcomes.map((o, i) => (
        <div key={o.name} className="attn-row sim-row">
          <span className="attn-token">{o.name}</span>
          <div className="bar-track" aria-hidden>
            <div className="bar-fill" style={{ width: `${(n === 0 ? 0 : counts[i] / n) * 100}%` }} />
          </div>
          <span className="attn-weight">{n === 0 ? '-' : ((counts[i] / n) * 100).toFixed(1)}%</span>
          <span className="muted" style={{ gridColumn: '1 / -1' }}>理論値 {(probs[i] * 100).toFixed(1)}%</span>
        </div>
      ))}
      <p>期待値(理論): <strong>{expected.toFixed(2)}</strong> / 標本平均: <strong>{n === 0 ? '-' : empirical.toFixed(2)}</strong></p>
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>確率分布</h3>
      <p>
        取りうる結果それぞれに確率を割り当てたものが<strong>確率分布</strong>です。各確率は0以上で、合計は1になります。
        LLMの出力は、まさに「語彙のトークンすべてに対する確率分布」です。
      </p>
      <Tex block tex={String.raw`P(x)\ge 0,\qquad \sum_x P(x)=1`} />

      <h3>条件付き確率</h3>
      <p>
        「ある条件が成り立ったときの確率」が条件付き確率です。<Tex tex={String.raw`P(B\mid A)`} /> は「A が起きた上で B が起きる確率」です。
      </p>
      <Tex block tex={String.raw`P(B\mid A)=\frac{P(A,B)}{P(A)}`} />
      <p>
        言語モデルは <Tex tex={String.raw`P(\text{次のトークン}\mid\text{ここまでの文脈})`} /> を計算するモデルです。たとえば
        「今日は天気が」の次に「いい」が来る確率は、「今日は天気が」という条件のもとでの確率です。
      </p>

      <h3>連鎖律(確率の積)</h3>
      <p>同時確率は、条件付き確率の積に分解できます。</p>
      <Tex block tex={String.raw`P(A,B)=P(A)\,P(B\mid A)`} />
      <p>これを繰り返すと、文全体の確率を「各位置の次トークン確率」の積として書けます(Stage 3 で使います)。</p>

      <h3>期待値</h3>
      <p>確率で重み付けした平均が期待値です。サンプルを大量に引くと、標本平均は期待値に近づきます(大数の法則)。</p>
      <Tex block tex={String.raw`\mathbb{E}[X]=\sum_x P(x)\,x`} />

      <SamplingDemo />

      <h3>プログラマ向けの見方</h3>
      <pre>{`import random
tokens = ["いい", "悪い", "晴れ"]
probs  = [0.6, 0.1, 0.3]
random.choices(tokens, weights=probs, k=1)   # 確率に従って1つ選ぶ`}</pre>
      <p>LLMの文章生成は、このサンプリングを1トークンずつ繰り返しているだけです。</p>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: '確率分布について正しいものはどれですか?',
      choices: [
        '各確率は負の値も取れる',
        '各確率は0以上で、合計が1になる',
        '各確率は必ず等しい',
      ],
      answer: 1,
      explanation: '確率は0以上で、すべての結果の確率を足すと1になります。',
    },
    {
      question: '言語モデルが計算する P(次のトークン | 文脈) は何ですか?',
      choices: ['同時確率', '条件付き確率', '期待値'],
      answer: 1,
      explanation: '「ここまでの文脈」という条件のもとでの、次のトークンの確率です。',
    },
    {
      question: '値が 1 (確率0.5)、3 (確率0.5) の変数の期待値はいくつですか?',
      choices: ['1', '2', '3'],
      answer: 1,
      explanation: '0.5×1 + 0.5×3 = 2 です。',
    },
  ],
}

export default content
