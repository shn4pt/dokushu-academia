import { useState } from 'react'
import { Slider } from '../components'
import { Tex } from '../Tex'
import type { LessonContent } from './types'

type Act = 'none' | 'relu' | 'sigmoid'
const acts: Record<Act, { label: string; f: (z: number) => number }> = {
  none: { label: 'なし(線形)', f: (z) => z },
  relu: { label: 'ReLU', f: (z) => Math.max(0, z) },
  sigmoid: { label: 'シグモイド', f: (z) => 1 / (1 + Math.exp(-z)) },
}

function NeuronDemo() {
  const [x, setX] = useState([1, -0.5])
  const [w, setW] = useState([1, 2])
  const [b, setB] = useState(-0.5)
  const [act, setAct] = useState<Act>('relu')
  const z = w[0] * x[0] + w[1] * x[1] + b
  const a = acts[act].f(z)
  const fmt = (v: number) => v.toFixed(1)

  return (
    <div className="demo">
      <h4>デモ:1つのニューロン</h4>
      <Slider label="入力 x₁" value={x[0]} min={-2} max={2} step={0.1} onChange={(v) => setX([v, x[1]])} format={fmt} />
      <Slider label="入力 x₂" value={x[1]} min={-2} max={2} step={0.1} onChange={(v) => setX([x[0], v])} format={fmt} />
      <Slider label="重み w₁" value={w[0]} min={-3} max={3} step={0.1} onChange={(v) => setW([v, w[1]])} format={fmt} />
      <Slider label="重み w₂" value={w[1]} min={-3} max={3} step={0.1} onChange={(v) => setW([w[0], v])} format={fmt} />
      <Slider label="バイアス b" value={b} min={-3} max={3} step={0.1} onChange={setB} format={fmt} />
      <label className="row">
        活性化関数:
        <select className="sel-input" value={act} onChange={(e) => setAct(e.target.value as Act)}>
          {Object.entries(acts).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </label>
      <p className="mono">
        z = {w[0].toFixed(1)}×{x[0].toFixed(1)} + {w[1].toFixed(1)}×{x[1].toFixed(1)} + {b.toFixed(1)} = <strong>{z.toFixed(2)}</strong>
        <br />
        出力 a = {acts[act].label}(z) = <strong>{a.toFixed(2)}</strong>
      </p>
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>ニューロン:重み付き和 + 非線形関数</h3>
      <p>
        ニューラルネットワークの最小単位は<strong>ニューロン</strong>です。入力ベクトルに重みを掛けて足し、バイアスを加え、
        最後に<strong>活性化関数</strong>を通します。
      </p>
      <Tex block tex={String.raw`a=\sigma\!\left(\mathbf{w}\cdot\mathbf{x}+b\right)`} />
      <pre>{`def neuron(x, w, b, act):
    z = sum(wi * xi for wi, xi in zip(w, x)) + b
    return act(z)`}</pre>
      <p>
        重み <Tex tex={String.raw`\mathbf{w}`} /> とバイアス <Tex tex="b" /> が<strong>学習されるパラメータ</strong>です。
      </p>

      <NeuronDemo />

      <h3>層:ニューロンを並べたもの</h3>
      <p>
        n 個の入力を m 個のニューロンに同時に入れると、重みは m×n の行列 <Tex tex="W" /> にまとめられ、1層の計算は
        行列積で書けます(Stage 0 の復習)。
      </p>
      <Tex block tex={String.raw`\mathbf{a}=\sigma(W\mathbf{x}+\mathbf{b})`} />

      <h3>層を重ねる</h3>
      <p>
        層の出力を次の層の入力にして重ねたものが<strong>多層ニューラルネットワーク</strong>(深層学習の「深層」)です。
      </p>
      <pre>{`入力 x → [層1: W1,b1 + σ] → h1 → [層2: W2,b2 + σ] → h2 → ... → 出力`}</pre>
      <p>
        層を重ねるほど、単純な特徴から複雑な特徴を組み立てられます。LLMは数十〜百以上の層を持ち、
        パラメータ数は数十億〜数兆に達しますが、基本部品はこの「行列積 + 非線形関数」です。
      </p>
      <h3>パラメータ数の数え方</h3>
      <p>
        入力 n、出力 m の層なら、重み <Tex tex="m\times n" /> 個 + バイアス m 個 = <Tex tex="mn+m" /> 個です。
        たとえば 1024→1024 の層は約105万パラメータです。
      </p>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'ニューロンの計算として正しいものはどれですか?',
      choices: [
        '入力の最大値を返す',
        '重み付き和にバイアスを足し、活性化関数を通す',
        '入力をそのまま次の層に渡す',
      ],
      answer: 1,
      explanation: 'a = σ(w·x + b) が基本形です。',
    },
    {
      question: '学習で更新される対象はどれですか?',
      choices: ['重みとバイアス', '入力データ', '活性化関数の種類'],
      answer: 0,
      explanation: '重みとバイアスがパラメータで、損失を下げる方向に更新されます。',
    },
    {
      question: '入力1024、出力512の全結合層(バイアスあり)のパラメータ数は?',
      choices: ['1536', '524288', '524800'],
      answer: 2,
      explanation: '1024×512 = 524288 の重みに、バイアス512個を加えて 524800 です。',
    },
  ],
}

export default content
