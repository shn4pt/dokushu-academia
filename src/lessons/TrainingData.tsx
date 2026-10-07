import { useState } from 'react'
import type { LessonContent } from './types'

type Flag = 'dup' | 'spam' | 'pii' | 'short' | 'contam'
const docs: { text: string; flags: Flag[] }[] = [
  { text: '猫は哺乳類の一種で、世界中で飼われている。', flags: [] },
  { text: '猫は哺乳類の一種で、世界中で飼われている。', flags: ['dup'] },
  { text: 'クリック!今すぐ購入!!! 激安 激安 激安 激安', flags: ['spam'] },
  { text: '連絡先: 090-1234-5678 / taro@example.com', flags: ['pii'] },
  { text: 'TCP は信頼性のある通信を提供するプロトコルである。', flags: [] },
  { text: 'あ', flags: ['short'] },
  { text: 'def double(x): return x * 2  # 2倍にする関数', flags: [] },
  { text: '[評価用] Q: 2+2は? A: 4  (ベンチマークの問題文)', flags: ['contam'] },
]
const filters: { flag: Flag; label: string }[] = [
  { flag: 'dup', label: '重複除去' },
  { flag: 'spam', label: '品質フィルタ' },
  { flag: 'pii', label: '個人情報の除去' },
  { flag: 'short', label: '極端に短い文書の除去' },
  { flag: 'contam', label: 'ベンチマークの除外(汚染対策)' },
]
const reasonLabel = Object.fromEntries(filters.map((f) => [f.flag, f.label])) as Record<Flag, string>

function PipelineDemo() {
  const [on, setOn] = useState<Record<Flag, boolean>>({ dup: true, spam: true, pii: true, short: true, contam: true })
  const removed = (flags: Flag[]) => flags.filter((f) => on[f])
  const kept = docs.filter((d) => removed(d.flags).length === 0).length

  return (
    <div className="demo">
      <h4>デモ:データクリーニングのパイプライン</h4>
      <div className="row">
        {filters.map((f) => (
          <label key={f.flag}>
            <input type="checkbox" checked={on[f.flag]} onChange={(e) => setOn({ ...on, [f.flag]: e.target.checked })} /> {f.label}
          </label>
        ))}
      </div>
      <ul className="plain">
        {docs.map((d, i) => {
          const r = removed(d.flags)
          return (
            <li key={i} style={{ opacity: r.length ? 0.5 : 1 }}>
              <span style={{ textDecoration: r.length ? 'line-through' : 'none' }}>{d.text}</span>{' '}
              {r.map((f) => <span key={f} className="badge badge-doing">{reasonLabel[f]}</span>)}
            </li>
          )
        })}
      </ul>
      <p>残った文書: <strong>{kept} / {docs.length}</strong></p>
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>データがモデルの性格を決める</h3>
      <p>
        モデルの構造が同じでも、学習データが違えば別物になります。LLMの学習データは、Web上の文章(Common Crawl などのクロールデータ)、
        書籍、論文、コードなど、数兆トークン規模で集められます。ただし<strong>集めたそのままでは使えません</strong>。
      </p>

      <h3>主な前処理</h3>
      <ol>
        <li><strong>テキスト抽出</strong>:HTMLからメニューや広告を除いて本文だけを取り出す。言語を判定して振り分ける。</li>
        <li><strong>重複除去</strong>:完全一致だけでなく、ほぼ同じ文書(近似重複、MinHash など)も除く。重複が多いと丸暗記が起きやすく、学習効率も落ちる。</li>
        <li><strong>品質フィルタ</strong>:ルール(記号の割合、繰り返しの多さ)や、質の高い文章を判別する分類器で、スパムや意味のない文章を除く。</li>
        <li><strong>安全性・プライバシー</strong>:個人情報の削除またはマスク、有害コンテンツの扱いの方針に従った除外。</li>
        <li><strong>評価データの除外</strong>:ベンチマークの問題が学習データに混ざる「汚染」を取り除く。混ざると、評価が実力より高く出てしまう。</li>
        <li><strong>混合比の調整</strong>:Web、コード、書籍などを、どの割合で学習させるかを決める。</li>
      </ol>

      <PipelineDemo />

      <h3>量より質、だが量も必要</h3>
      <p>
        データのフィルタリングは、モデル性能に大きく効くことが知られています。一方、フィルタを強くしすぎると、
        多様性が失われたり、特定の言語や文化の文章が消えたりして、偏りが生じます。
      </p>

      <h3>著作権・ライセンスという課題</h3>
      <p>
        学習データの取り扱いには、著作権や利用規約などの法的・倫理的な問題が伴います。どのデータを使い、
        どう許諾を得るかは、組織ごとに方針が分かれ、法制度も国によって異なります。実際にモデルを使う側も、
        学習データの出所に関する情報(データカードなど)を確認することが大切です。
      </p>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: '学習データから重複を取り除く理由として適切なものはどれですか?',
      choices: [
        '丸暗記を減らし、学習効率を上げるため',
        '語彙サイズを減らすため',
        '推論を高速にするため',
      ],
      answer: 0,
      explanation: '同じ文章が何度も現れると、その文章を暗記しやすくなり、データの多様性も損なわれます。',
    },
    {
      question: '「ベンチマークの汚染」とは何ですか?',
      choices: [
        '評価用の問題が学習データに混ざっていること',
        '学習データに有害な文章が混ざっていること',
        'モデルの重みが壊れること',
      ],
      answer: 0,
      explanation: '評価問題を学習で見てしまうと、未知のデータでの実力を正しく測れなくなります。',
    },
    {
      question: 'フィルタリングを強くしすぎたときのリスクはどれですか?',
      choices: [
        'データの多様性が失われ、偏りが生じる',
        '学習が必ず速くなる',
        '語彙が増える',
      ],
      answer: 0,
      explanation: '一部の種類の文章を除きすぎると、特定の話題や言語の知識が不足します。',
    },
  ],
}

export default content
