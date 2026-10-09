import { useMemo, useState } from 'react'
import { Slider } from '../components'
import { Tex } from '../Tex'
import type { LessonContent } from './types'

const tokens = [
  { t: 'いい', logit: 3.0 },
  { t: '晴れ', logit: 2.2 },
  { t: '悪い', logit: 1.5 },
  { t: '雨', logit: 1.0 },
  { t: '猫', logit: -1.0 },
]

function softmax(z: number[]) {
  const m = Math.max(...z)
  const e = z.map((v) => Math.exp(v - m))
  const s = e.reduce((a, b) => a + b, 0)
  return e.map((v) => v / s)
}

function adjust(temp: number, topK: number, topP: number) {
  const probs = softmax(tokens.map((t) => t.logit / temp))
  const order = probs.map((_, i) => i).sort((a, b) => probs[b] - probs[a])
  let kept = order.slice(0, topK)
  const renorm = (idx: number[]) => {
    const s = idx.reduce((a, i) => a + probs[i], 0)
    return idx.map((i) => probs[i] / s)
  }
  let q = renorm(kept)
  let cum = 0
  const keep2: number[] = []
  for (let r = 0; r < kept.length; r++) {
    keep2.push(kept[r])
    cum += q[r]
    if (cum >= topP) break
  }
  kept = keep2
  q = renorm(kept)
  const out = tokens.map(() => 0)
  kept.forEach((i, r) => { out[i] = q[r] })
  return out
}

function SamplingDemo() {
  const [temp, setTemp] = useState(1)
  const [topK, setTopK] = useState(5)
  const [topP, setTopP] = useState(1)
  const [drawn, setDrawn] = useState<string[]>([])
  const dist = useMemo(() => adjust(temp, topK, topP), [temp, topK, topP])

  function draw(n: number) {
    const out = [...drawn]
    for (let k = 0; k < n; k++) {
      let r = Math.random()
      let i = 0
      for (; i < dist.length - 1; i++) {
        r -= dist[i]
        if (r < 0) break
      }
      while (dist[i] === 0 && i > 0) i--
      out.push(tokens[i].t)
    }
    setDrawn(out.slice(-30))
  }

  return (
    <div className="demo">
      <h4>デモ:「今日は天気が」の次のトークン</h4>
      <Slider label="temperature" value={temp} min={0.1} max={3} step={0.1} onChange={(v) => { setTemp(v); setDrawn([]) }} format={(v) => v.toFixed(1)} />
      <Slider label="top-k" value={topK} min={1} max={5} step={1} onChange={(v) => { setTopK(v); setDrawn([]) }} />
      <Slider label="top-p" value={topP} min={0.1} max={1} step={0.05} onChange={(v) => { setTopP(v); setDrawn([]) }} format={(v) => v.toFixed(2)} />
      {tokens.map((t, i) => (
        <div key={t.t} className="attn-row sim-row">
          <span className="attn-token">{t.t}</span>
          <div className="bar-track" aria-hidden><div className="bar-fill" style={{ width: `${dist[i] * 100}%` }} /></div>
          <span className="attn-weight">{(dist[i] * 100).toFixed(1)}%</span>
        </div>
      ))}
      <div className="row">
        <button onClick={() => draw(1)}>1回引く</button>
        <button onClick={() => draw(10)}>10回引く</button>
        <button className="secondary" onClick={() => setDrawn([])}>クリア</button>
      </div>
      <div className="token-row">{drawn.map((t, i) => <span key={i} className="token">{t}</span>)}</div>
      <p className="muted">temperature が低いほど最有力に集中し、高いほど平らになります。top-k=1 は常に最有力を選ぶ greedy 方式です。</p>
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>モデルは「分布」を出すだけ。選ぶのは別の仕事</h3>
      <p>
        言語モデルが返すのは次のトークンの確率分布です。そこから<strong>どう1つ選ぶか</strong>(デコード戦略)で、
        出力の性格が大きく変わります。
      </p>
      <ul>
        <li><strong>greedy</strong>:常に最も確率の高いトークンを選ぶ。決定的で安定するが、単調で繰り返しに陥りやすい。</li>
        <li><strong>サンプリング</strong>:確率に従ってランダムに選ぶ。多様になるが、低確率の変なトークンを引くリスクがある。</li>
      </ul>

      <h3>temperature</h3>
      <p>softmax の前にロジットを温度 <Tex tex="T" /> で割ります。</p>
      <Tex block tex={String.raw`p_i=\frac{\exp(z_i/T)}{\sum_j\exp(z_j/T)}`} />
      <ul>
        <li><Tex tex="T<1" />:分布が尖る(自信のある選択肢により集中)。<Tex tex="T\to0" /> で greedy に近づく。</li>
        <li><Tex tex="T>1" />:分布が平らになる(多様だが乱れやすい)。</li>
      </ul>

      <h3>top-k と top-p(nucleus)</h3>
      <ul>
        <li><strong>top-k</strong>:確率上位 k 個だけを残して、再正規化する。</li>
        <li><strong>top-p</strong>:確率の高い順に足していき、累積が p に達するまでの最小集合を残す。分布の形に応じて候補数が変わる。</li>
      </ul>

      <SamplingDemo />

      <h3>使い分けの目安</h3>
      <ul>
        <li>事実に基づく回答、コード、抽出など:temperature を低め(0に近く)にする。</li>
        <li>アイデア出しや創作:temperature を上げる、または top-p を併用する。</li>
        <li>API によっては temperature=0 でも完全に決定的とは限らない(並列計算の浮動小数点の誤差など)。</li>
        <li>新しいモデルでは、API で temperature を指定できないことがある(Claude API では、Claude Opus 4.6 より後に公開されたモデルは、temperature を設定できない)。使えるかどうかは、使うモデルの最新のドキュメントで確かめる。</li>
      </ul>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'temperature を下げる(0に近づける)と、出力はどうなりますか?',
      choices: [
        '確率の高いトークンに集中し、より決定的になる',
        '確率が均等に近づく',
        '語彙が小さくなる',
      ],
      answer: 0,
      explanation: 'ロジットを小さな T で割ると分布が尖り、greedy に近づきます。',
    },
    {
      question: 'top-p(nucleus)サンプリングの説明として正しいものはどれですか?',
      choices: [
        '確率の高い順に累積確率が p に達するまでの候補から選ぶ',
        '常に上位 p 個の候補から選ぶ',
        '確率が p より小さい候補だけから選ぶ',
      ],
      answer: 0,
      explanation: '分布の形に応じて候補数が変わるのが top-k との違いです。',
    },
    {
      question: 'greedy デコードの特徴はどれですか?',
      choices: [
        '毎回ランダムに選ぶ',
        '常に最高確率のトークンを選ぶため、同じ入力なら同じ出力になりやすい',
        '低確率のトークンを優先して選ぶ',
      ],
      answer: 1,
      explanation: '決定的ですが、単調で繰り返しに陥りやすいという欠点があります。',
    },
  ],
}

export default content
