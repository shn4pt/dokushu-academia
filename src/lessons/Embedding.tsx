import { useState } from 'react'
import { Tex } from '../Tex'
import type { LessonContent } from './types'

// 3次元の手作りベクトル: [人らしさ, 性別, 王族性]
const words: Record<string, number[]> = {
  男: [1, 0.8, 0],
  女: [1, -0.8, 0],
  王: [1, 0.8, 1],
  女王: [1, -0.8, 1],
  りんご: [-1, 0, 0.1],
  みかん: [-1, 0.1, 0],
}
const names = Object.keys(words)

const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0)
const norm = (a: number[]) => Math.sqrt(dot(a, a))
const cosine = (a: number[], b: number[]) => dot(a, b) / (norm(a) * norm(b))

function SimilarityDemo() {
  const [target, setTarget] = useState('王')
  const ranked = names
    .filter((n) => n !== target)
    .map((n) => ({ n, sim: cosine(words[target], words[n]) }))
    .sort((a, b) => b.sim - a.sim)

  const analogy = words['王'].map((v, i) => v - words['男'][i] + words['女'][i])
  const analogyRank = names
    .filter((n) => !['王', '男', '女'].includes(n))
    .map((n) => ({ n, sim: cosine(analogy, words[n]) }))
    .sort((a, b) => b.sim - a.sim)

  return (
    <div className="demo">
      <h4>デモ:ベクトルの近さ(コサイン類似度)</h4>
      <p className="muted">
        3次元の手作りベクトルです(軸は「人らしさ」「性別」「王族性」)。実際のモデルでは数百〜数千次元で、
        軸の意味は人間には読めません。
      </p>
      <div className="row">
        {names.map((n) => (
          <button key={n} className={n === target ? '' : 'secondary'} onClick={() => setTarget(n)}>
            {n}
          </button>
        ))}
      </div>
      <p>
        <strong>{target}</strong> = [{words[target].join(', ')}] に近い順:
      </p>
      {ranked.map(({ n, sim }) => (
        <div key={n} className="attn-row sim-row">
          <span className="attn-token">{n}</span>
          <div className="bar-track" aria-hidden>
            <div className="bar-fill" style={{ width: `${Math.max(sim, 0) * 100}%` }} />
          </div>
          <span className="attn-weight">{sim.toFixed(2)}</span>
        </div>
      ))}
      <h4>ベクトルの演算</h4>
      <p>
        <Tex tex={String.raw`\vec{\text{王}} - \vec{\text{男}} + \vec{\text{女}}`} /> = [{analogy.join(', ')}] に最も近い語:
        <strong> {analogyRank[0].n}</strong>(類似度 {analogyRank[0].sim.toFixed(2)})
      </p>
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>IDは「ただの番号」</h3>
      <p>
        トークンIDは語彙表の通し番号にすぎず、数値の大小や近さに意味はありません(ID 100 と 101 が似た語とは限らない)。
        そこで、各IDを<strong>実数ベクトル</strong>に写してからモデルに入力します。これが<strong>埋め込み(embedding)</strong>です。
      </p>

      <h3>実体は大きな表(行列)</h3>
      <p>
        語彙サイズを <Tex tex="V" />、ベクトルの次元を <Tex tex="d" /> とすると、埋め込みは <Tex tex="V \times d" /> の行列です。
        トークンIDは「この行列の何行目を取り出すか」を指定するだけです。
      </p>
      <pre>{`embedding = W[token_id]   # W の shape は (V, d)`}</pre>
      <p>
        この行列の中身は最初ランダムで、他のパラメータと同じく<strong>学習で更新されます</strong>。
        次トークン予測を上手くこなすために有用な配置が、結果として獲得されます。
      </p>

      <h3>近いベクトル = 似た使われ方</h3>
      <p>
        学習の結果、似た文脈で使われる語は近いベクトルになります。近さの尺度にはよく
        <strong>コサイン類似度</strong>を使います。
      </p>
      <Tex block tex={String.raw`\cos(\mathbf{a},\mathbf{b}) = \frac{\mathbf{a}\cdot\mathbf{b}}{\|\mathbf{a}\|\,\|\mathbf{b}\|}`} />
      <p>向きが同じなら 1、直交なら 0、逆向きなら -1 です。</p>

      <SimilarityDemo />

      <h3>注意点</h3>
      <ul>
        <li>ここでの埋め込みは、文脈によらず語ごとに固定のベクトルです。Transformerの層を通ることで、文脈に応じたベクトルへ更新されていきます。</li>
        <li>デモの「王 − 男 + 女 ≒ 女王」は有名な例ですが、きれいに成り立つのは単純化した場合です。実際のモデルでは近似的にしか成り立ちません。</li>
      </ul>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: '語彙サイズ V、次元 d のとき、埋め込み行列の形はどれですか?',
      choices: ['d × d', 'V × d', 'V × V'],
      answer: 1,
      explanation: '語彙のトークン1つにつき d 次元のベクトルが1行あるため、V × d になります。',
    },
    {
      question: '埋め込みベクトルの値はどのように決まりますか?',
      choices: [
        '辞書から人間が1語ずつ設定する',
        '他のパラメータと同様に、学習によって更新される',
        'トークンIDの数値をそのまま使う',
      ],
      answer: 1,
      explanation: '初期値はランダムで、損失を減らす方向に勾配降下で更新されます。',
    },
    {
      question: '2つのベクトルが同じ向きのとき、コサイン類似度はいくつですか?',
      choices: ['1', '0', '-1'],
      answer: 0,
      explanation: '向きが一致すれば cos は 1、直交なら 0、逆向きなら -1 です。',
    },
  ],
}

export default content
