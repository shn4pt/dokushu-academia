import { useState } from 'react'
import type { LessonContent } from './types'

type Pattern = { key: string; name: string; flow: string[]; what: string; when: string; example: string }

const patterns: Pattern[] = [
  {
    key: 'chain', name: 'プロンプトの連鎖', flow: ['入力', 'LLM ①', 'コードで確認', 'LLM ②', '出力'],
    what: '作業を決まった順の小さな手順に分け、前の出力を次の入力にする。間にコードによるチェックを挟める。',
    when: '作業がきれいに固定の手順に分けられるとき。速さを少し犠牲にして、各手順を簡単にし、正確さを上げる。',
    example: '問い合わせの要約 → 要約が規定の形式かをコードで確認 → 返信の下書きを作成',
  },
  {
    key: 'route', name: 'ルーティング', flow: ['入力', 'LLM で分類', '→ 担当A / 担当B / 担当C', '出力'],
    what: '入力を分類し、種類ごとに専用の処理(プロンプト、ツール、モデル)に振り分ける。',
    when: '入力の種類によって最適な処理が違い、その分類を正確にできるとき。',
    example: '請求の問い合わせ・技術的な質問・返品依頼を分類し、それぞれ専用の手順で処理する',
  },
  {
    key: 'parallel', name: '並列化', flow: ['入力', 'LLM ① ∥ LLM ② ∥ LLM ③', '結果をまとめる', '出力'],
    what: '複数の LLM 呼び出しを同時に行う。独立した部分を分担する「分割」と、同じ作業を複数回して多数決などをとる「投票」がある。',
    when: '分割して速くしたいとき、または複数の視点で確度を上げたいとき。',
    example: '回答の作成と、不適切な内容のチェックを、別々の呼び出しで同時に行う',
  },
  {
    key: 'orch', name: 'オーケストレーターとワーカー', flow: ['入力', '中心の LLM が分解', '→ ワーカー LLM × n(動的に)', '中心の LLM が統合', '出力'],
    what: '中心の LLM がその場で作業を分解し、ワーカーに割り振り、結果を統合する。',
    when: '必要な下位作業が、事前には決められないとき(例: 変更が必要なファイルの数が入力によって違う)。',
    example: '「この機能の影響を調べて」→ 関係する資料やコードの数に応じて調査を割り振り、まとめる',
  },
  {
    key: 'eval', name: '評価者と最適化者', flow: ['入力', 'LLM が作成', 'LLM が評価して指摘', '(合格まで繰り返す)', '出力'],
    what: '1つの LLM が作り、別の LLM が評価して指摘し、それを繰り返して改善する。',
    when: '評価の基準がはっきりしていて、指摘を受けて直すと実際に良くなるとき。',
    example: '翻訳を作成 → 原文との食い違いや不自然さを評価 → 修正、を基準を満たすまで繰り返す',
  },
  {
    key: 'agent', name: 'エージェント', flow: ['入力', 'LLM が考える', '⇄ ツールで行動・結果を観察', '(目的達成まで LLM 自身が判断)', '出力'],
    what: 'LLM 自身が、どのツールをどの順で使うかを決め、結果を見ながら目的まで進む。手順はコードで決まっていない。',
    when: '必要な手順の数や順番を事前に予測できない、自由度の高い課題。',
    example: '「この不具合を直して」→ 調査、再現、修正、テストを、状況を見ながら進める',
  },
]

function PatternExplorer() {
  const [key, setKey] = useState('chain')
  const p = patterns.find((x) => x.key === key)!
  return (
    <div className="demo">
      <h4>見る:5つのワークフローとエージェント</h4>
      <p className="muted">ボタンを押して、それぞれの処理の流れと、向いている場面を比べてみましょう。</p>
      <div className="row">
        {patterns.map((x) => (
          <button key={x.key} className={x.key === key ? '' : 'secondary'} onClick={() => setKey(x.key)}>{x.name}</button>
        ))}
      </div>
      <div className="flow" aria-label={`${p.name} の処理の流れ`}>
        {p.flow.map((f, i) => (
          <span key={i} className="flow-item">
            <span className="flow-box">{f}</span>
            {i < p.flow.length - 1 && <span className="flow-arrow" aria-hidden>↓</span>}
          </span>
        ))}
      </div>
      <table className="calc text">
        <tbody>
          <tr><td>しくみ</td><td>{p.what}</td></tr>
          <tr><td>向いている場面</td><td>{p.when}</td></tr>
          <tr><td>例(サポート業務)</td><td>{p.example}</td></tr>
        </tbody>
      </table>
    </div>
  )
}

const criteria = [
  { label: '複雑さ:作業に複数の手順があり、事前に手順を決めきれない', key: 'c' },
  { label: '価値:結果の価値が、増える費用と待ち時間に見合う', key: 'v' },
  { label: '実現性:モデルがその種類の作業を十分にこなせる', key: 'f' },
  { label: '誤りへの備え:誤りに気づいて、取り消し・修正できる(テスト、レビュー、元に戻す手段がある)', key: 'e' },
]

function AgentChecklist() {
  const [on, setOn] = useState<Record<string, boolean>>({})
  const yes = criteria.filter((c) => on[c.key]).length
  return (
    <div className="demo">
      <h4>判定:エージェントにすべきか</h4>
      <p className="muted">作りたい機能を1つ思い浮かべて、当てはまるものにチェックを入れてください。</p>
      {criteria.map((c) => (
        <label key={c.key} className="check-row">
          <input type="checkbox" checked={!!on[c.key]} onChange={(e) => setOn({ ...on, [c.key]: e.target.checked })} /> {c.label}
        </label>
      ))}
      <p role="status">
        <strong>
          {yes === criteria.length
            ? 'すべて満たしています。エージェントを検討する価値があります。まずは小さく作り、十分に試験してから広げましょう。'
            : `満たしていない条件があります(${criteria.length - yes}個)。1回の呼び出しか、ワークフローで作るほうが確実です。`}
        </strong>
      </p>
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>「エージェントを作る」前に</h3>
      <p>
        LLM を使ったシステムの多くは、エージェントでなくても作れます。Anthropic の記事 "Building effective agents"(2024年12月)は、
        次の2つを区別しています。
      </p>
      <ul>
        <li><strong>ワークフロー</strong>:LLM とツールを、<strong>コードで決めた手順</strong>どおりに組み合わせる。</li>
        <li><strong>エージェント</strong>:LLM が<strong>自分で</strong>、何をどの順で行うか、どのツールを使うかを決めながら進む。</li>
      </ul>
      <p>
        記事の主張は一貫して「<strong>できるだけ単純な方法から始め、必要になったときだけ複雑にする</strong>」です。多くの用途では、
        検索や例示で工夫した<strong>1回の LLM 呼び出し</strong>で十分です。エージェントは柔軟ですが、費用と待ち時間が増え、
        誤りが積み重なるリスクもあります。
      </p>

      <PatternExplorer />

      <h3>どれを選ぶか</h3>
      <ol>
        <li>まず、<strong>1回の呼び出し</strong>(プロンプト設計、構造化出力、必要なら検索)で解けないかを考える。</li>
        <li>手順が決まっているなら、<strong>ワークフロー</strong>で組む。各手順をテストしやすく、費用も予測しやすい。</li>
        <li>手順を事前に決められない自由度の高い課題で、下の4つの条件を満たすときに、<strong>エージェント</strong>を選ぶ。</li>
      </ol>

      <AgentChecklist />

      <h3>フレームワークとの付き合い方</h3>
      <p>
        エージェント用のフレームワークは、始めるのを楽にしてくれますが、プロンプトや応答が隠れて、問題の原因を追いにくくなることがあります。
        記事は、<strong>まず API を直接使う</strong>ことを勧めています(多くのパターンは数十行で書けます)。使う場合も、
        内部で何をしているかを理解しておきましょう。
      </p>

      <h3>エージェントを作るときの3つの原則</h3>
      <ol>
        <li><strong>設計を単純に保つ</strong>。</li>
        <li><strong>透明性を高める</strong>。エージェントの計画や途中の判断を、見える形にする。</li>
        <li><strong>ツールとの接点を丁寧に作る</strong>。ツールの説明と試験に十分な手間をかける(10-3)。</li>
      </ol>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'ワークフローとエージェントの違いとして正しいものはどれですか?',
      choices: [
        'ワークフローはコードで決めた手順で動き、エージェントは LLM が手順を自分で決める',
        'ワークフローはツールを使えない',
        'エージェントは LLM を使わない',
      ],
      answer: 0,
      explanation: '手順を決めるのがコードか LLM か、が両者の違いです。',
    },
    {
      question: '入力の種類(請求・技術・返品)ごとに専用の処理へ振り分けたいときに適したパターンはどれですか?',
      choices: ['評価者と最適化者', 'ルーティング', '並列化(投票)'],
      answer: 1,
      explanation: '分類して、種類ごとの専用の処理に振り分けるのがルーティングです。',
    },
    {
      question: 'Anthropic の記事が勧める進め方はどれですか?',
      choices: [
        '最初から高機能なマルチエージェントで作る',
        'できるだけ単純な方法から始め、必要なときだけ複雑にする',
        '必ずフレームワークを使う',
      ],
      answer: 1,
      explanation: '1回の呼び出しやワークフローで足りるなら、それが最も確実で安価です。',
    },
  ],
}

export default content
