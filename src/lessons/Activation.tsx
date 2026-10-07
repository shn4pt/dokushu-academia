import { useState } from 'react'
import { Plot, curvePath } from '../Plot'
import { Slider } from '../components'
import { Tex } from '../Tex'
import type { LessonContent } from './types'

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))
const fns = {
  relu: { label: 'ReLU', f: (x: number) => Math.max(0, x) },
  gelu: { label: 'GELU', f: (x: number) => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3))) },
  sigmoid: { label: 'シグモイド', f: sigmoid },
  tanh: { label: 'tanh', f: Math.tanh },
}
type Key = keyof typeof fns
const X: [number, number] = [-4, 4]
const Y: [number, number] = [-1.5, 4]
const d = (f: (x: number) => number, x: number) => (f(x + 1e-4) - f(x - 1e-4)) / 2e-4

function ActivationDemo() {
  const [key, setKey] = useState<Key>('relu')
  const [x, setX] = useState(1)
  const { f } = fns[key]
  return (
    <div className="demo">
      <h4>デモ:活性化関数の形と傾き</h4>
      <div className="row">
        {(Object.keys(fns) as Key[]).map((k) => (
          <button key={k} className={k === key ? '' : 'secondary'} onClick={() => setKey(k)}>{fns[k].label}</button>
        ))}
      </div>
      <Plot xDomain={X} yDomain={Y} label={`${fns[key].label} のグラフ`}>
        {(sx, sy) => (
          <>
            <path className="curve" d={curvePath(f, X, Y, sx, sy)} />
            <path className="curve dashed" d={curvePath((v) => d(f, v), X, Y, sx, sy)} />
            <circle className="mark" cx={sx(x)} cy={sy(f(x))} r={5} />
          </>
        )}
      </Plot>
      <p className="muted">実線が関数、破線が傾き(微分)。</p>
      <Slider label="x" value={x} min={-4} max={4} step={0.1} onChange={setX} format={(v) => v.toFixed(1)} />
      <p>f(x) = <strong>{f(x).toFixed(3)}</strong>、傾き = <strong>{d(f, x).toFixed(3)}</strong></p>
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>なぜ非線形関数が必要か</h3>
      <p>
        もし活性化関数がなく、線形変換だけを重ねたらどうなるでしょう。2層の線形変換は、1つの行列にまとめられてしまいます。
      </p>
      <Tex block tex={String.raw`W_2(W_1\mathbf{x})=(W_2W_1)\,\mathbf{x}`} />
      <p>
        何層重ねても、表現できるのは「1つの線形変換」だけです。層の間に<strong>非線形関数</strong>を挟むことで初めて、
        曲がった複雑な関係を表現できるようになります。
      </p>

      <h3>代表的な活性化関数</h3>
      <ul>
        <li><strong>ReLU</strong>:<Tex tex="\max(0,x)" />。負なら0、正ならそのまま。単純で高速。</li>
        <li><strong>GELU</strong>:ReLUをなめらかにしたもの。GPT系やBERTのFFNで広く使われる。</li>
        <li><strong>シグモイド</strong>:出力を0〜1に押し込む。確率的な出力や「ゲート」に使われる。</li>
        <li><strong>tanh</strong>:出力が-1〜1。RNN系で多用された。</li>
      </ul>

      <ActivationDemo />

      <p>
        シグモイドやtanhは、入力が大きい(小さい)領域で傾きがほぼ0になります(破線を見てください)。深い層では、
        傾きの積が0に近づき、学習信号が消える<strong>勾配消失</strong>の原因になります。ReLUやGELUは正の領域で傾きが保たれるため、
        深いネットワークでも学習しやすいのです。
      </p>

      <h3>出力層の softmax</h3>
      <p>
        分類やLLMの最終層では、実数のベクトル(ロジット)を確率分布に変換する <strong>softmax</strong> を使います。
      </p>
      <Tex block tex={String.raw`\mathrm{softmax}(\mathbf{z})_i=\frac{e^{z_i}}{\sum_j e^{z_j}}`} />
      <p>すべての値が正になり、合計が1になります。4-2 の Self-Attention でも同じ関数が登場します。</p>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: '活性化関数がない(線形変換のみ)ネットワークの問題はどれですか?',
      choices: [
        '何層重ねても1つの線形変換と同じ表現力になる',
        '計算が遅くなりすぎる',
        'パラメータ数が増えない',
      ],
      answer: 0,
      explanation: '線形変換の合成は線形変換なので、深くしても表現力が増えません。',
    },
    {
      question: 'ReLU(x) の x = -2 での値はいくつですか?',
      choices: ['-2', '0', '2'],
      answer: 1,
      explanation: 'ReLU は max(0, x) なので、負の入力は0になります。',
    },
    {
      question: 'softmax の出力の性質として正しいものはどれですか?',
      choices: [
        'すべて正で、合計が1になる',
        '最大値が必ず1になる',
        '負の値を含むことがある',
      ],
      answer: 0,
      explanation: '指数関数で正にし、合計で割るので、確率分布になります。',
    },
  ],
}

export default content
