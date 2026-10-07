import { useState } from 'react'
import { Plot } from '../Plot'
import { Slider } from '../components'
import { Tex } from '../Tex'
import type { LessonContent } from './types'

const xs = [0, 1, 2, 3, 4, 5]
const ys = [1.2, 2.8, 5.3, 6.7, 9.4, 10.6]

function LossDemo() {
  const [w, setW] = useState(0.5)
  const [b, setB] = useState(0)
  const pred = (x: number) => w * x + b
  const mse = xs.reduce((s, x, i) => s + (pred(x) - ys[i]) ** 2, 0) / xs.length

  return (
    <div className="demo">
      <h4>デモ:直線を当てはめて損失を見る</h4>
      <p className="muted">モデルは y = w·x + b。w と b を動かして、損失(平均二乗誤差)を小さくしてみましょう。</p>
      <Plot xDomain={[0, 5.5]} yDomain={[-1, 13]} label="データ点と予測直線">
        {(sx, sy) => (
          <>
            {xs.map((x, i) => (
              <line key={i} className="resid" x1={sx(x)} x2={sx(x)} y1={sy(ys[i])} y2={sy(pred(x))} />
            ))}
            <line className="tangent" style={{ stroke: 'var(--accent)' }} x1={sx(0)} y1={sy(pred(0))} x2={sx(5.5)} y2={sy(pred(5.5))} />
            {xs.map((x, i) => <circle key={i} className="pt" cx={sx(x)} cy={sy(ys[i])} r={4} />)}
          </>
        )}
      </Plot>
      <Slider label="w" value={w} min={-1} max={4} step={0.1} onChange={setW} format={(v) => v.toFixed(1)} />
      <Slider label="b" value={b} min={-3} max={5} step={0.1} onChange={setB} format={(v) => v.toFixed(1)} />
      <p>損失 (MSE) = <strong>{mse.toFixed(2)}</strong> <span className="muted">(点線が各点の誤差)</span></p>
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>「良いモデル」を数値で測る</h3>
      <p>
        機械学習では、モデルのパラメータ(重み)を調整してデータに合わせます。調整するには、まず予測がどれだけ外れているかを
        <strong>1つの数値</strong>で表す必要があります。それが<strong>損失関数</strong>(loss)です。損失が小さいほど良いモデルです。
      </p>

      <h3>回帰:平均二乗誤差</h3>
      <p>数値を予測する問題では、誤差の二乗の平均を使うのが基本です。</p>
      <Tex block tex={String.raw`L=\frac{1}{N}\sum_{i=1}^{N}\bigl(\hat{y}_i-y_i\bigr)^2`} />
      <p>二乗するので、大きな外れ値ほど強く罰せられます。そして、なめらかで微分しやすいという利点もあります。</p>

      <LossDemo />

      <h3>分類:交差エントロピー</h3>
      <p>
        LLMのように「確率分布を出力して、正解を当てる」問題では、<strong>正解に割り当てた確率の対数</strong>にマイナスを付けたもの
        (負の対数尤度、交差エントロピー)を使います。
      </p>
      <Tex block tex={String.raw`L=-\log P(y_{\text{正解}})`} />
      <table className="calc">
        <thead><tr><th>正解への確率</th><th>損失</th></tr></thead>
        <tbody>
          <tr><td>0.9</td><td>0.11</td></tr>
          <tr><td>0.5</td><td>0.69</td></tr>
          <tr><td>0.1</td><td>2.30</td></tr>
          <tr><td>0.01</td><td>4.61</td></tr>
        </tbody>
      </table>
      <p>
        正解の確率が1に近いほど損失は0に近づき、低いほど急激に大きくなります。LLMの事前学習は、
        「次のトークンの正解にできるだけ高い確率を付ける」ことを目指して、この損失を最小化しています(Stage 5)。
      </p>

      <h3>損失は「ゴール」ではなく「道しるべ」</h3>
      <p>
        私たちが本当に欲しいのは「役に立つモデル」ですが、それは直接最適化できません。そこで微分できる損失で代用し、
        その値を下げる方向にパラメータを動かします。損失が下がっても本当に良いとは限らない点は、次々回の汎化の話で触れます。
      </p>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: '損失関数の役割はどれですか?',
      choices: [
        'モデルの予測のズレを1つの数値で表す',
        'モデルの層の数を決める',
        '学習データを増やす',
      ],
      answer: 0,
      explanation: '損失は予測の悪さを数値にしたもので、パラメータ調整の指針になります。',
    },
    {
      question: '正解の確率が 0.5 から 0.1 に下がると、交差エントロピー損失はどうなりますか?',
      choices: ['小さくなる', '変わらない', '大きくなる'],
      answer: 2,
      explanation: '-log P は確率が低いほど大きくなります(0.69 → 2.30)。',
    },
    {
      question: '平均二乗誤差で大きな誤差が強く反映される理由はどれですか?',
      choices: ['誤差を二乗するから', '誤差を平均するから', '誤差の符号を無視するから'],
      answer: 0,
      explanation: '二乗により、誤差が2倍になると損失は4倍になります。',
    },
  ],
}

export default content
