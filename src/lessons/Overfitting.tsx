import { useMemo, useState } from 'react'
import { Plot, curvePath } from '../Plot'
import { Slider } from '../components'
import type { LessonContent } from './types'

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const truth = (x: number) => Math.sin(Math.PI * x)

function makeData(n: number, seed: number) {
  const rand = mulberry32(seed)
  return Array.from({ length: n }, () => {
    const x = rand() * 2 - 1
    const noise = (rand() + rand() + rand() - 1.5) * 0.5
    return { x, y: truth(x) + noise }
  })
}

/** 正規方程式(微小なリッジ項付き)で degree 次の多項式をあてはめ、係数を返す。 */
function polyFit(data: { x: number; y: number }[], degree: number) {
  const m = degree + 1
  const A = Array.from({ length: m }, () => Array(m + 1).fill(0))
  for (const { x, y } of data) {
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < m; j++) A[i][j] += x ** (i + j)
      A[i][m] += y * x ** i
    }
  }
  for (let i = 0; i < m; i++) A[i][i] += 1e-8
  for (let c = 0; c < m; c++) {
    let p = c
    for (let r = c + 1; r < m; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r
    ;[A[c], A[p]] = [A[p], A[c]]
    for (let r = 0; r < m; r++) {
      if (r === c) continue
      const k = A[r][c] / A[c][c]
      for (let j = c; j <= m; j++) A[r][j] -= k * A[c][j]
    }
  }
  return A.map((row, i) => row[m] / row[i])
}

const evalPoly = (coef: number[], x: number) => coef.reduce((s, c, i) => s + c * x ** i, 0)
const mse = (coef: number[], data: { x: number; y: number }[]) =>
  data.reduce((s, d) => s + (evalPoly(coef, d.x) - d.y) ** 2, 0) / data.length

const X: [number, number] = [-1, 1]
const Y: [number, number] = [-2, 2]

function FitDemo() {
  const train = useMemo(() => makeData(10, 23), [])
  const test = useMemo(() => makeData(40, 99), [])
  const [degree, setDegree] = useState(1)
  const coef = useMemo(() => polyFit(train, degree), [train, degree])
  const trainErr = mse(coef, train)
  const testErr = mse(coef, test)

  return (
    <div className="demo">
      <h4>デモ:モデルの複雑さと誤差</h4>
      <p className="muted">
        ●が訓練データ(10点)、○がテストデータ(未知データの代わり)。正解は sin 曲線にノイズが乗ったものです。
      </p>
      <Plot xDomain={X} yDomain={Y} label="多項式のあてはめ">
        {(sx, sy) => (
          <>
            <path className="curve dashed" d={curvePath(truth, X, Y, sx, sy)} />
            <path className="curve" d={curvePath((x) => evalPoly(coef, x), X, Y, sx, sy, 200)} />
            {test.map((d, i) => <circle key={i} className="pt-test" cx={sx(d.x)} cy={sy(d.y)} r={3} />)}
            {train.map((d, i) => <circle key={i} className="pt" cx={sx(d.x)} cy={sy(d.y)} r={4} />)}
          </>
        )}
      </Plot>
      <Slider label="多項式の次数" value={degree} min={1} max={9} step={1} onChange={setDegree} />
      <table className="calc">
        <tbody>
          <tr><td>訓練誤差</td><td><strong>{trainErr.toFixed(3)}</strong></td></tr>
          <tr><td>テスト誤差</td><td><strong>{testErr.toFixed(3)}</strong></td></tr>
        </tbody>
      </table>
      <p className="muted">
        灰色の点線が真の曲線。次数を上げると訓練誤差は下がり続けますが、テスト誤差は次数3〜4あたりを底に悪化していきます。次数9では全点を通りますが、点の間で大きく暴れます。
      </p>
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>目的は「未知のデータ」で当てること</h3>
      <p>
        学習に使ったデータ(訓練データ)で当たるのは当然です。本当に欲しいのは、<strong>見たことのないデータ</strong>でも
        うまく動くこと。この能力を<strong>汎化</strong>と呼びます。
      </p>

      <h3>過学習と未学習</h3>
      <ul>
        <li><strong>未学習</strong>:モデルが単純すぎて、訓練データのパターンも捉えられない。訓練誤差もテスト誤差も高い。</li>
        <li><strong>過学習</strong>:モデルが訓練データのノイズまで覚えてしまう。訓練誤差は低いが、テスト誤差が高い。</li>
      </ul>

      <FitDemo />

      <h3>汎化のためによく使う対策</h3>
      <ul>
        <li><strong>データを増やす</strong>:最も効果的。LLMで大量のテキストを使う大きな理由の1つ。</li>
        <li><strong>データを分けて評価する</strong>:訓練用・検証用・テスト用に分け、学習に使っていないデータで性能を測る。</li>
        <li><strong>正則化</strong>:重みが大きくなりすぎないよう罰則を加える(L2、weight decay)。</li>
        <li><strong>ドロップアウト</strong>:学習中にランダムにユニットを無効化し、特定の経路への依存を防ぐ。</li>
        <li><strong>早期終了</strong>:検証誤差が上がり始めたら学習を止める。</li>
      </ul>

      <h3>LLMでは</h3>
      <p>
        巨大なモデルはデータを丸暗記する能力を持ちますが、十分に大量で多様なデータで1〜数エポックしか学習しないことで、
        過学習を抑えています。一方、訓練データに含まれる文章をそのまま再現する(暗記)現象は実際に報告されており、
        重複除去(Stage 5)が重要になります。
      </p>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: '過学習の典型的な症状はどれですか?',
      choices: [
        '訓練誤差もテスト誤差も高い',
        '訓練誤差は低いが、テスト誤差が高い',
        '訓練誤差は高いが、テスト誤差が低い',
      ],
      answer: 1,
      explanation: '訓練データのノイズまで覚えてしまい、未知データではうまくいきません。',
    },
    {
      question: 'モデルの性能を正しく評価するために必要なことはどれですか?',
      choices: [
        '訓練に使ったデータで測る',
        '訓練に使っていないデータで測る',
        'パラメータ数で判断する',
      ],
      answer: 1,
      explanation: '汎化性能を見たいので、学習に使っていないデータで評価します。',
    },
    {
      question: '過学習を抑える方法として適切でないものはどれですか?',
      choices: ['データを増やす', '正則化を加える', '訓練誤差がゼロになるまで続ける'],
      answer: 2,
      explanation: '訓練誤差をゼロにすることを目指すと、むしろノイズまで覚えて過学習しやすくなります。',
    },
  ],
}

export default content
