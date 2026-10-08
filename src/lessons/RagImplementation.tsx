import { useState } from 'react'
import { Slider } from '../components'
import type { LessonContent } from './types'

const doc = `返品・交換について。商品到着後14日以内で、未使用かつ付属品がそろっている場合に返品できます。お客様都合の返品の送料はお客様のご負担です。初期不良の場合は、送料当社負担で交換いたします。交換品の在庫がない場合は返金いたします。返金は、返品された商品の確認後、7営業日以内に、ご注文時の支払い方法で行います。セール品は返品の対象外です。`

function chunk(text: string, size: number, overlap: number) {
  const out: { start: number; text: string }[] = []
  const step = Math.max(1, size - overlap)
  for (let s = 0; s < text.length; s += step) {
    out.push({ start: s, text: text.slice(s, s + size) })
    if (s + size >= text.length) break
  }
  return out
}

function ChunkDemo() {
  const [size, setSize] = useState(80)
  const [overlap, setOverlap] = useState(20)
  const chunks = chunk(doc, size, Math.min(overlap, size - 10))
  return (
    <div className="demo">
      <h4>試す:チャンクの大きさと重なり</h4>
      <p className="muted">返品の規定を、チャンク(検索の単位)に分けます。大きさと重なりを変えて、文が途中で切れる様子を見てみましょう(実際は文字数ではなくトークン数で数えることが多い)。</p>
      <Slider label="チャンクの大きさ" value={size} min={30} max={200} step={10} onChange={setSize} format={(v) => `${v}字`} />
      <Slider label="重なり" value={overlap} min={0} max={60} step={5} onChange={setOverlap} format={(v) => `${v}字`} />
      <ol className="chunk-list">
        {chunks.map((c, i) => (
          <li key={i}>
            <span className="muted">チャンク {i + 1}</span>
            <div>{c.text}</div>
          </li>
        ))}
      </ol>
      <p className="muted">
        「セール品は返品の対象外」という大事な条件が、どのチャンクに入るかに注目してください。小さすぎると文脈が切れ、大きすぎると無関係な内容まで混ざります。重なりは、境目で切れた文を救います。
      </p>
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>RAG を「部品」に分ける</h3>
      <p>8-1 で見た RAG を、実装の部品に分けると次のようになります。</p>
      <table className="calc text">
        <thead><tr><th>段階</th><th>処理</th><th>主な判断</th></tr></thead>
        <tbody>
          <tr><td>取り込み(事前)</td><td>文書を読み込み、テキストを取り出す</td><td>PDF や HTML の扱い、不要部分の除去</td></tr>
          <tr><td></td><td>チャンクに分ける</td><td>大きさ、重なり、見出しや段落での区切り</td></tr>
          <tr><td></td><td>埋め込みを作り、索引に保存する</td><td>埋め込みモデル、ベクトルDB</td></tr>
          <tr><td>検索(質問のたび)</td><td>質問に近いチャンクを探す</td><td>ベクトル検索とキーワード検索の併用、件数</td></tr>
          <tr><td></td><td>並べ替える(再ランキング)</td><td>使うかどうか、最終的な件数</td></tr>
          <tr><td>生成</td><td>チャンクを根拠として渡して答えさせる</td><td>出典の示し方、資料にないときの振る舞い</td></tr>
        </tbody>
      </table>

      <h3>まず「本当に検索が必要か」を確かめる</h3>
      <p>
        資料の総量が小さければ(目安として 20万トークン、約500ページ以下)、検索せずに<strong>全部をプロンプトに入れる</strong>のが最も単純で確実です。
        プロンプトキャッシュ(11-3)を使えば、毎回の費用と待ち時間も抑えられます(Anthropic の記事 "Contextual Retrieval"、2024年9月)。
      </p>

      <h3>チャンク分割</h3>
      <ChunkDemo />
      <ul>
        <li>多くの場合、チャンクは数百トークン程度にする。</li>
        <li>機械的に文字数で切るより、見出しや段落など文書の構造で区切るほうが、意味のまとまりを保てる。</li>
        <li>チャンクには、出典(文書名、見出し、URL)を一緒に保存しておく。回答で根拠を示すのに使う。</li>
      </ul>

      <h3>埋め込みと検索</h3>
      <p>
        Anthropic は自社の埋め込みモデルを提供していません。公式ドキュメントでは、選択肢の1つとして Voyage AI のモデル(たとえば
        <code>voyage-4</code>)を紹介しています。文書には <code>input_type: "document"</code>、質問には <code>"query"</code> を指定すると、
        検索の精度が上がります。
      </p>
      <pre>{`// 文書のチャンクを埋め込みにする(Voyage AI の HTTP API の例)
const res = await fetch("https://ai.mongodb.com/v1/embeddings", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${process.env.VOYAGE_API_KEY}\`,
  },
  body: JSON.stringify({ input: chunks, model: "voyage-4", input_type: "document" }),
});
const { data } = await res.json(); // data[i].embedding が i 番目のチャンクのベクトル`}</pre>
      <ul>
        <li><strong>ベクトル検索</strong>は、言い換えや意味の近さに強いが、型番やエラーコードのような完全一致の語には弱いことがある。</li>
        <li><strong>キーワード検索</strong>(BM25 など)は、完全一致の語に強い。</li>
        <li>両方を組み合わせる<strong>ハイブリッド検索</strong>にすると、取りこぼしが減る。</li>
        <li>多めの候補を取り出してから、<strong>再ランキング</strong>のモデルで並べ替え、上位だけを使う方法も有効。</li>
      </ul>

      <h3>Contextual Retrieval:チャンクに文脈を足す</h3>
      <p>
        切り出したチャンクは、元の文書の文脈を失います(「この会社の売上は前期比3%増」の「この会社」がどこか分からない、など)。
        Anthropic の記事 "Contextual Retrieval" では、各チャンクの前に、文書全体から見たそのチャンクの位置づけを LLM で短く書き足してから、
        埋め込みとキーワードの索引を作る方法を紹介しています。
      </p>
      <table className="calc text">
        <thead><tr><th>方法(記事の評価、上位20件の検索失敗率)</th><th>失敗率</th></tr></thead>
        <tbody>
          <tr><td>通常の埋め込み</td><td>5.7%</td></tr>
          <tr><td>文脈を足した埋め込み</td><td>3.7%(35% 減)</td></tr>
          <tr><td>文脈を足した埋め込み + 文脈を足したキーワード検索</td><td>2.9%(49% 減)</td></tr>
          <tr><td>上記 + 再ランキング</td><td>1.9%(67% 減)</td></tr>
        </tbody>
      </table>

      <h3>検索を「ツール」にする</h3>
      <p>
        質問のたびに決まった手順で検索する代わりに、検索を<strong>ツール</strong>としてモデルに渡す方法もあります(Stage 10)。
        モデルが必要に応じて検索語を考え、結果が足りなければ言い換えて検索し直せます。複雑な質問に強い一方、呼び出し回数と費用は増えます。
      </p>
      <pre>{`{
  name: "search_docs",
  description: "社内の規定・マニュアルを検索する。規定や手続きについて答える前に必ず使う。" +
    "結果が見つからないときは、言い換えて最大2回まで検索し直す。",
  input_schema: {
    type: "object",
    properties: {
      query: { type: "string", description: "検索語。質問を短いキーワードにしたもの" },
      top_k: { type: "integer", description: "取得する件数(既定 5、最大 20)" },
    },
    required: ["query"],
  },
}`}</pre>

      <h3>品質を測る</h3>
      <ul>
        <li><strong>検索の評価</strong>:質問と「正解のチャンク」の組を用意し、上位 k 件に正解が入る割合(recall@k)を測る。生成より先に、検索の品質を確かめる。</li>
        <li><strong>回答の評価</strong>:根拠に忠実か、資料にないことを言っていないかを確かめる(12-1)。</li>
        <li>検索した文書の中の命令文には従わないよう、資料はデータとして扱う(8-1、12-2)。</li>
      </ul>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: '参照したい資料の総量が数十ページ程度しかない場合、最初に検討すべき方法はどれですか?',
      choices: [
        'ベクトルDBを使った本格的な RAG を構築する',
        '資料を全部プロンプトに入れ、プロンプトキャッシュを使う',
        'モデルをファインチューニングする',
      ],
      answer: 1,
      explanation: '小さな資料なら、全部を入れるのが最も単純で確実です。キャッシュで費用と時間も抑えられます。',
    },
    {
      question: 'キーワード検索とベクトル検索を組み合わせる(ハイブリッド検索)利点はどれですか?',
      choices: [
        '意味の近さと、型番などの完全一致の両方を拾え、取りこぼしが減る',
        '埋め込みモデルが不要になる',
        '検索が必ず1件で済む',
      ],
      answer: 0,
      explanation: 'それぞれの得意分野が違うため、組み合わせると取りこぼしが減ります。',
    },
    {
      question: 'RAG の品質を改善するとき、まず測るべきものの1つはどれですか?',
      choices: [
        '正解のチャンクが検索結果の上位に入る割合(recall@k)',
        '回答の文字数',
        'ベクトルの次元数',
      ],
      answer: 0,
      explanation: '必要な資料が取り出せていなければ、生成をいくら工夫しても良い回答になりません。',
    },
  ],
}

export default content
