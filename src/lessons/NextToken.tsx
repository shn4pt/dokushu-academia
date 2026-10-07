import { useState } from 'react'
import { Slider } from '../components'
import { Tex } from '../Tex'
import type { LessonContent } from './types'

const positions = [
  { context: '今日は', correct: '天気' },
  { context: '今日は天気', correct: 'が' },
  { context: '今日は天気が', correct: 'いい' },
  { context: '今日は天気がいい', correct: '。' },
]
const VOCAB = 50000

function LossDemo() {
  const [ps, setPs] = useState([0.3, 0.6, 0.2, 0.7])
  const losses = ps.map((p) => -Math.log(p))
  const mean = losses.reduce((a, b) => a + b, 0) / losses.length

  return (
    <div className="demo">
      <h4>デモ:正解トークンの確率から損失とperplexityを出す</h4>
      <p className="muted">
        文「今日は天気がいい。」の各位置で、モデルが<strong>正解トークンに付けた確率</strong>を動かしてみましょう。
      </p>
      {positions.map((pos, i) => (
        <Slider
          key={i}
          label={`「${pos.context}」→「${pos.correct}」`}
          value={ps[i]}
          min={0.01}
          max={1}
          step={0.01}
          onChange={(v) => setPs(ps.map((q, k) => (k === i ? v : q)))}
          format={(v) => `P=${v.toFixed(2)}`}
        />
      ))}
      <table className="calc">
        <thead><tr><th>位置</th><th>損失 −ln P</th></tr></thead>
        <tbody>
          {losses.map((l, i) => <tr key={i}><td>{positions[i].correct}</td><td>{l.toFixed(3)}</td></tr>)}
        </tbody>
      </table>
      <p>
        平均損失 = <strong>{mean.toFixed(3)}</strong>、perplexity = e^損失 = <strong>{Math.exp(mean).toFixed(2)}</strong>
      </p>
      <p className="muted">
        参考:語彙 {VOCAB.toLocaleString()} 個に一様に確率を振る(でたらめな)モデルの損失は ln({VOCAB.toLocaleString()}) ≈ {Math.log(VOCAB).toFixed(2)}、
        perplexity は {VOCAB.toLocaleString()} です。
      </p>
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>事前学習の課題設定はたった1つ</h3>
      <p>
        LLMの事前学習は、<strong>次のトークンを当てる</strong>問題を大量のテキストで解くことです。
        ラベル付けは不要で、テキストそのものが「入力と正解」になります。
      </p>
      <pre>{`テキスト:   今日は 天気 が いい 。
入力 → 正解
 今日は            → 天気
 今日は 天気       → が
 今日は 天気 が    → いい
 今日は 天気 が いい → 。`}</pre>
      <p>
        4-2 で見た<strong>因果マスク</strong>のおかげで、1回の計算で文中のすべての位置の予測を同時に学習できます。
        各位置で「正解の前までの文脈」だけを見て、次のトークンを予測するからです。
        学習時は常に正解の文脈を入力する、この方式を<strong>Teacher Forcing</strong>と呼びます。
      </p>

      <h3>損失:正解への確率の負の対数</h3>
      <p>各位置で、語彙全体の確率分布のうち正解トークンの確率を取り出し、負の対数を取ります(交差エントロピー)。</p>
      <Tex block tex={String.raw`L=-\frac{1}{T}\sum_{t=1}^{T}\log P_\theta\!\left(x_t\mid x_{<t}\right)`} />
      <p>これを小さくする方向に、勾配降下法(と逆伝播)でパラメータを更新します。</p>

      <LossDemo />

      <h3>perplexity</h3>
      <p>
        平均損失を指数にしたものが<strong>perplexity</strong>(困惑度)です。「次のトークンを、平均して何個の候補から
        迷っているか」と解釈できます。小さいほど予測が当たっています。モデル間の比較に便利ですが、
        トークナイザが違うモデルどうしは単純には比べられません。
      </p>

      <h3>この単純な目的から何が生まれるか</h3>
      <p>
        次のトークンを正確に当てるには、文法や事実、論理、文脈の理解がある程度必要です。大量のテキストで学習するうちに、
        それらがモデルの内部に獲得されていくと考えられています。ただし「目的は次トークン予測だけ」という点は、
        幻覚(8-3)や事後学習の必要性(Stage 7)を理解する上で重要です。
      </p>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: '事前学習で、各位置の「正解」になるのは何ですか?',
      choices: ['人間が付けたラベル', 'テキスト中の次のトークン', '文全体の要約'],
      answer: 1,
      explanation: 'テキスト自体から正解が得られるので、人手のラベル付けなしに大量のデータで学習できます。',
    },
    {
      question: '正解トークンに付けた確率が 1.0 のとき、その位置の損失はいくつですか?',
      choices: ['0', '1', '無限大'],
      answer: 0,
      explanation: '−log(1) = 0 です。確率が低くなるほど損失は大きくなります。',
    },
    {
      question: 'perplexity が小さいことは、何を意味しますか?',
      choices: [
        'モデルが次のトークンをよく当てている',
        'モデルのパラメータ数が少ない',
        'モデルの推論が速い',
      ],
      answer: 0,
      explanation: 'perplexity は平均損失の指数で、小さいほど正解に高い確率を付けられています。',
    },
  ],
}

export default content
