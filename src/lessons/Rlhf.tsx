import { useState } from 'react'
import { Slider } from '../components'
import { Tex } from '../Tex'
import type { LessonContent } from './types'

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z))

function RewardDemo() {
  const [rA, setRA] = useState(1)
  const [rB, setRB] = useState(0)
  const [chosen, setChosen] = useState<'A' | 'B'>('A')
  const diff = chosen === 'A' ? rA - rB : rB - rA
  const p = sigmoid(diff)
  const loss = -Math.log(p)

  return (
    <div className="demo">
      <h4>デモ:報酬モデルの学習(比較ペアから)</h4>
      <p className="muted">
        プロンプトに対する応答AとBを人間が比べ、「良い方」を選んだとします。報酬モデルは各応答にスコアを付け、
        選ばれた方のスコアが高くなるように学習します。
      </p>
      <div className="row">
        人間が選んだ方:
        <label><input type="radio" name="rlhf-chosen" checked={chosen === 'A'} onChange={() => setChosen('A')} /> A</label>
        <label><input type="radio" name="rlhf-chosen" checked={chosen === 'B'} onChange={() => setChosen('B')} /> B</label>
      </div>
      <Slider label="Aのスコア r(A)" value={rA} min={-3} max={3} step={0.1} onChange={setRA} format={(v) => v.toFixed(1)} />
      <Slider label="Bのスコア r(B)" value={rB} min={-3} max={3} step={0.1} onChange={setRB} format={(v) => v.toFixed(1)} />
      <table className="calc">
        <tbody>
          <tr><td>モデルが「{chosen}が選ばれる」と予測する確率</td><td><strong>{(p * 100).toFixed(1)}%</strong></td></tr>
          <tr><td>損失 −log σ(r選択 − r非選択)</td><td><strong>{loss.toFixed(3)}</strong></td></tr>
        </tbody>
      </table>
      <p className="muted">
        選ばれた方のスコアが上回るほど損失は小さく、逆転していると大きくなります。
      </p>
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>「良い応答」は書くより比べる方が簡単</h3>
      <p>
        完璧なお手本を書くのは大変ですが、2つの応答を見比べて「こちらの方が良い」と選ぶのは比較的簡単です。
        この<strong>人間の好み(比較データ)</strong>を学習に使うのが、<strong>RLHF</strong>(人間のフィードバックによる強化学習)です。
      </p>

      <h3>RLHFの3段階(InstructGPT)</h3>
      <ol>
        <li><strong>SFT</strong>:お手本でファインチューニングする(7-1)。</li>
        <li><strong>報酬モデルの学習</strong>:プロンプトに対する複数の応答を人間がランク付けし、「人間が好みそうな応答に高いスコアを付ける」モデルを作る。</li>
        <li><strong>強化学習</strong>:モデル(方策)が応答を生成し、報酬モデルがスコアを付け、スコアが高くなるように方策を更新する(PPO など)。</li>
      </ol>

      <RewardDemo />

      <h3>強化学習のステップと KL ペナルティ</h3>
      <p>
        報酬を最大化するだけだと、報酬モデルの穴を突く不自然な応答にモデルが偏ります。そこで元のモデル(参照モデル)から
        離れすぎないように、<strong>KLペナルティ</strong>を加えます。
      </p>
      <Tex block tex={String.raw`\max_{\pi}\ \mathbb{E}\bigl[r(x,y)\bigr]-\beta\,\mathrm{KL}\!\bigl(\pi(\cdot\mid x)\,\|\,\pi_{\mathrm{ref}}(\cdot\mid x)\bigr)`} />
      <p><Tex tex={String.raw`\beta`} /> が大きいほど、元のモデルに近い範囲で調整します。</p>

      <h3>DPO:報酬モデルと強化学習を省く</h3>
      <p>
        <strong>DPO</strong>(Direct Preference Optimization、2023)は、比較データから、報酬モデルを別に作らず
        <strong>直接モデルを更新</strong>する手法です。「選ばれた応答の確率を上げ、選ばれなかった応答の確率を下げる」ような
        損失を、参照モデルとの比を使って設計します。実装が簡単で安定しやすいため、広く使われています。
      </p>

      <h3>人間以外のフィードバック</h3>
      <p>
        人間のラベリングはコストがかかります。そこで、AIが「ルール(憲法)」に沿って応答を評価する RLAIF や
        Constitutional AI(Anthropic, 2022)のように、AIのフィードバックを使う方法も使われています。
        数学やコードのように正誤を自動判定できる場合は、<strong>検証可能な報酬</strong>を使う強化学習も盛んです。
      </p>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'RLHF で報酬モデルは何を学習しますか?',
      choices: [
        '人間が好む応答に高いスコアを付けること',
        '新しいトークナイザ',
        'プロンプトの自動生成',
      ],
      answer: 0,
      explanation: '応答の比較データから、人間の好みを表すスコア関数を学習します。',
    },
    {
      question: '強化学習でKLペナルティを加える主な目的はどれですか?',
      choices: [
        '元のモデルから離れすぎて、報酬モデルの穴を突く応答になるのを防ぐ',
        '学習を高速化する',
        '語彙を増やす',
      ],
      answer: 0,
      explanation: '報酬だけを最大化すると、不自然だが高スコアな出力に偏る恐れがあります。',
    },
    {
      question: 'DPO の特徴として正しいものはどれですか?',
      choices: [
        '比較データから、報酬モデルを別に作らず直接モデルを更新する',
        '人間のデータが一切不要',
        '事前学習の代わりに使う',
      ],
      answer: 0,
      explanation: '選ばれた応答の確率を上げ、選ばれなかった応答の確率を下げる損失で直接学習します。',
    },
  ],
}

export default content
