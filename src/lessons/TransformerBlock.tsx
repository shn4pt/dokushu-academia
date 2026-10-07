import { useState } from 'react'
import { Tex } from '../Tex'
import type { LessonContent } from './types'

const DIMS = [256, 512, 768, 1024, 2048, 4096, 8192, 12288]

function fmt(n: number) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`
  return `${(n / 1e6).toFixed(0)}M`
}

function ParamDemo() {
  const [di, setDi] = useState(2)
  const [layers, setLayers] = useState(12)
  const d = DIMS[di]
  const attn = 4 * d * d
  const ffn = 8 * d * d
  const total = layers * (attn + ffn)

  return (
    <div className="demo">
      <h4>デモ:パラメータ数の見積もり</h4>
      <label className="row">
        隠れ次元 d = {d}
        <input type="range" min={0} max={DIMS.length - 1} value={di} onChange={(e) => setDi(Number(e.target.value))} />
      </label>
      <label className="row">
        層数 L = {layers}
        <input type="range" min={1} max={96} value={layers} onChange={(e) => setLayers(Number(e.target.value))} />
      </label>
      <p>
        1層あたり:Attention <strong>{fmt(attn)}</strong> + FFN <strong>{fmt(ffn)}</strong>
        <br />
        全体(埋め込み除く): <Tex tex={String.raw`12 L d^2`} /> ≈ <strong>{fmt(total)}</strong> パラメータ
      </p>
      <p className="muted">目安:d=768, L=12 → 約85M(GPT-2 small)/ d=12288, L=96 → 約174B(GPT-3級)</p>
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>Transformerブロックの構成</h3>
      <p>Transformerは、同じ形の<strong>ブロック</strong>を何層も積み重ねたものです。1ブロックは主に4つの要素から成ります。</p>
      <pre>{`入力 x
 ├─ LayerNorm → Multi-Head Self-Attention ─┐
 └──────────────── (+) 残差接続 ←──────────┘
 ├─ LayerNorm → FFN(2層のMLP) ────────────┐
 └──────────────── (+) 残差接続 ←──────────┘
出力 → 次のブロックへ`}</pre>

      <h3>1. Multi-Head Attention</h3>
      <p>
        Attentionを<strong>複数のヘッド</strong>で並列に実行し、結果を連結します。各ヘッドは別々のQ・K・Vの変換を持つため、
        「直前の語との関係」「文法的な対応」など、異なる種類の関係を同時に捉えられます。
      </p>

      <h3>2. FFN(フィードフォワード層)</h3>
      <p>
        各トークンのベクトルに、位置ごとに独立して同じ2層のMLPを適用します。次元を一度広げ(通常 4d)、活性化関数を通して
        元に戻します。トークン同士の情報の混合はAttention、トークン内部の変換はFFNが担当し、パラメータの約2/3はFFNにあります。
      </p>
      <Tex block tex={String.raw`\mathrm{FFN}(\mathbf{x}) = W_2\,\sigma(W_1 \mathbf{x} + \mathbf{b}_1) + \mathbf{b}_2`} />

      <h3>3. 残差接続</h3>
      <p>
        各サブ層の出力を入力に足します(<Tex tex={String.raw`\mathbf{x} + f(\mathbf{x})`} />)。層を深く重ねても、
        勾配が入力側まで素直に届くため、学習が安定します。
      </p>

      <h3>4. 正規化(LayerNorm)</h3>
      <p>
        ベクトルの平均と分散を揃えて、値のスケールが層を重ねるごとに暴れるのを防ぎます。現在のLLMでは、サブ層の前に
        置く方式(Pre-LN)や、より軽量なRMSNormがよく使われます。
      </p>

      <h3>全体像:積み重ねて最後に次トークンの確率へ</h3>
      <ol>
        <li>トークンID → 埋め込み + 位置情報</li>
        <li>Transformerブロックを L 層通す</li>
        <li>最後の位置のベクトルを語彙サイズ V の次元に線形変換し、softmaxで次トークンの確率分布にする</li>
      </ol>

      <ParamDemo />
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'Multi-Headにする利点はどれですか?',
      choices: [
        '異なる種類の関係を並列に捉えられる',
        'パラメータが必ず減る',
        '位置情報が不要になる',
      ],
      answer: 0,
      explanation: '各ヘッドが別々のQ・K・Vの変換を持ち、異なる観点でトークン間の関係を見ます。',
    },
    {
      question: '残差接続(x + f(x))の主な役割はどれですか?',
      choices: [
        '語彙を増やす',
        '深い層でも勾配が伝わりやすく、学習を安定させる',
        '推論を高速化する',
      ],
      answer: 1,
      explanation: '入力をそのまま出力へ足す近道があるため、勾配が深い層を通っても消えにくくなります。',
    },
    {
      question: 'FFN層の役割として最も近いものはどれですか?',
      choices: [
        'トークン同士の情報を混ぜる',
        '次元を位置ごとに独立して非線形変換する',
        'トークンをID列に分割する',
      ],
      answer: 1,
      explanation: 'トークン間の混合はAttention、各トークン内部の変換はFFNが担当します。',
    },
  ],
}

export default content
