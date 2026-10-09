import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { LessonContent } from './types'

type Level = {
  key: string
  name: string
  flow: string[]
  human: string
  unit: string
  skill: string
  risk: string
}

const levels: Level[] = [
  {
    key: 'L1', name: 'L1 補完',
    flow: ['人がコードを書く', 'AI が次の数行を提案する', '人が採用・修正・却下する'],
    human: '書く人。提案を1つずつ取捨選択する', unit: '数行',
    skill: '提案を素早く読み、正しいかを判断する力',
    risk: '読まずに採用した誤りが、そのまま紛れ込む',
  },
  {
    key: 'L2', name: 'L2 対話支援',
    flow: ['人が質問・依頼する', 'AI が説明やコードを返す', '人が読んで、貼り付け、動かす'],
    human: '頼む人であり、組み込む人', unit: '関数・小さな部品',
    skill: '必要な文脈を渡し、返ってきたコードを検証する力',
    risk: '存在しない API や古い書き方を、そのまま使ってしまう',
  },
  {
    key: 'L3', name: 'L3 エージェント型(AI 駆動)',
    flow: ['人がタスクを依頼する', 'AI がコードを調べ、計画を立てる', '人が計画を確認する', 'AI が複数のファイルを編集し、テストを実行する', '人が差分をレビューする'],
    human: '依頼し、計画と差分をレビューする人', unit: 'タスク(数時間分の作業)',
    skill: 'タスクを分け、計画の良し悪しを見抜き、テストで確かめる力',
    risk: '大きな差分を十分に読まずに受け入れる。権限の与えすぎ',
  },
  {
    key: 'L4', name: 'L4 委任・非同期',
    flow: ['人が課題(issue)を書く', 'AI が別の環境で実装・テストする', 'AI が変更の提案(PR)を出す', 'CI と自動レビューが確かめる', '人がレビューしてマージする'],
    human: '課題を定義し、成果物をレビューする人', unit: '課題(issue)',
    skill: '検証できる形で課題を書き、レビューを回す仕組みを作る力',
    risk: 'レビューが追いつかない。CI が弱いと、誤りが通ってしまう',
  },
  {
    key: 'L5', name: 'L5 AI ネイティブ',
    flow: ['人が意図・制約・検証基準を定める', 'AI が実装・修正・保守のループを継続的に回す', '自動の検証(テスト・評価・監視)が判定する', '人は、リスクの高い変更と例外だけを判断する'],
    human: '意図と検証の仕組みを設計し、例外を扱う人', unit: '機能・システム',
    skill: '仕様と検証基準を設計し、自動化の仕組みを監督する力',
    risk: '誰もコードを理解していない状態になる。検証の穴が、そのまま本番の事故になる',
  },
]

function LevelExplorer() {
  const [key, setKey] = useState('L3')
  const lv = levels.find((l) => l.key === key)!
  return (
    <div className="demo">
      <h4>見る:5つの水準の進め方</h4>
      <p className="muted">水準を切り替えて、作業の流れと、人の役割の変化を比べてみましょう。</p>
      <div className="row">
        {levels.map((l) => (
          <button key={l.key} className={l.key === key ? '' : 'secondary'} onClick={() => setKey(l.key)}>{l.name}</button>
        ))}
      </div>
      <div className="flow" aria-label={`${lv.name} の作業の流れ`}>
        {lv.flow.map((f, i) => (
          <span key={i} className="flow-item">
            <span className={'flow-box' + (f.startsWith('人') ? ' human' : '')}>{f}</span>
            {i < lv.flow.length - 1 && <span className="flow-arrow" aria-hidden>↓</span>}
          </span>
        ))}
      </div>
      <table className="calc text">
        <tbody>
          <tr><td>人の役割</td><td>{lv.human}</td></tr>
          <tr><td>任せる単位</td><td>{lv.unit}</td></tr>
          <tr><td>必要になる力</td><td>{lv.skill}</td></tr>
          <tr><td>主なリスク</td><td>{lv.risk}</td></tr>
        </tbody>
      </table>
      <p className="muted">枠の色が濃い手順が、人が担う部分です。</p>
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>AI と開発の関わり方は、段階的に広がってきた</h3>
      <p>
        AI を使った開発は、エディタが次の数行を提案する「補完」から始まり、質問に答える「対話支援」、複数のファイルを自分で読み書きして
        テストまで実行する「エージェント型」、課題を渡すと変更の提案(PR)まで自走する「委任」へと広がってきました。
        この第3部では、この広がりを5つの水準に分けて整理し、<strong>どこまで、どのように進めていけばよいか</strong>を考えます。
      </p>

      <table className="calc text">
        <thead><tr><th>水準</th><th>AI がすること</th><th>人の役割</th><th>任せる単位</th></tr></thead>
        <tbody>
          {levels.map((l) => (
            <tr key={l.key}><td>{l.name}</td><td>{l.flow.filter((f) => f.startsWith('AI')).join('。')}</td><td>{l.human}</td><td>{l.unit}</td></tr>
          ))}
        </tbody>
      </table>

      <LevelExplorer />

      <h3>水準が上がると、人の仕事は「書く」から「決めて、確かめる」へ</h3>
      <p>
        水準が上がるほど、人がコードを書く量は減ります。代わりに増えるのは、<strong>何を作るかを明確に伝えること</strong>と、
        <strong>できたものが正しいかを確かめること</strong>です。L1 では1行ずつ確かめていたものが、L4 では PR 単位、L5 では仕組み全体で確かめることになります。
      </p>
      <p>
        つまり、任せる範囲を広げるほど、<strong>検証の仕組み</strong>(テスト、型、自動のチェック、レビューの体制)の重要性が増します。
        検証の仕組みが弱いまま任せる範囲を広げると、速く作れても、誤りも速く増えていきます。第3部を通した一番の軸は、この
        「<strong>検証できる範囲までしか、安全には任せられない</strong>」という考え方です。
      </p>

      <h3>第2部とのつながり</h3>
      <p>
        L3 以上で使われるコーディングエージェントは、第2部で学んだエージェントそのものです。ファイルの読み書きやコマンド実行という
        ツールを持ち(<Link to="/lesson/10-1">Stage 10</Link>)、調べて、計画して、実行するループを回し(<Link to="/lesson/11-2">11-2</Link>)、
        取り消しにくい操作には承認を求めます。第2部で学んだ「止める条件」「権限」「評価」の考え方は、AI に開発を任せるときにも、そのまま当てはまります。
      </p>

      <h3>この5つの水準は、このアプリの整理です</h3>
      <p>
        L1〜L5 は、このコースが「人の役割と、任せる単位がどう変わるか」で整理した枠組みで、<strong>業界で決まった標準の分類ではありません</strong>。
        似た発想の整理は、ほかにもあります。たとえば、自動運転の「運転自動化のレベル(レベル0〜5)」にならって、AI による開発を段階に分けたものが、いくつか提案されています。
        ダン・シャピロ(Dan Shapiro)の「The Five Levels」(2026年1月)は、レベル0「ちょっと賢い補完」から、レベル5「ダークファクトリー」(人がコードを読まずに、仕様からソフトウェアができあがる)までを分けています。
        学術的にも、AI を使った開発の自動化の度合いを分類する提案があります。
      </p>
      <table className="calc text">
        <thead><tr><th>このコースの水準</th><th>シャピロの整理との、おおまかな対応(このコースの解釈)</th></tr></thead>
        <tbody>
          <tr><td>L1 補完</td><td>レベル0(人がほぼすべて書く)</td></tr>
          <tr><td>L2 対話支援</td><td>レベル1〜2(個別の作業を頼む、ペアで進める)</td></tr>
          <tr><td>L3 エージェント型</td><td>レベル3(人は、計画と差分をレビューする)</td></tr>
          <tr><td>L4 委任・非同期</td><td>レベル4の前半(仕様や課題を渡し、成果物を確かめる)</td></tr>
          <tr><td>L5 AI ネイティブ</td><td>レベル4の後半〜5</td></tr>
        </tbody>
      </table>
      <ul>
        <li><strong>番号や境界は、整理によって違います。</strong>「複数のファイルを編集する」作業を、どの水準に置くかは、提案によって異なります。水準の名前を使うときは、どの整理に基づくかを書きます。</li>
        <li><strong>L5 の意味が違います。</strong>シャピロのレベル5は、人がコードを読まない状態です。このコースの L5 は、人が<strong>意図と検証の基準を設計し、リスクの高い変更と例外を判断する</strong>状態で、検証の仕組みを前提にしています(第3部の軸です)。</li>
        <li>水準は、<strong>成熟度の順位ではなく、作業ごとに選ぶもの</strong>です。上の対応表も、厳密なものではなく、考え方を比べるための目安です。</li>
      </ul>

      <h3>上の水準が、常に良いわけではない</h3>
      <p>
        L5 が最終的な正解で、すべての作業をそこに持っていけばよい、というわけではありません。リスクが高く、確かめにくい作業(認証の変更、
        お金の計算、データベースの移行など)は、低い水準で人が主導するほうが安全です。逆に、テストで確かめやすく、影響の小さい作業は、
        高い水準で任せられます。<strong>作業ごとに水準を選び分けること</strong>、そして<strong>検証の仕組みを育てて、任せられる範囲を少しずつ広げること</strong>が、
        目指す進化の形です(<Link to="/lesson/14-3">14-3</Link>)。
      </p>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'L3(エージェント型)で、人の主な役割はどれですか?',
      choices: [
        'すべてのコードを自分で書く',
        'タスクを依頼し、計画と差分をレビューする',
        '何もせず、結果をそのまま本番に出す',
      ],
      answer: 1,
      explanation: 'AI が調べて編集し、テストまで実行します。人は計画と差分を確かめます。',
    },
    {
      question: '任せる水準を上げるとき、最も重要性が増すものはどれですか?',
      choices: ['タイピングの速さ', '検証の仕組み(テスト、型、自動のチェック、レビュー)', 'エディタの見た目'],
      answer: 1,
      explanation: '人が1行ずつ確かめなくなる分、仕組みで正しさを確かめる必要があります。',
    },
    {
      question: '水準の選び方として適切なものはどれですか?',
      choices: [
        'すべての作業を最も高い水準で行う',
        '作業ごとに、リスクと検証のしやすさで選び分ける',
        'AI は使わないのが最も安全',
      ],
      answer: 1,
      explanation: '確かめやすく影響の小さい作業ほど高い水準で任せ、そうでない作業は人が主導します。',
    },
  ],
}

export default content
