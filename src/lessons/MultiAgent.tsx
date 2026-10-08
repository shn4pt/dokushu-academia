import { useState } from 'react'
import { Slider } from '../components'
import type { LessonContent } from './types'

function CostDemo() {
  const [chat, setChat] = useState(5000)
  const rows = [
    { label: '1回のチャット', mult: 1 },
    { label: '単体のエージェント(約4倍)', mult: 4 },
    { label: 'マルチエージェント(約15倍)', mult: 15 },
  ]
  // Opus 5.5 の料金で、入力:出力 = 4:1 と仮定した概算
  const usd = (tokens: number) => ((tokens * 0.8 * 4 + tokens * 0.2 * 20) / 1_000_000).toFixed(3)
  return (
    <div className="demo">
      <h4>試す:トークン数の目安</h4>
      <p className="muted">
        Anthropic の報告(2025年6月)では、エージェントはチャットの約4倍、マルチエージェントは約15倍のトークンを使いました。
        1回のチャットの量を変えて、規模感をつかみましょう(費用は Opus 5.5、入力:出力 = 4:1 と仮定した概算)。
      </p>
      <Slider label="1回のチャットのトークン数" value={chat} min={1000} max={20000} step={1000} onChange={setChat} format={(v) => v.toLocaleString()} />
      {rows.map((r) => (
        <div key={r.label} className="attn-row sim-row cost-row">
          <span className="attn-token">{r.label}</span>
          <div className="bar-track" aria-hidden><div className="bar-fill" style={{ width: `${(r.mult / 15) * 100}%` }} /></div>
          <span className="attn-weight">{(chat * r.mult).toLocaleString()} / ${usd(chat * r.mult)}</span>
        </div>
      ))}
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>マルチエージェントとは</h3>
      <p>
        複数のエージェントが役割を分担して1つの仕事をこなす構成です。代表的なのは、11-1 の<strong>オーケストレーターとワーカー</strong>の形で、
        中心のエージェント(リード)が計画を立て、下位のエージェント(サブエージェント)に調査などを任せ、結果を統合します。
      </p>
      <p>
        Anthropic は、自社のリサーチ機能の作り方を記事 "How we built our multi-agent research system"(2025年6月)で公開しています。
        リードのエージェントが調査を分解し、複数のサブエージェントが<strong>並列に</strong>検索し、それぞれが<strong>自分のコンテキスト</strong>で
        調べた要点だけを返す構成です。社内の評価では、単体のエージェントに比べて90.2% 高い性能を示しました(リードに Claude Opus 4、サブエージェントに Claude Sonnet 4 を使った、当時の比較です)。
      </p>

      <h3>なぜ効くのか</h3>
      <ul>
        <li><strong>並列化</strong>:独立した調査を同時に進められる。記事では、複雑な調査の時間が最大9割短縮された。</li>
        <li><strong>コンテキストの分離</strong>:大量の資料を読むのはサブエージェントで、リードには要点だけが届く。リードの作業机(11-3)が散らからない。</li>
        <li><strong>トークンを多く使える</strong>:記事の分析では、性能の差の大部分が、使ったトークンの量で説明できた。言い換えれば、性能を費用で買っている面がある。</li>
      </ul>

      <CostDemo />

      <h3>向いていない場面</h3>
      <ul>
        <li><strong>価値が費用に見合わない作業</strong>:トークンが何倍にもなるので、結果の価値が高い仕事に限る。</li>
        <li><strong>全員が同じ文脈を共有する必要がある作業</strong>:分担すると、前提の食い違いが起きやすい。</li>
        <li><strong>作業どうしの依存が強い作業</strong>:記事では、多くのコーディング作業は、調査に比べて並列にできる部分が少ないとしている。</li>
      </ul>
      <p>まずは単体のエージェントで作り、並列にできる幅広い調査などで限界が見えたときに検討するのが現実的です。</p>

      <h3>サブエージェントへの任せ方</h3>
      <p>記事では、任せ方があいまいだと、作業の重複や取りこぼしが起きたと報告されています。サブエージェントには、次を明確に渡します。</p>
      <ol>
        <li><strong>目的</strong>:何を明らかにしてほしいか。</li>
        <li><strong>出力の形式</strong>:何を、どんな形で返してほしいか。</li>
        <li><strong>使うツールと情報源の指針</strong>。</li>
        <li><strong>範囲</strong>:どこまでやるか、何はしなくてよいか。</li>
      </ol>
      <p>
        実装上は、「サブエージェントを呼ぶ」ツールをリードに渡すのが分かりやすい形です。ツールの中で別の会話(独自の system とツール、
        独自の履歴)としてループを回し、最後の要約だけを <code>tool_result</code> として返します。サブエージェントには、より安価なモデルを
        使うこともできます(モデルを途中で切り替えるとキャッシュが効かなくなるため、別の会話として分けるのが合っています)。
      </p>
      <pre>{`// リードに渡すツール(概念を示すコード)
{
  name: "delegate_research",
  description: "独立した調査を1つ、サブエージェントに任せる。互いに独立した調査が複数あるときは、まとめて並列に呼ぶ。",
  input_schema: {
    type: "object",
    properties: {
      objective: { type: "string", description: "明らかにしてほしいこと" },
      output_format: { type: "string", description: "返してほしい形式(例: 箇条書き5点以内、出典URL付き)" },
      scope: { type: "string", description: "調べる範囲と、調べなくてよいこと" },
    },
    required: ["objective", "output_format", "scope"],
  },
}
// runTool の中で、別の system・ツール・履歴でループを回し、最後の要約だけを返す`}</pre>

      <h3>評価のしかた</h3>
      <ul>
        <li><strong>小さく始める</strong>:記事では、初期は約20件の実際の質問で十分に改善の効果を確かめられた。</li>
        <li><strong>LLM による採点</strong>:事実の正確さ、出典の正確さ、網羅性、情報源の質、ツールの効率などを基準にした採点が、人の評価と近かった。</li>
        <li><strong>人による確認</strong>:質の低いサイトを優先して使うなど、自動の評価では見落とす問題を人が見つけた。</li>
        <li><strong>過程より結果</strong>:途中の手順が毎回違っても、最終的な結果や状態で評価する。</li>
      </ul>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'マルチエージェントが効果を発揮しやすい作業はどれですか?',
      choices: [
        '互いに独立した調査を、幅広く並列に進める作業',
        '全員が同じ文脈を常に共有する必要がある作業',
        '1回の短い質問への回答',
      ],
      answer: 0,
      explanation: '並列にでき、それぞれのコンテキストを分けられる幅広い調査に向いています。',
    },
    {
      question: 'Anthropic の報告で、マルチエージェントはチャットのおよそ何倍のトークンを使いましたか?',
      choices: ['約1.5倍', '約4倍', '約15倍'],
      answer: 2,
      explanation: 'エージェントは約4倍、マルチエージェントは約15倍でした。価値の高い仕事に限って使う理由です。',
    },
    {
      question: 'サブエージェントに作業を任せるとき、明確に渡すべきものはどれですか?',
      choices: [
        '目的、出力の形式、ツールの指針、範囲',
        'リードのコンテキストのすべて',
        'APIキー',
      ],
      answer: 0,
      explanation: 'あいまいな依頼は、作業の重複や取りこぼしにつながります。',
    },
  ],
}

export default content
