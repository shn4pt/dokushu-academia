import { useState } from 'react'
import { Link } from 'react-router-dom'
import { findLesson, lessonNo, stageLabel, stages } from '../data/curriculum'
import { formatMinutes, lessonMinutes } from '../time'
import type { LessonContent } from './types'

// ---- 1. 次のトークンを選ぶ体験(模式) ----
const dists: Record<string, [string, number][]> = {
  '日本の首都は': [['東京', 0.91], ['京都', 0.04], ['どこ', 0.03], ['、', 0.02]],
  '日本の首都は東京': [['です', 0.71], ['。', 0.22], ['で', 0.07]],
  '日本の首都は京都': [['では', 0.55], ['だった', 0.4], ['です', 0.05]],
  '日本の首都はどこ': [['でしょう', 0.6], ['ですか', 0.4]],
  '日本の首都は、': [['東京', 0.95], ['京都', 0.05]],
}

function NextTokenMini() {
  const [text, setText] = useState('日本の首都は')
  const dist = dists[text]
  return (
    <div className="demo">
      <h4>体験:LLM は「次の1トークン」を選び続ける</h4>
      <p className="muted">確率の付いた候補から1つ選ぶと、文の末尾に足されて、また次の候補が出ます(確率は説明用の模式的な値です)。</p>
      <p className="mono next-text">{text}</p>
      {dist ? (
        dist.map(([t, p]) => (
          <div key={t} className="attn-row sim-row">
            <button className="secondary" onClick={() => setText(text + t)}>{t}</button>
            <div className="bar-track" aria-hidden><div className="bar-fill" style={{ width: `${p * 100}%` }} /></div>
            <span className="attn-weight">{Math.round(p * 100)}%</span>
          </div>
        ))
      ) : (
        <p className="muted">(実際の LLM は、この繰り返しを、終わりのトークンが選ばれるまで続けます)</p>
      )}
      <button className="secondary" onClick={() => setText('日本の首都は')}>最初から</button>
    </div>
  )
}

// ---- 2. 概念の地図 ----
type Node = { id: string; label: string; lesson: string; pre: string[] }
const nodes: Node[] = [
  { id: 'vec', label: 'ベクトルと内積', lesson: '0-1', pre: [] },
  { id: 'mat', label: '行列積', lesson: '0-1', pre: [] },
  { id: 'prob', label: '確率分布', lesson: '0-2', pre: [] },
  { id: 'grad', label: '微分と勾配', lesson: '0-3', pre: [] },
  { id: 'loss', label: '損失関数', lesson: '1-1', pre: ['prob'] },
  { id: 'gd', label: '勾配降下法', lesson: '1-2', pre: ['grad', 'loss'] },
  { id: 'layer', label: 'ニューロンと層', lesson: '2-1', pre: ['mat'] },
  { id: 'softmax', label: '活性化関数と softmax', lesson: '2-2', pre: ['prob'] },
  { id: 'bp', label: '誤差逆伝播', lesson: '2-3', pre: ['grad', 'layer'] },
  { id: 'token', label: 'トークン化', lesson: '3-1', pre: [] },
  { id: 'emb', label: '埋め込み', lesson: '3-2', pre: ['vec', 'token'] },
  { id: 'lm', label: '言語モデル', lesson: '3-3', pre: ['prob', 'token'] },
  { id: 'attn', label: 'Self-Attention', lesson: '4-2', pre: ['vec', 'mat', 'softmax', 'emb'] },
  { id: 'pos', label: '位置エンコーディング', lesson: '4-3', pre: ['emb'] },
  { id: 'block', label: 'Transformer ブロック', lesson: '4-4', pre: ['attn', 'layer', 'pos'] },
  { id: 'pretrain', label: '事前学習', lesson: '5-1', pre: ['lm', 'gd', 'bp', 'block'] },
  { id: 'scaling', label: 'スケーリング則', lesson: '5-3', pre: ['pretrain'] },
  { id: 'sampling', label: 'サンプリング', lesson: '6-1', pre: ['lm', 'softmax'] },
  { id: 'kv', label: 'KV キャッシュ', lesson: '6-2', pre: ['attn'] },
  { id: 'ctx', label: 'コンテキストウィンドウ', lesson: '6-3', pre: ['attn', 'kv'] },
  { id: 'sft', label: '教師ありファインチューニング', lesson: '7-1', pre: ['pretrain'] },
  { id: 'rlhf', label: 'RLHF', lesson: '7-2', pre: ['sft'] },
  { id: 'api', label: 'メッセージ API', lesson: '9-1', pre: ['sampling', 'ctx', 'rlhf'] },
  { id: 'structured', label: '構造化出力', lesson: '9-4', pre: ['api'] },
  { id: 'tools', label: 'ツール利用', lesson: '10-1', pre: ['api', 'structured'] },
  { id: 'loop', label: 'エージェントループ', lesson: '11-2', pre: ['tools'] },
  { id: 'rag', label: 'RAG', lesson: '11-4', pre: ['emb', 'tools'] },
  { id: 'ctxmgmt', label: 'コンテキストの管理', lesson: '11-3', pre: ['ctx', 'loop'] },
  { id: 'eval', label: 'エージェントの評価', lesson: '12-1', pre: ['loop'] },
  { id: 'security', label: 'セキュリティ', lesson: '12-2', pre: ['tools'] },
]
const byId = new Map(nodes.map((n) => [n.id, n]))
const order = (a: Node, b: Node) => nodes.indexOf(a) - nodes.indexOf(b)

function ancestors(id: string, acc = new Set<string>()): Set<string> {
  for (const p of byId.get(id)!.pre) {
    if (!acc.has(p)) {
      acc.add(p)
      ancestors(p, acc)
    }
  }
  return acc
}
function descendants(id: string): Node[] {
  return nodes.filter((n) => n.id !== id && ancestors(n.id).has(id))
}

function Chip({ n }: { n: Node }) {
  return <Link className="concept-chip" to={`/lesson/${n.lesson}`}>{n.label} <span className="muted">{n.lesson}</span></Link>
}

function ConceptMap() {
  const [sel, setSel] = useState('attn')
  const node = byId.get(sel)!
  const pre = [...ancestors(sel)].map((id) => byId.get(id)!).sort(order)
  const post = descendants(sel).sort(order)
  return (
    <div className="demo">
      <h4>見る:概念の地図</h4>
      <p className="muted">概念を1つ選ぶと、それを支えている知識と、それを使う先の内容が分かります。チップを押すと、そのレッスンに移動します。</p>
      <label className="field">
        <span className="muted">概念を選ぶ</span>
        <select className="sel-input" value={sel} onChange={(e) => setSel(e.target.value)}>
          {nodes.map((n) => <option key={n.id} value={n.id}>{n.lesson} {n.label}</option>)}
        </select>
      </label>
      <div className="concept-center"><Chip n={node} /></div>
      <p><strong>支えている知識</strong>({pre.length})</p>
      <div className="chip-wrap">{pre.length ? pre.map((n) => <Chip key={n.id} n={n} />) : <span className="muted">(土台となる概念です)</span>}</div>
      <p><strong>これを使う先の内容</strong>({post.length})</p>
      <div className="chip-wrap">{post.length ? post.map((n) => <Chip key={n.id} n={n} />) : <span className="muted">(応用の到達点です)</span>}</div>
    </div>
  )
}

// ---- 3. 目的に応じた進み方 ----
const routes = [
  {
    key: 'all',
    name: '仕組みから一通り理解する',
    desc: '序論のあと、Stage 0 から順に進みます。第1部で LLM の内部を、第2部で作り方を学びます。',
    lessons: stages.flatMap((s) => s.lessons.map((l) => l.id)),
  },
  {
    key: 'agent',
    name: '早くエージェントを作りたい',
    desc: '第1部からは、API を使ううえで直接効く内容だけを選びます。第2部を一通り終えたら、気になったところを第1部に戻って学ぶのがおすすめです。',
    lessons: ['i-1', 'i-2', '3-1', '3-3', '4-1', '6-1', '6-3', '7-1', '8-1', '8-2', '8-3', '9-1', '9-2', '9-3', '9-4', '10-1', '10-2', '10-3', '10-4', '11-1', '11-2', '11-3', '11-4', '11-5', '12-1', '12-2', '12-3', '13-1', '13-2', '13-3'],
  },
  {
    key: 'inside',
    name: 'LLM の仕組みだけを知りたい',
    desc: '第1部(Stage 0〜8)だけを進みます。数学に自信があれば、Stage 0 は飛ばして構いません。',
    lessons: stages.filter((s) => ['intro', 's0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'].includes(s.id)).flatMap((s) => s.lessons.map((l) => l.id)),
  },
]

function RoutePicker() {
  const [key, setKey] = useState('agent')
  const r = routes.find((x) => x.key === key)!
  const total = r.lessons.reduce((sum, id) => sum + lessonMinutes(id), 0)
  return (
    <div className="demo">
      <h4>選ぶ:目的に応じた進み方</h4>
      <div className="row">
        {routes.map((x) => <button key={x.key} className={x.key === key ? '' : 'secondary'} onClick={() => setKey(x.key)}>{x.name}</button>)}
      </div>
      <p>{r.desc}</p>
      <p className="muted">{r.lessons.length} レッスン ・ 学習時間の目安 {formatMinutes(total, true)}</p>
      <ol className="route-list">
        {r.lessons.map((id) => {
          const l = findLesson(id)
          return l ? <li key={id}><Link to={`/lesson/${id}`}>{lessonNo(l)} {l.title}</Link></li> : null
        })}
      </ol>
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>LLM がしていることを、一言で</h3>
      <p>
        LLM(大規模言語モデル)がしていることは、驚くほど単純です。<strong>それまでの文章を読んで、次に来るトークン(単語の断片)の確率を計算し、
        1つ選んで足す</strong>。これを繰り返して、文章を作ります。
      </p>
      <NextTokenMini />
      <p>
        この単純な仕組みで、なぜ質問に答えたり、コードを書いたり、ツールを使って仕事をこなしたりできるのか。それを、
        中身(第1部)と使い方(第2部)の両面から理解するのが、このコースの目的です。
      </p>

      <h3>1つの応答ができるまで</h3>
      <p>あなたが質問を送ってから応答が返るまでに、次のことが起きています。それぞれ、このコースのどこで学ぶかを添えました。</p>
      <ol>
        <li><strong>文章をトークンに分け、番号にする</strong>(<Link to="/lesson/3-1">3-1 トークン化</Link>)</li>
        <li><strong>番号をベクトルに変える</strong>(<Link to="/lesson/3-2">3-2 埋め込み</Link>)。ここからは、ベクトルと行列の計算(<Link to="/lesson/0-1">Stage 0</Link>)の世界です。</li>
        <li>
          <strong>Transformer の層を何十回も通す</strong>。各層で、トークンどうしが互いを参照して情報を混ぜ合わせる
          (<Link to="/lesson/4-2">4-2 Self-Attention</Link>、<Link to="/lesson/4-4">4-4 Transformer ブロック</Link>)。
        </li>
        <li><strong>次のトークンの確率分布を出す</strong>(<Link to="/lesson/3-3">3-3 言語モデル</Link>、<Link to="/lesson/2-2">2-2 softmax</Link>)</li>
        <li><strong>確率に従って1つ選び、末尾に足して繰り返す</strong>(<Link to="/lesson/6-1">6-1 サンプリング</Link>、<Link to="/lesson/6-2">6-2 KV キャッシュ</Link>)</li>
      </ol>
      <p>
        では、層の中の膨大な数値(パラメータ)は、どう決まったのでしょうか。大量のテキストで「次のトークンを当てる」練習をして、
        当たるように少しずつ調整したのです(<Link to="/lesson/5-1">Stage 5 事前学習</Link>)。調整の方法は、機械学習の基本
        (<Link to="/lesson/1-1">Stage 1</Link>)と、ニューラルネットワークの学習(<Link to="/lesson/2-1">Stage 2</Link>)そのものです。
        さらに、質問に答えるアシスタントとして振る舞うよう、追加で調整されています(<Link to="/lesson/7-1">Stage 7 事後学習</Link>)。
      </p>
      <p>
        そして第2部では、この LLM を API で呼び出し(<Link to="/lesson/9-1">Stage 9</Link>)、ツールを持たせ(<Link to="/lesson/10-1">Stage 10</Link>)、
        自分で手順を考えて仕事を進めるエージェントに組み立て(<Link to="/lesson/11-1">Stage 11</Link>)、品質と安全を確かめます(<Link to="/lesson/12-1">Stage 12</Link>)。
      </p>

      <ConceptMap />

      <h3>各ステージが答える問い</h3>
      <table className="calc text">
        <thead><tr><th>ステージ</th><th>なぜ学ぶのか</th></tr></thead>
        <tbody>
          {stages.filter((s) => s.id !== 'intro').map((s) => (
            <tr key={s.id}>
              <td><Link to={`/stage/${s.id}`}>{stageLabel(s)}</Link><span className="muted block">{s.title}</span></td>
              <td>{s.why}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted">各ステージの詳細ページにも、そのステージの知識を使う先のレッスンを載せています。</p>

      <h3>このコースの進め方</h3>
      <RoutePicker />
      <ul>
        <li>各レッスンの最後のクイズで、理解を確かめられます。間違えた問題は「復習」に溜まります。</li>
        <li>読んでいた位置は自動で記録され、ホームの「続きから学ぶ」で再開できます。</li>
        <li>第2部では、自分の Claude API のキーを設定すると、実際にモデルを呼び出して試せます(なくても、用意した例で学べます)。</li>
      </ul>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'LLM が文章を作るしくみを最も簡単に言うと、どれですか?',
      choices: [
        'あらかじめ用意された答えの中から検索する',
        'それまでの文章から次のトークンの確率を計算し、1つ選んで足すことを繰り返す',
        '文法のルールを組み合わせて文を組み立てる',
      ],
      answer: 1,
      explanation: '次のトークンの予測を繰り返すのが基本です。この単純な仕組みの中身と使い方を、コース全体で学びます。',
    },
    {
      question: 'Stage 0 で学ぶベクトルと内積は、LLM のどこで使われますか?',
      choices: ['埋め込みや Self-Attention の計算', 'API キーの管理', 'ロードマップの表示'],
      answer: 0,
      explanation: 'トークンはベクトルとして表され、Self-Attention はベクトルの内積でトークンどうしの関係を計算します。',
    },
    {
      question: 'LLM の内部のパラメータは、主にどのように決まりましたか?',
      choices: [
        '人間が1つずつ手で設定した',
        '大量のテキストで次のトークンを当てる練習をし、当たるように少しずつ調整した',
        'ランダムな値のまま使われている',
      ],
      answer: 1,
      explanation: '事前学習で、損失を下げる方向にパラメータを調整して決まります(Stage 1、2、5)。',
    },
  ],
}

export default content
