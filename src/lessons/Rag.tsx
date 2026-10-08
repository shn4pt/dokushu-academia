import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Slider } from '../components'
import type { LessonContent } from './types'

const docs = [
  'KVキャッシュは、過去のトークンのKeyとValueを保存して、生成時の再計算を避ける仕組みである。',
  '温度(temperature)を下げると出力が決定的になり、上げると多様になる。',
  'トークン化では、頻出するペアを結合するBPEがよく使われる。',
  'RLHFは人間の比較データから報酬モデルを学習し、強化学習でモデルを調整する。',
  'Transformerのself-attentionは、Query、Key、Valueから重み付き和を計算する。',
]

const bigrams = (s: string) => {
  const t = s.replace(/[\s、。?!?!(),()]/g, '').toLowerCase()
  const out = new Set<string>()
  for (let i = 0; i < t.length - 1; i++) out.add(t.slice(i, i + 2))
  return out
}

function score(query: string, doc: string) {
  const q = bigrams(query)
  if (q.size === 0) return 0
  const d = bigrams(doc)
  let hit = 0
  q.forEach((g) => { if (d.has(g)) hit++ })
  return hit / q.size
}

function RagDemo() {
  const [query, setQuery] = useState('KVキャッシュとは何ですか')
  const [k, setK] = useState(2)
  const ranked = docs
    .map((text, i) => ({ text, i, s: score(query, text) }))
    .sort((a, b) => b.s - a.s)
  const top = ranked.slice(0, k).filter((r) => r.s > 0)

  return (
    <div className="demo">
      <h4>デモ:検索して、プロンプトに差し込む</h4>
      <p className="muted">
        ここでは検索を「質問と文書で共通する2文字の組の割合」で代用しています。実際のRAGでは、
        埋め込み(3-2)のベクトル類似度による検索が使われます。
      </p>
      <input className="text-input" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="質問" />
      <Slider label="取り出す件数 k" value={k} min={1} max={3} step={1} onChange={setK} />
      <table className="calc">
        <thead><tr><th>文書</th><th>類似度</th></tr></thead>
        <tbody>
          {ranked.map((r, rank) => (
            <tr key={r.i} style={{ opacity: rank < k && r.s > 0 ? 1 : 0.45 }}>
              <td style={{ textAlign: 'left' }}>{r.text}</td>
              <td>{r.s.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p><strong>モデルに渡すプロンプト:</strong></p>
      <pre>{`以下の資料だけを根拠に質問に答えてください。資料にない場合は「わかりません」と答えてください。

${top.length ? top.map((r, i) => `[資料${i + 1}] ${r.text}`).join('\n') : '(該当する資料なし)'}

質問: ${query}`}</pre>
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>モデルの知識だけでは足りない場面</h3>
      <ul>
        <li><strong>最新の情報</strong>:学習データの時点より後のことは知らない。</li>
        <li><strong>非公開の情報</strong>:社内文書や個人のデータは学習していない。</li>
        <li><strong>正確さが必要な情報</strong>:細かな数値や固有名詞は、重みの中ではあいまいに圧縮されている。</li>
      </ul>
      <p>
        かといって、毎回すべての資料を入力に入れるのは、コンテキスト長(6-3)とコストの面で現実的ではありません。
      </p>

      <h3>RAG(検索拡張生成)</h3>
      <p>
        質問に関係のある文書だけを<strong>検索して取り出し、プロンプトに差し込んで</strong>から、モデルに答えさせる方法です。
        Retrieval-Augmented Generation の略です。
      </p>
      <ol>
        <li><strong>準備</strong>:文書を適切な大きさ(チャンク)に分割し、それぞれを埋め込みベクトルにしてインデックスに保存する。</li>
        <li><strong>検索</strong>:質問も埋め込みにして、類似度の高いチャンクを上位 k 件取り出す。</li>
        <li><strong>生成</strong>:取り出したチャンクを根拠として、質問とともにモデルに渡す。</li>
      </ol>

      <RagDemo />

      <h3>うまくいかないときの原因</h3>
      <ul>
        <li><strong>検索の失敗</strong>:必要な文書が上位に出てこない。表現が違う(同義語)、チャンクの切り方が悪い、など。生成の品質は検索の品質で頭打ちになる。</li>
        <li><strong>情報の取りこぼし</strong>:関連する情報が複数の文書に散らばっている。</li>
        <li><strong>モデルが資料を無視する</strong>:資料に書いてあることより、学習済みの知識を優先して答えてしまう。「資料の範囲で答える」ことを指示する。</li>
        <li><strong>プロンプトインジェクション</strong>:検索した文書の中に、指示を装った文が含まれている。文書は「データ」であり「命令」ではないものとして扱う。</li>
      </ul>

      <h3>他の方法との使い分け</h3>
      <ul>
        <li><strong>RAG</strong>:知識の追加・更新が頻繁。出典を示したい。</li>
        <li><strong>ファインチューニング</strong>:口調・形式・振る舞いを変えたい(知識の注入には不向きな場合が多い)。</li>
        <li><strong>長いコンテキストに全部入れる</strong>:文書が少なく、収まる場合は最も単純。</li>
      </ul>
      <div className="card bridge">
        <strong>第2部で実装する</strong>
        <p>
          チャンク分割、埋め込み、ハイブリッド検索、再ランキングなど、RAG の実装は <Link to="/lesson/11-4">11-4 RAG の実装</Link> で扱います。
          検索をツールとしてエージェントに渡す方法は <Link to="/lesson/10-1">Stage 10</Link> から学べます。
        </p>
      </div>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'RAG の基本的な流れとして正しいものはどれですか?',
      choices: [
        '関連文書を検索し、プロンプトに差し込んでから生成する',
        '文書をすべてモデルに再学習させてから生成する',
        'モデルの出力を後から検索する',
      ],
      answer: 0,
      explanation: '再学習ではなく、検索結果を入力に加えることで、モデルに最新・非公開の情報を渡します。',
    },
    {
      question: 'RAG の回答品質が低いとき、まず疑うべきことの1つはどれですか?',
      choices: [
        '必要な文書が検索で取り出せているか',
        'GPUの種類',
        'ブラウザの設定',
      ],
      answer: 0,
      explanation: '生成の品質は検索の品質に左右されるので、取り出された文書を確認するのが第一歩です。',
    },
    {
      question: '検索で取り出した文書の取り扱いとして適切なものはどれですか?',
      choices: [
        '文書内の指示にも従う',
        '文書はデータとして扱い、そこに書かれた指示には従わない',
        '常に最初の文書だけを使う',
      ],
      answer: 1,
      explanation: '文書に悪意ある指示が含まれている可能性があるため、命令として扱ってはいけません。',
    },
  ],
}

export default content
