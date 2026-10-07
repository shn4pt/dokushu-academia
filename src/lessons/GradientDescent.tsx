import { useState } from 'react'
import { Plot, curvePath } from '../Plot'
import { Slider } from '../components'
import { Tex } from '../Tex'
import type { LessonContent } from './types'

const L = (w: number) => (w - 3) ** 2
const dL = (w: number) => 2 * (w - 3)
const X: [number, number] = [-2, 8]
const Y: [number, number] = [0, 30]
const START = -1

function DescentDemo() {
  const [lr, setLr] = useState(0.2)
  const [trail, setTrail] = useState([START])
  const w = trail[trail.length - 1]

  const step = (n: number) => {
    const next = [...trail]
    for (let i = 0; i < n; i++) {
      const cur = next[next.length - 1]
      next.push(cur - lr * dL(cur))
    }
    setTrail(next)
  }
  const diverged = !Number.isFinite(L(w)) || L(w) > 1e6

  return (
    <div className="demo">
      <h4>デモ:学習率を変えて勾配降下を試す</h4>
      <p className="muted">損失 L(w) = (w − 3)²。最小は w = 3。学習率 η によって挙動が大きく変わります。</p>
      <Plot xDomain={X} yDomain={Y} label="損失曲線と更新の軌跡">
        {(sx, sy) => (
          <>
            <path className="curve" d={curvePath(L, X, Y, sx, sy)} />
            {trail.slice(-12).map((p, i, arr) => (
              <circle
                key={i}
                className="mark"
                cx={sx(Math.min(Math.max(p, X[0]), X[1]))}
                cy={sy(Math.min(L(p), Y[1]))}
                r={i === arr.length - 1 ? 6 : 3}
                opacity={0.3 + (0.7 * i) / arr.length}
              />
            ))}
          </>
        )}
      </Plot>
      <Slider
        label="学習率 η"
        value={lr}
        min={0.05}
        max={1.1}
        step={0.05}
        onChange={(v) => {
          setLr(v)
          setTrail([START])
        }}
        format={(v) => v.toFixed(2)}
      />
      <div className="row">
        <button onClick={() => step(1)}>1ステップ</button>
        <button onClick={() => step(10)}>10ステップ</button>
        <button className="secondary" onClick={() => setTrail([START])}>リセット</button>
        <span className="muted">{trail.length - 1} ステップ</span>
      </div>
      <p>
        w = <strong>{diverged ? '発散' : w.toFixed(3)}</strong>、損失 = <strong>{diverged ? '∞' : L(w).toFixed(4)}</strong>
      </p>
      {lr > 1 && <p className="notice">η &gt; 1 だと、1回の更新で最小点を飛び越えて振動が大きくなり、発散します。</p>}
      {lr >= 0.9 && lr <= 1 && <p className="notice">η が大きすぎると、最小点の左右を行き来してなかなか収束しません。</p>}
      {lr <= 0.1 && <p className="notice">η が小さいと安全ですが、収束まで多くのステップが必要です。</p>}
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>基本アイデア:坂を下る</h3>
      <p>
        損失の勾配は、損失が最も急に増える方向を指します。逆向きに少しだけ動くのを繰り返せば、損失は下がっていきます。
        これが<strong>勾配降下法</strong>です。
      </p>
      <Tex block tex={String.raw`\theta \leftarrow \theta-\eta\,\nabla_{\theta}L`} />
      <ul>
        <li><Tex tex={String.raw`\theta`} />:パラメータ(重みの全体)</li>
        <li><Tex tex={String.raw`\eta`} />:<strong>学習率</strong>。1回に動く大きさ</li>
        <li><Tex tex={String.raw`\nabla_\theta L`} />:損失の勾配</li>
      </ul>
      <pre>{`for step in range(num_steps):
    grad = compute_gradient(loss, params)   # 勾配を計算
    params = params - lr * grad             # 逆向きに少し動かす`}</pre>

      <DescentDemo />

      <h3>学習率が最重要のハイパーパラメータ</h3>
      <ul>
        <li><strong>小さすぎる</strong>:安全だが遅い。</li>
        <li><strong>大きすぎる</strong>:振動したり、発散したりする。</li>
        <li>実際の学習では、最初に徐々に上げ(ウォームアップ)、その後下げていく「スケジュール」を使うのが一般的。</li>
      </ul>

      <h3>確率的勾配降下法(SGD)とミニバッチ</h3>
      <p>
        全データで勾配を計算するのは高コストです。そこでデータの一部(<strong>ミニバッチ</strong>)で勾配を見積もって更新します。
        ノイズは含まれますが、更新回数を稼げるため効率的です。LLMの学習もこの形で、1ステップに数百万トークン以上を使います。
      </p>
      <h3>Adam などの改良版</h3>
      <p>
        LLMでは、過去の勾配の平均を使って更新量を調整する <strong>Adam(AdamW)</strong> がよく使われます。
        基本は上の更新式と同じで、「パラメータごとに歩幅を自動調整する」工夫が加わったものと捉えれば十分です。
      </p>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: '勾配降下法でパラメータはどの方向に更新されますか?',
      choices: ['勾配と同じ方向', '勾配と逆方向', 'ランダムな方向'],
      answer: 1,
      explanation: '勾配は損失が増える方向なので、逆向きに動かして損失を減らします。',
    },
    {
      question: '学習率を大きくしすぎると何が起こりやすいですか?',
      choices: [
        '必ず最速で収束する',
        '損失が振動したり発散したりする',
        'パラメータが更新されなくなる',
      ],
      answer: 1,
      explanation: '1回の更新が大きすぎて最小点を飛び越し、損失が悪化することがあります。',
    },
    {
      question: 'ミニバッチを使う主な理由はどれですか?',
      choices: [
        '全データで勾配を計算するコストを避けるため',
        '損失が必ずゼロになるため',
        'モデルのサイズを小さくするため',
      ],
      answer: 0,
      explanation: '一部のデータで勾配を見積もることで、1ステップを軽くし、更新回数を増やせます。',
    },
  ],
}

export default content
