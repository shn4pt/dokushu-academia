import { useState } from 'react'
import { Tex } from '../Tex'
import type { LessonContent } from './types'

const tokens = ['猫', 'が', '魚', 'を', '食べた']

function softmax(xs: number[]) {
  const m = Math.max(...xs)
  const e = xs.map((x) => Math.exp(x - m))
  const s = e.reduce((a, b) => a + b, 0)
  return e.map((v) => v / s)
}

function SoftmaxDemo() {
  const [scores, setScores] = useState([2, -1, 1, -2, 3])
  const weights = softmax(scores)

  return (
    <div className="demo">
      <h4>デモ:スコアからattention重みへ</h4>
      <p className="muted">
        「食べた」が各トークンをどれだけ参照するかを表すスコア(QとKの内積)を動かしてみてください。
      </p>
      {tokens.map((t, i) => (
        <div key={i} className="attn-row">
          <span className="attn-token">{t}</span>
          <input
            type="range"
            min={-4}
            max={4}
            step={0.5}
            value={scores[i]}
            onChange={(e) => setScores(scores.map((s, j) => (j === i ? Number(e.target.value) : s)))}
            aria-label={`${t} のスコア`}
          />
          <span className="attn-score">{scores[i].toFixed(1)}</span>
          <div className="bar-track" aria-hidden>
            <div className="bar-fill" style={{ width: `${weights[i] * 100}%` }} />
          </div>
          <span className="attn-weight">{(weights[i] * 100).toFixed(1)}%</span>
        </div>
      ))}
      <p className="muted">重みの合計は常に100%になります。スコアが大きいトークンに重みが集中します。</p>
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>考え方:文脈から必要な情報を取り出す</h3>
      <p>
        Self-Attentionは、系列中の各トークンが「他のどのトークンから、どれだけ情報を受け取るか」を
        その場で計算する仕組みです。たとえば「食べた」の意味を決めるには、「猫」や「魚」を強く参照したいはずです。
      </p>

      <h3>Query・Key・Value</h3>
      <p>各トークンのベクトル <code>x</code> から、3つの異なる線形変換で3種類のベクトルを作ります。</p>
      <ul>
        <li><strong>Query(Q)</strong>:「自分は何を探しているか」</li>
        <li><strong>Key(K)</strong>:「自分はどんな情報を持っているか」(検索される側の見出し)</li>
        <li><strong>Value(V)</strong>:「実際に渡す中身」</li>
      </ul>
      <Tex block tex={String.raw`Q = XW_Q,\quad K = XW_K,\quad V = XW_V`} />

      <h3>計算の流れ</h3>
      <ol>
        <li>QとKの内積でスコアを作る。似ているほど大きい。</li>
        <li>次元数 <code>d</code> の平方根で割る(値が大きくなりすぎてsoftmaxが極端になるのを防ぐ)。</li>
        <li>softmaxで合計1の重みに変換する。</li>
        <li>その重みでVを足し合わせる。これが出力。</li>
      </ol>
      <Tex block tex={String.raw`\mathrm{Attention}(Q,K,V)=\mathrm{softmax}\!\left(\frac{QK^{\top}}{\sqrt{d}}\right)V`} />

      <SoftmaxDemo />

      <h3>GPT系で重要な点:因果マスク</h3>
      <p>
        次トークン予測のモデルでは、未来のトークンを見てはいけません。そこで、各位置より後ろのスコアを
        softmaxの前に <Tex tex={String.raw`-\infty`} /> にして重みを0にします。これを因果マスク(causal mask)と呼びます。
      </p>

      <h3>計算量</h3>
      <p>
        すべてのトークンの組でスコアを計算するため、系列長 <code>n</code> に対して計算量・メモリは
        <code>n²</code> で増えます。長い文脈が高コストになる根本的な理由です。
      </p>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'Self-Attentionの出力は何を足し合わせたものですか?',
      choices: [
        'Valueを、attention重みで重み付けした和',
        'Queryどうしの平均',
        'Keyの最大値',
      ],
      answer: 0,
      explanation: 'QとKから重みを作り、その重みで各トークンのValueを加重平均したものが出力です。',
    },
    {
      question: 'スコアを √d で割る主な目的はどれですか?',
      choices: [
        '計算を高速にするため',
        '内積が大きくなりすぎてsoftmaxが極端な分布になるのを防ぐため',
        '出力の次元数を減らすため',
      ],
      answer: 1,
      explanation: '次元が大きいほど内積の分散が大きくなるため、スケールを揃えて学習を安定させます。',
    },
    {
      question: 'GPTのような生成モデルで因果マスクを使う理由はどれですか?',
      choices: [
        'メモリ使用量を n² から n にするため',
        '短いトークンを無視するため',
        '予測時に未来のトークンを参照してしまわないようにするため',
      ],
      answer: 2,
      explanation: '次トークン予測では未来が未知なので、学習時にも未来を見えないようにして条件を揃えます。',
    },
  ],
}

export default content
