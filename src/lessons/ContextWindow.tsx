import { useState } from 'react'
import { Slider } from '../components'
import type { LessonContent } from './types'

const PER_TOKEN = 2 * 32 * 4096 * 2 // KvCache.tsx と同じ7Bクラスの概算(バイト)
const BASE = 4096

const fmtN = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1024)}K` : String(n))
const fmtBig = (v: number) => (v >= 1e12 ? `${(v / 1e12).toFixed(1)}兆` : v >= 1e8 ? `${(v / 1e8).toFixed(1)}億` : `${(v / 1e4).toFixed(0)}万`)

function CostDemo() {
  const [k, setK] = useState(12)
  const n = 2 ** k
  const pairs = (n * n) / 2 // 因果マスクで参照する (位置, 位置) の組の概数
  const rel = pairs / ((BASE * BASE) / 2)

  return (
    <div className="demo">
      <h4>デモ:コンテキスト長を伸ばすコスト</h4>
      <Slider label="コンテキスト長" value={k} min={10} max={20} step={1} onChange={setK} format={(v) => `${fmtN(2 ** v)} トークン`} />
      <table className="calc">
        <tbody>
          <tr><td>Attentionで計算する組の数 ≈ n²/2</td><td><strong>{fmtBig(pairs)}</strong> 組(1層・1ヘッドあたり)</td></tr>
          <tr><td>4Kのときと比べた倍率</td><td><strong>{rel < 10 ? rel.toFixed(1) : Math.round(rel).toLocaleString()} 倍</strong></td></tr>
          <tr><td>KVキャッシュ(7Bクラス概算)</td><td><strong>{((n * PER_TOKEN) / 1e9).toFixed(1)} GB</strong>(1会話あたり)</td></tr>
        </tbody>
      </table>
      <p className="muted">長さが2倍になると、Attentionの計算は4倍、KVキャッシュは2倍になります。</p>
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>コンテキストウィンドウとは</h3>
      <p>
        モデルが1回の処理で扱える<strong>最大のトークン数</strong>(入力と出力の合計)です。この範囲の外にある内容は、
        モデルにとって存在しないのと同じです。会話が長くなって古い内容が「忘れられる」のは、ウィンドウに入りきらなくなって
        切り捨てられるからで、モデルが記憶を失うわけではありません。
      </p>
      <ul>
        <li>モデルは呼び出しの間で状態を持たない。会話履歴は、毎回あなた(アプリ)が入力に含めて渡している。</li>
        <li>入力にあるものがモデルの「作業記憶」。学習で得た知識(重み)とは別物。</li>
      </ul>

      <h3>なぜ無限に長くできないのか</h3>
      <ul>
        <li><strong>計算量</strong>:Attention は長さ n に対して n² で増える(4-2)。</li>
        <li><strong>メモリ</strong>:KVキャッシュが長さに比例して増える(6-2)。</li>
        <li><strong>学習</strong>:学習時に見た長さを超えると品質が落ちやすい(位置エンコーディングの課題、4-3)。長い文脈で追加学習をして伸ばす。</li>
      </ul>

      <CostDemo />

      <h3>長ければ長いほど良いとは限らない</h3>
      <p>
        長い入力の<strong>途中</strong>にある情報は、先頭や末尾にある情報より使われにくいことが報告されています
        (Liu et al., 2023, "Lost in the Middle")。程度はモデルによって異なりますが、
        重要な指示や情報は<strong>先頭か末尾</strong>に置く、不要な情報は入れない、といった工夫は今でも有効です。
      </p>

      <h3>使う側の考え方</h3>
      <ul>
        <li>入力が長いほど、コストと遅延(特にプリフィル)が増える。必要な情報だけを入れる。</li>
        <li>長い資料は、全部入れるのではなく、関連部分だけ検索して入れる(次のステージの RAG)。</li>
        <li>長い会話は、古い部分を要約に置き換えて、ウィンドウを節約する。</li>
      </ul>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: '会話が長くなって、モデルが古い内容を「忘れる」主な理由はどれですか?',
      choices: [
        'コンテキストウィンドウに収まらず、入力から切り捨てられるから',
        'モデルのパラメータが勝手に更新されるから',
        '古い内容は自動的に削除される仕様だから',
      ],
      answer: 0,
      explanation: 'モデルは呼び出しごとに状態を持たず、入力に入ったものだけを参照できます。',
    },
    {
      question: 'コンテキスト長が2倍になると、Attentionの計算量はおよそ何倍になりますか?',
      choices: ['2倍', '4倍', '8倍'],
      answer: 1,
      explanation: 'Attention は系列長 n の2乗に比例して増えるため、4倍です。',
    },
    {
      question: '長い入力のとき、重要な情報を置くのに適した位置はどこですか?',
      choices: ['先頭か末尾', '必ず中央', 'どこでも同じ'],
      answer: 0,
      explanation: '途中の情報は使われにくい傾向が報告されているため、先頭や末尾が安全です。',
    },
  ],
}

export default content
