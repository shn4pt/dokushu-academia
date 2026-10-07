import { useState } from 'react'
import { Slider } from '../components'
import { Tex } from '../Tex'
import type { LessonContent } from './types'

const X = 1.5
const Y = 1
const sigmoid = (z: number) => 1 / (1 + Math.exp(-z))

function forward(w: number, b: number) {
  const z = w * X + b
  const a = sigmoid(z)
  const loss = (a - Y) ** 2
  return { z, a, loss }
}

function BackpropDemo() {
  const [w, setW] = useState(-1)
  const [b, setB] = useState(0)
  const [lr, setLr] = useState(1)
  const [history, setHistory] = useState<number[]>([])
  const { z, a, loss } = forward(w, b)

  // 逆伝播:出力側から連鎖律で勾配を求める
  const dLda = 2 * (a - Y)
  const dadz = a * (1 - a)
  const dLdz = dLda * dadz
  const dLdw = dLdz * X
  const dLdb = dLdz * 1

  // 数値微分での検算
  const h = 1e-5
  const numW = (forward(w + h, b).loss - forward(w - h, b).loss) / (2 * h)

  function step() {
    setHistory([...history, loss])
    setW(w - lr * dLdw)
    setB(b - lr * dLdb)
  }
  function reset() {
    setW(-1)
    setB(0)
    setHistory([])
  }

  return (
    <div className="demo">
      <h4>デモ:逆伝播で勾配を求めて1ステップ更新</h4>
      <p className="muted">
        モデル: a = σ(w·x + b)、損失 L = (a − y)²。ここでは x = {X}、正解 y = {Y} に固定しています。
      </p>
      <table className="calc">
        <thead><tr><th>順伝播</th><th>値</th></tr></thead>
        <tbody>
          <tr><td>z = w·x + b</td><td>{z.toFixed(4)}</td></tr>
          <tr><td>a = σ(z)</td><td>{a.toFixed(4)}</td></tr>
          <tr><td>L = (a − y)²</td><td>{loss.toFixed(4)}</td></tr>
        </tbody>
      </table>
      <table className="calc">
        <thead><tr><th>逆伝播(出力側から)</th><th>値</th></tr></thead>
        <tbody>
          <tr><td>∂L/∂a = 2(a − y)</td><td>{dLda.toFixed(4)}</td></tr>
          <tr><td>∂a/∂z = a(1 − a)</td><td>{dadz.toFixed(4)}</td></tr>
          <tr><td>∂L/∂z = ∂L/∂a · ∂a/∂z</td><td>{dLdz.toFixed(4)}</td></tr>
          <tr><td>∂L/∂w = ∂L/∂z · x</td><td><strong>{dLdw.toFixed(4)}</strong></td></tr>
          <tr><td>∂L/∂b = ∂L/∂z · 1</td><td><strong>{dLdb.toFixed(4)}</strong></td></tr>
        </tbody>
      </table>
      <p className="muted">検算:数値微分による ∂L/∂w ≈ {numW.toFixed(4)}(一致していれば逆伝播は正しい)</p>
      <p>現在: w = <strong>{w.toFixed(3)}</strong>、b = <strong>{b.toFixed(3)}</strong></p>
      <Slider label="学習率 η" value={lr} min={0.1} max={5} step={0.1} onChange={setLr} format={(v) => v.toFixed(1)} />
      <div className="row">
        <button onClick={step}>勾配降下で1ステップ更新</button>
        <button className="secondary" onClick={reset}>リセット</button>
      </div>
      {history.length > 0 && (
        <p className="muted">
          損失の推移: {[...history, loss].slice(-8).map((v) => v.toFixed(3)).join(' → ')}
        </p>
      )}
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>課題:数十億のパラメータの勾配をどう求めるか</h3>
      <p>
        勾配降下法には、すべてのパラメータについて損失の偏微分が必要です。パラメータごとに数値微分すると、
        パラメータ数の2倍の回数だけ順伝播をやり直すことになり、現実的ではありません。
      </p>

      <h3>誤差逆伝播法(バックプロパゲーション)</h3>
      <p>
        ネットワークは関数の合成なので、<strong>連鎖律</strong>で損失から入力側へ向かって、勾配を順に計算できます。
        途中の結果を再利用するため、全パラメータの勾配が<strong>順伝播とほぼ同じ程度のコスト</strong>で求まります。
      </p>
      <Tex block tex={String.raw`\frac{\partial L}{\partial w}=\frac{\partial L}{\partial a}\cdot\frac{\partial a}{\partial z}\cdot\frac{\partial z}{\partial w}`} />
      <ol>
        <li><strong>順伝播</strong>:入力から出力まで計算し、途中の値を保存する。</li>
        <li><strong>損失の計算</strong>:出力と正解から損失を求める。</li>
        <li><strong>逆伝播</strong>:損失から入力側へ向かって、各ステップの局所的な微分を掛けながら勾配を伝える。</li>
        <li><strong>更新</strong>:得られた勾配でパラメータを更新する。</li>
      </ol>

      <BackpropDemo />

      <h3>実際には自動微分が行う</h3>
      <p>
        PyTorch などのフレームワークは、順伝播の計算を記録し、<code>loss.backward()</code> の一回の呼び出しで
        すべての勾配を自動で計算します(<strong>自動微分</strong>)。
      </p>
      <pre>{`loss = loss_fn(model(x), y)
loss.backward()        # 全パラメータの勾配を計算
optimizer.step()       # 勾配でパラメータを更新
optimizer.zero_grad()  # 勾配をリセット`}</pre>
      <p>
        逆伝播のために途中の値を保存するので、学習時は推論時よりメモリを大きく使います。大規模モデルの学習に
        大量のGPUメモリが必要になる理由の1つです。
      </p>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: '誤差逆伝播法が勾配を効率よく求められる理由はどれですか?',
      choices: [
        '連鎖律で、途中の微分を再利用しながら出力側から順に計算できるから',
        'パラメータを1つずつ動かして損失の変化を測るから',
        'ランダムに勾配を推定するから',
      ],
      answer: 0,
      explanation: '局所的な微分を掛け合わせて伝えるため、全パラメータの勾配を順伝播と同程度のコストで得られます。',
    },
    {
      question: '逆伝播の前に、順伝播で途中の値を保存しておく理由はどれですか?',
      choices: [
        '推論を高速にするため',
        '勾配の計算に、順伝播での各層の値が必要だから',
        '出力を正規化するため',
      ],
      answer: 1,
      explanation: '例えば ∂a/∂z = a(1−a) の計算には順伝播で得た a が必要です。',
    },
    {
      question: 'PyTorch で loss.backward() が行うことはどれですか?',
      choices: [
        'パラメータを更新する',
        '全パラメータの勾配を自動微分で計算する',
        'モデルを保存する',
      ],
      answer: 1,
      explanation: 'backward は勾配の計算まで。更新は optimizer.step() が行います。',
    },
  ],
}

export default content
