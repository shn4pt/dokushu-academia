import { useState } from 'react'
import { Plot, curvePath } from '../Plot'
import { Slider } from '../components'
import { Tex } from '../Tex'
import type { LessonContent } from './types'

const f = (x: number) => (x - 2) ** 2 + 1
const df = (x: number) => (f(x + 1e-5) - f(x - 1e-5)) / 2e-5
const X: [number, number] = [-1, 5]
const Y: [number, number] = [0, 11]

function SlopeDemo() {
  const [x, setX] = useState(0)
  const slope = df(x)
  const dx = 0.8
  return (
    <div className="demo">
      <h4>デモ:傾きは「どちらに動かすと増えるか」</h4>
      <Plot xDomain={X} yDomain={Y} label="f(x) = (x-2)^2 + 1 のグラフと接線">
        {(sx, sy) => (
          <>
            <path className="curve" d={curvePath(f, X, Y, sx, sy)} />
            <line
              className="tangent"
              x1={sx(x - dx)} y1={sy(f(x) - slope * dx)}
              x2={sx(x + dx)} y2={sy(f(x) + slope * dx)}
            />
            <circle className="mark" cx={sx(x)} cy={sy(f(x))} r={5} />
          </>
        )}
      </Plot>
      <Slider label="x" value={x} min={-1} max={5} step={0.1} onChange={setX} format={(v) => v.toFixed(1)} />
      <p>
        f(x) = {f(x).toFixed(2)}、傾き f′(x) = <strong>{slope.toFixed(2)}</strong>
        {' → '}
        {Math.abs(slope) < 0.05
          ? '最小の点です(傾きがほぼ0)。'
          : slope > 0
            ? 'x を増やすと f は増える。減らしたいなら x を小さくする。'
            : 'x を増やすと f は減る。減らしたいなら x を大きくする。'}
      </p>
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>微分は「変化の勢い」</h3>
      <p>
        関数 <Tex tex="f(x)" /> の微分 <Tex tex="f'(x)" /> は、その点での<strong>傾き</strong>です。x を少し動かしたとき、
        f がどれだけ変わるかを表します。
      </p>
      <Tex block tex={String.raw`f'(x)=\lim_{h\to0}\frac{f(x+h)-f(x)}{h}`} />
      <pre>{`def numerical_derivative(f, x, h=1e-5):
    return (f(x + h) - f(x - h)) / (2 * h)`}</pre>
      <p>
        機械学習で重要なのは、傾きの<strong>符号</strong>です。傾きが正なら x を増やすと f が増えるので、f を減らしたければ
        x を減らす。傾きが負ならその逆です。
      </p>

      <SlopeDemo />

      <h3>変数が複数あるとき:偏微分と勾配</h3>
      <p>
        パラメータが複数ある関数では、他の変数を固定して1つの変数だけで微分します(<strong>偏微分</strong>)。
        すべての偏微分を並べたベクトルが<strong>勾配</strong>です。
      </p>
      <Tex block tex={String.raw`\nabla f=\left(\frac{\partial f}{\partial w_1},\ \frac{\partial f}{\partial w_2},\ \dots\right)`} />
      <p>
        勾配は「f が最も急に増える方向」を指します。したがって<strong>逆向きに動けば、f が最も急に減る</strong>。
        これが次のレッスン以降で使う勾配降下法の土台です。
      </p>

      <h3>連鎖律</h3>
      <p>
        合成関数 <Tex tex="f(g(x))" /> の微分は、各段階の微分の積になります。ニューラルネットワークは関数の合成なので、
        この性質で全パラメータの勾配を計算します(誤差逆伝播)。
      </p>
      <Tex block tex={String.raw`\frac{d}{dx}f(g(x))=f'(g(x))\cdot g'(x)`} />
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'ある点で f′(x) > 0 のとき、f の値を減らしたければ x をどうしますか?',
      choices: ['増やす', '減らす', '動かさない'],
      answer: 1,
      explanation: '傾きが正なら x を増やすと f も増えるため、f を減らすには x を小さくします。',
    },
    {
      question: '勾配ベクトルが指す方向はどれですか?',
      choices: ['f が最も急に増える方向', 'f が最も急に減る方向', 'f が変化しない方向'],
      answer: 0,
      explanation: '勾配は増加が最も急な方向です。減らしたいときはその逆向きに進みます。',
    },
    {
      question: '連鎖律が必要になるのはどんなときですか?',
      choices: [
        '関数が合成されている(層が重なっている)とき',
        '変数が1つだけのとき',
        '関数が定数のとき',
      ],
      answer: 0,
      explanation: '合成関数の微分は各段の微分の積になり、ニューラルネットの勾配計算の基礎になります。',
    },
  ],
}

export default content
