import { useState } from 'react'
import { Slider } from '../components'
import { Tex } from '../Tex'
import type { LessonContent } from './types'

// 7Bクラス(32層、隠れ次元4096、Multi-Head Attention、fp16)を想定した概算
const LAYERS = 32
const D_MODEL = 4096
const BYTES = 2
const PER_TOKEN = 2 * LAYERS * D_MODEL * BYTES // K と V

const fmtBytes = (b: number) => (b >= 1e9 ? `${(b / 1e9).toFixed(1)} GB` : `${(b / 1e6).toFixed(0)} MB`)

function KvDemo() {
  const [p, setP] = useState(1000)
  const [g, setG] = useState(500)
  const without = g * p + (g * (g - 1)) / 2
  const withCache = p + g - 1

  return (
    <div className="demo">
      <h4>デモ:キャッシュの有無で、処理するトークン数がどう変わるか</h4>
      <Slider label="入力(プロンプト)長" value={p} min={100} max={8000} step={100} onChange={setP} />
      <Slider label="生成するトークン数" value={g} min={10} max={2000} step={10} onChange={setG} />
      <table className="calc">
        <thead><tr><th></th><th>処理するトークンの延べ数</th></tr></thead>
        <tbody>
          <tr><td>キャッシュなし(毎回、全体を再計算)</td><td>{without.toLocaleString()}</td></tr>
          <tr><td>キャッシュあり</td><td>{withCache.toLocaleString()}</td></tr>
          <tr><td>削減</td><td><strong>約 {(without / withCache).toFixed(0)} 倍</strong></td></tr>
        </tbody>
      </table>
      <p>
        代償として、KVキャッシュのメモリ: 1トークンあたり {(PER_TOKEN / 1e6).toFixed(2)} MB、
        この条件({p + g} トークン)で <strong>{fmtBytes(PER_TOKEN * (p + g))}</strong>
      </p>
      <p className="muted">
        7Bクラス(32層・隠れ次元4096・fp16、全ヘッドでK/Vを持つ構成)を想定した概算です。リクエスト数(同時に処理する会話数)ぶん、さらに増えます。
      </p>
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>生成は1トークンずつ。ここに無駄がある</h3>
      <p>
        テキストの生成は、1トークン出力しては末尾に足し、また全体を入力して次を出す、の繰り返しです。素朴に実装すると、
        そのたびに過去のトークンすべてについて、Attention の Key と Value を再計算することになります。
        しかし、<strong>過去のトークンの K と V は、新しいトークンが増えても変わりません</strong>(因果マスクがあるため)。
      </p>

      <h3>KVキャッシュ</h3>
      <p>
        そこで、各層で計算済みの K と V をメモリに保存しておき、新しいトークンでは<strong>そのトークン分の Q・K・V だけ</strong>を
        計算します。新しい Q が、保存済みのすべての K・V を参照して attention を計算します。
      </p>
      <pre>{`# 生成のループ(概念コード)
cache = {}                     # 層ごとの K, V を保存
logits = model(prompt, cache)  # プリフィル: プロンプト全体を一度に処理
for _ in range(max_new_tokens):
    token = sample(logits[-1])
    logits = model([token], cache)   # デコード: 新トークン1つだけ処理
`}</pre>
      <Tex block tex={String.raw`\text{KVキャッシュのサイズ}=2\times L\times n\times d_{\text{kv}}\times \text{バイト数}`} />
      <p><Tex tex="L" />:層数、<Tex tex="n" />:トークン数、<Tex tex="d_{\text{kv}}" />:K(V)ベクトルの全ヘッド合計の次元数。先頭の2は K と V の2種類を表します。</p>

      <KvDemo />

      <h3>プリフィルとデコード</h3>
      <ul>
        <li><strong>プリフィル</strong>(プロンプトの処理):全トークンを並列に処理できるため、計算が主なコスト。</li>
        <li><strong>デコード</strong>(1トークンずつ生成):毎回、重みとKVキャッシュをメモリから読むため、<strong>メモリ帯域</strong>がボトルネックになりやすい。</li>
      </ul>

      <h3>キャッシュを小さくする工夫</h3>
      <ul>
        <li><strong>GQA / MQA</strong>:複数のQヘッドでK・Vヘッドを共有し、キャッシュを数分の一にする。</li>
        <li><strong>量子化</strong>:キャッシュを低精度(8ビットなど)で保存する。</li>
        <li><strong>プロンプトキャッシュ</strong>:共通の先頭部分(システムプロンプトなど)のKVを、複数のリクエストで使い回す。</li>
      </ul>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'KVキャッシュに保存されるのは何ですか?',
      choices: [
        '過去のトークンの各層の Key と Value',
        '生成済みのテキスト',
        'モデルの重みのコピー',
      ],
      answer: 0,
      explanation: '過去トークンの K・V は変わらないので、保存して再利用します。',
    },
    {
      question: 'KVキャッシュを使う主な利点はどれですか?',
      choices: [
        '生成時に過去のトークンの再計算を避けられる',
        'モデルのパラメータ数が減る',
        'メモリ使用量が減る',
      ],
      answer: 0,
      explanation: '計算は大きく減りますが、代わりにキャッシュぶんのメモリを使います。',
    },
    {
      question: 'KVキャッシュのメモリ量が増える要因として適切でないものはどれですか?',
      choices: ['コンテキストが長くなる', '層数が多い', '語彙サイズが小さい'],
      answer: 2,
      explanation: 'キャッシュは層数、トークン数、K・Vの次元に比例します。語彙サイズは直接は関係しません。',
    },
  ],
}

export default content
