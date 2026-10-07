import { useState } from 'react'
import { NumInput } from '../components'
import { Tex } from '../Tex'
import type { LessonContent } from './types'

function MatVecDemo() {
  const [W, setW] = useState([[1, 2], [0, 1]])
  const [x, setX] = useState([3, 1])
  const setCell = (i: number, j: number, v: number) =>
    setW(W.map((row, r) => row.map((c, k) => (r === i && k === j ? v : c))))
  const y = W.map((row) => row[0] * x[0] + row[1] * x[1])

  return (
    <div className="demo">
      <h4>デモ:行列 × ベクトル</h4>
      <p className="muted">数値を書き換えてみてください。出力の各成分は「行 と x の内積」です。</p>
      <div className="row">
        <span>W =</span>
        <div>
          {W.map((row, i) => (
            <div key={i} className="row" style={{ margin: 2 }}>
              {row.map((c, j) => <NumInput key={j} value={c} onChange={(v) => setCell(i, j, v)} label={`W[${i}][${j}]`} />)}
            </div>
          ))}
        </div>
        <span>x =</span>
        <div>
          {x.map((c, i) => (
            <div key={i} style={{ margin: 2 }}>
              <NumInput value={c} onChange={(v) => setX(x.map((q, k) => (k === i ? v : q)))} label={`x[${i}]`} />
            </div>
          ))}
        </div>
      </div>
      {y.map((v, i) => (
        <p key={i} className="mono">
          y[{i}] = {W[i][0]}×{x[0]} + {W[i][1]}×{x[1]} = <strong>{v}</strong>
        </p>
      ))}
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>ベクトルは数値の配列</h3>
      <p>
        プログラマにとって、ベクトルは<strong>長さ n の数値配列</strong>です。LLMではトークンの埋め込みや、
        各層の中間表現がすべてベクトルとして扱われます。次元数(長さ)が数百〜数万になることもあります。
      </p>

      <h3>内積:2つのベクトルの「似ている度合い」</h3>
      <p>対応する成分を掛けて足し合わせたものが内積です。</p>
      <Tex block tex={String.raw`\mathbf{a}\cdot\mathbf{b}=\sum_{i=1}^{n} a_i b_i`} />
      <pre>{`a = [1, 2, 3]; b = [4, 5, 6]
sum(x*y for x, y in zip(a, b))   # 1*4 + 2*5 + 3*6 = 32`}</pre>
      <p>
        同じ向きなら大きな正の値、直交なら0、逆向きなら負になります。attention のスコアも埋め込みの類似度も、この内積が基本です。
      </p>

      <h3>行列:ベクトルを変換する部品</h3>
      <p>
        行列は数値の2次元配列です。<Tex tex="m \times n" /> 行列 <Tex tex="W" /> に長さ n のベクトル <Tex tex="\mathbf{x}" /> を掛けると、
        長さ m のベクトルが得られます。出力の i 番目は「W の i 行目と x の内積」です。
      </p>
      <Tex block tex={String.raw`\mathbf{y}=W\mathbf{x},\qquad y_i=\sum_j W_{ij}x_j`} />
      <p>
        ニューラルネットワークの層は、ほぼこの計算(+ 非線形関数)の繰り返しです。パラメータの大半は、こうした行列の要素です。
      </p>

      <MatVecDemo />

      <h3>形(shape)の規則</h3>
      <p>
        行列積 <Tex tex="(m\times n)(n\times p)\to(m\times p)" /> では、<strong>内側の次元 n が一致</strong>している必要があります。
        shape のエラーはディープラーニングで最もよく出るバグの1つなので、各テンソルの shape を意識して読む癖をつけましょう。
      </p>
      <pre>{`import numpy as np
W = np.random.randn(3, 2)   # 3×2
x = np.random.randn(2)      # 長さ2
y = W @ x                   # 長さ3`}</pre>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'a = [1, 2, 3] と b = [4, 5, 6] の内積はいくつですか?',
      choices: ['15', '32', '21'],
      answer: 1,
      explanation: '1×4 + 2×5 + 3×6 = 4 + 10 + 18 = 32 です。',
    },
    {
      question: '3×2 行列 W と長さ2のベクトル x の積 Wx は、どんな形ですか?',
      choices: ['長さ2のベクトル', '長さ3のベクトル', '3×2 の行列'],
      answer: 1,
      explanation: '(3×2)(2) の内側の次元2が一致し、結果の長さは外側の3になります。',
    },
    {
      question: '行列積 AB が計算できるための条件はどれですか?',
      choices: [
        'A と B の行数が等しい',
        'A の列数と B の行数が等しい',
        'A と B がどちらも正方行列である',
      ],
      answer: 1,
      explanation: '内側の次元(A の列数と B の行数)が一致している必要があります。',
    },
  ],
}

export default content
