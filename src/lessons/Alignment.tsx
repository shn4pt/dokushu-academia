import { useState } from 'react'
import { Plot, curvePath } from '../Plot'
import { Slider } from '../components'
import type { LessonContent } from './types'

const proxy = (x: number) => x
const truth = (x: number) => x - 0.1 * x * x
const X: [number, number] = [0, 10]
const Y: [number, number] = [-1, 10]

function GoodhartDemo() {
  const [x, setX] = useState(3)
  return (
    <div className="demo">
      <h4>デモ(模式図):報酬を最適化しすぎるとどうなるか</h4>
      <p className="muted">
        実測ではなく、概念を示すための模式的なグラフです。横軸は「報酬モデルのスコアを最適化した量」、
        実線(青)は報酬モデルのスコア、破線(灰)は本当の品質です。
      </p>
      <Plot xDomain={X} yDomain={Y} label="報酬の最適化量と、報酬モデルのスコア・本当の品質">
        {(sx, sy) => (
          <>
            <path className="curve" d={curvePath(proxy, X, Y, sx, sy)} />
            <path className="curve dashed" d={curvePath(truth, X, Y, sx, sy)} />
            <circle className="mark" cx={sx(x)} cy={sy(proxy(x))} r={5} />
            <circle className="mark" cx={sx(x)} cy={sy(truth(x))} r={5} />
          </>
        )}
      </Plot>
      <Slider label="最適化の量" value={x} min={0} max={10} step={0.5} onChange={setX} format={(v) => v.toFixed(1)} />
      <p>
        報酬モデルのスコア: <strong>{proxy(x).toFixed(1)}</strong>、本当の品質: <strong>{truth(x).toFixed(1)}</strong>
        {x > 6 && ' → スコアは上がり続けるのに、本当の品質は下がっている。'}
      </p>
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>アライメント:人間の意図と価値に合わせる</h3>
      <p>
        <strong>アライメント</strong>は、モデルの振る舞いを人間の意図や価値観に合わせる取り組みの総称です。
        目標としてよく挙げられるのが <strong>HHH</strong>(Helpful:有用、Honest:正直、Harmless:無害)です。
        SFT、RLHF、DPOなどの事後学習は、その手段の一部です。
      </p>

      <h3>難しさ</h3>
      <ul>
        <li>
          <strong>有用性と無害性の緊張</strong>:何でも断れば無害だが無用。何でも答えれば有用だが危険な場合もある。
          断りすぎ(過剰拒否)も、答えすぎも、どちらも失敗。
        </li>
        <li>
          <strong>目的のずれ(報酬ハッキング)</strong>:測りやすい代理指標(報酬モデルのスコア)を最適化すると、本来の目的から外れる。
          「指標が目標になると、良い指標ではなくなる」(Goodhartの法則)。
        </li>
        <li>
          <strong>迎合(sycophancy)</strong>:人間は同意してくれる応答を好みやすいため、誤りでも相手に合わせる傾向が強まることがある。
        </li>
        <li>
          <strong>誰の価値観か</strong>:何が「適切」かは文化や文脈で変わる。唯一の正解はない。
        </li>
      </ul>

      <GoodhartDemo />

      <h3>実際の対策(例)</h3>
      <ul>
        <li><strong>多様な評価者・データ</strong>で比較データを集め、偏りを減らす。</li>
        <li><strong>レッドチーミング</strong>:攻撃的な入力でわざと問題を探し、事前に修正する。</li>
        <li><strong>方針の明文化</strong>:守るべき原則を文章で定め、モデルにそれに沿った自己評価をさせる(Constitutional AI など)。</li>
        <li><strong>多層的な防御</strong>:モデルの学習だけに頼らず、入出力のフィルタ、権限の制限、人間の確認を組み合わせる。</li>
        <li><strong>継続的な評価と監視</strong>:リリース後も、実際の使われ方を見て改善する。</li>
      </ul>

      <h3>使う側の注意</h3>
      <p>
        アライメントは完璧ではありません。モデルは指示と異なる振る舞いをすることがあり、悪意ある入力(プロンプトインジェクションなど)で
        制約を回避される場合もあります。アプリケーションを作るときは、モデルの学習結果に全面的に頼らず、
        権限を最小限にする、重要な操作は人が確認する、といったシステム側の設計を重ねる必要があります。
      </p>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'HHH はアライメントの目標として何を表しますか?',
      choices: [
        '有用・正直・無害',
        '高速・高精度・低コスト',
        '入力・隠れ層・出力',
      ],
      answer: 0,
      explanation: 'Helpful(有用)、Honest(正直)、Harmless(無害)の頭文字です。',
    },
    {
      question: '報酬ハッキングとは何ですか?',
      choices: [
        '報酬モデルのスコアは高いが、本来の目的からは外れた出力が増えること',
        '報酬モデルを外部から不正に書き換えること',
        '学習データを盗むこと',
      ],
      answer: 0,
      explanation: '代理指標を最適化しすぎると、本当の品質と乖離する現象です。',
    },
    {
      question: 'アプリを作る側の対策として適切なものはどれですか?',
      choices: [
        'モデルのアライメントを信頼し、他の対策は不要とする',
        '権限を最小限にし、重要な操作は人間が確認する',
        'システムプロンプトを非公開にすれば十分とする',
      ],
      answer: 1,
      explanation: 'モデルの学習だけに頼らず、システム側でも多層的に防御する必要があります。',
    },
  ],
}

export default content
