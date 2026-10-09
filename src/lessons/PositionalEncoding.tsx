import { useState } from 'react'
import { Tex } from '../Tex'
import type { LessonContent } from './types'

const D = 16
const POSITIONS = 32

function pe(pos: number, i: number) {
  const k = Math.floor(i / 2)
  const angle = pos / Math.pow(10000, (2 * k) / D)
  return i % 2 === 0 ? Math.sin(angle) : Math.cos(angle)
}

function PeDemo() {
  const [pos, setPos] = useState(5)
  return (
    <div className="demo">
      <h4>デモ:正弦波位置エンコーディング(d = {D})</h4>
      <p className="muted">
        行が位置、列が次元です。青は正、赤は負の値。位置ごとに異なるパターンになり、左の次元ほど速く変化します。
      </p>
      <label className="row">
        位置 {pos}
        <input type="range" min={0} max={POSITIONS - 1} value={pos} onChange={(e) => setPos(Number(e.target.value))} />
      </label>
      <div className="heatmap" style={{ gridTemplateColumns: `repeat(${D}, 1fr)` }} role="img" aria-label="位置エンコーディングのヒートマップ">
        {Array.from({ length: POSITIONS }, (_, p) =>
          Array.from({ length: D }, (_, i) => {
            const v = pe(p, i)
            return (
              <div
                key={`${p}-${i}`}
                className={'heat-cell' + (p === pos ? ' sel' : '')}
                style={{ background: v >= 0 ? 'var(--accent)' : 'var(--danger)', opacity: 0.15 + Math.abs(v) * 0.85 }}
              />
            )
          }),
        )}
      </div>
      <p className="muted">
        位置 {pos} のベクトル: [{Array.from({ length: D }, (_, i) => pe(pos, i).toFixed(2)).join(', ')}]
      </p>
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>Attentionは語順を知らない</h3>
      <p>
        Self-Attentionは、トークンの集合に対する計算です。入力の順序を入れ替えても、出力が同じ順で入れ替わるだけで、
        「どれが先か」という情報は一切使われません。「犬が猫を追う」と「猫が犬を追う」を区別するには、
        位置の情報を別途与える必要があります。
      </p>

      <h3>基本的なやり方:位置ベクトルを足す</h3>
      <p>
        各位置に対応する<strong>位置ベクトル</strong>を用意し、埋め込みに足してから最初の層に入力します。
      </p>
      <Tex block tex={String.raw`\mathbf{h}_t^{(0)} = \mathbf{e}(x_t) + \mathbf{p}_t`} />

      <h3>位置ベクトルの作り方</h3>
      <ul>
        <li><strong>正弦波(オリジナルのTransformer)</strong>:周期の異なるsin/cosの組で位置を表す。学習不要で、見たことのない長さにも式を適用できる。</li>
        <li><strong>学習される位置埋め込み(GPT-2など)</strong>:位置ごとの行を持つ表をパラメータとして学習する。</li>
        <li><strong>相対位置方式(RoPE、ALiBiなど)</strong>:絶対位置ではなく、トークン間の距離をattentionに反映する。LLaMA をはじめ、多くの最近のLLMがRoPEを使っている。</li>
      </ul>
      <Tex block tex={String.raw`PE_{(pos,\,2k)}=\sin\!\left(\frac{pos}{10000^{2k/d}}\right),\quad PE_{(pos,\,2k+1)}=\cos\!\left(\frac{pos}{10000^{2k/d}}\right)`} />

      <PeDemo />

      <h3>長い文脈との関係</h3>
      <p>
        学習時より長い入力でも性能を保てるかは、位置の表し方に強く依存します。位置エンコーディングの工夫は、
        コンテキストウィンドウを伸ばす研究の中心的なテーマの1つです。
      </p>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: '位置エンコーディングが必要な理由はどれですか?',
      choices: [
        'Self-Attention自体は語順の情報を持たないため',
        '語彙を小さくするため',
        '計算量を減らすため',
      ],
      answer: 0,
      explanation: 'Attentionは入力順に依存しない計算なので、位置情報を別途与えないと語順を区別できません。',
    },
    {
      question: 'オリジナルのTransformerでは、位置ベクトルはどのように入力に反映されますか?',
      choices: [
        '埋め込みベクトルに足し合わせる',
        '埋め込みベクトルと掛け合わせて次元を増やす',
        'トークンIDの末尾に連結する',
      ],
      answer: 0,
      explanation: '位置ベクトルを埋め込みに加算してから、最初の層に入力します。',
    },
    {
      question: '正弦波の位置エンコーディングの特徴として正しいものはどれですか?',
      choices: [
        '位置ごとの値を学習で決める',
        '周期の異なるsin/cosで、位置ごとに異なるパターンを作る',
        '位置によらず常に同じベクトルになる',
      ],
      answer: 1,
      explanation: '次元ごとに周期の異なる波を使うことで、各位置が固有のパターンになります。',
    },
  ],
}

export default content
