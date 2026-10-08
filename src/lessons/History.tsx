import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { LessonContent } from './types'

type Event = { year: string; title: string; body: string; lesson?: string; era: string }

const eras = [
  { key: 'early', name: '黎明期(〜1980年代)' },
  { key: 'stat', name: '統計と再起(1990〜2000年代)' },
  { key: 'deep', name: '深層学習(2010年代前半)' },
  { key: 'tf', name: 'Transformer と規模(2017〜2021)' },
  { key: 'assist', name: 'アシスタントとエージェント(2022〜)' },
]

const events: Event[] = [
  { era: 'early', year: '1950', title: 'チューリングの「模倣ゲーム」', body: 'アラン・チューリングが論文で、「機械は考えることができるか」を、会話で人間と区別できるかという形で問い直した。' },
  { era: 'early', year: '1956', title: '「人工知能」という言葉', body: 'ダートマス会議で、人工知能(Artificial Intelligence)という研究分野が名付けられた。初期の主流は、人が書いたルールと記号の操作だった。' },
  { era: 'early', year: '1958', title: 'パーセプトロン', body: 'ローゼンブラットが、データから重みを学習する単純なニューロンのモデルを提案した。ニューラルネットワークの原型。', lesson: '2-1' },
  { era: 'early', year: '1966', title: 'ELIZA', body: 'ワイゼンバウムの対話プログラム。言葉のパターンを置き換えるだけのルールで、人と会話しているように見せた。理解はしていなかった。' },
  { era: 'early', year: '1969', title: 'パーセプトロンの限界', body: 'ミンスキーとパパートが、1層のパーセプトロンでは XOR のような単純な問題も解けないことを示した。ニューラルネットワークの研究は停滞した。', lesson: '2-2' },
  { era: 'early', year: '1986', title: '誤差逆伝播法の普及', body: 'ラメルハート、ヒントン、ウィリアムズが、多層のネットワークを誤差逆伝播で学習できることを示し、広く知られるようになった。層を重ねる道が開けた。', lesson: '2-3' },
  { era: 'stat', year: '1990年代', title: '統計的な言語処理', body: 'ルールを書く代わりに、大量のテキストから統計を取る方法が主流に。直前の数語から次の語の確率を数える n-gram 言語モデルが、音声認識や機械翻訳で使われた。', lesson: '3-3' },
  { era: 'stat', year: '1997', title: 'LSTM', body: 'ホッホライターとシュミットフーバーが、長い系列でも情報を保ちやすい RNN の改良版を提案した。のちに翻訳や音声認識で広く使われる。', lesson: '4-1' },
  { era: 'stat', year: '2003', title: 'ニューラル言語モデル', body: 'ベンジオらが、単語をベクトルで表し、ニューラルネットワークで次の単語の確率を予測する言語モデルを提案した。今の LLM の直接の祖先。', lesson: '3-2' },
  { era: 'deep', year: '2012', title: 'AlexNet と深層学習の躍進', body: 'GPU で学習した深いニューラルネットワークが、画像認識のコンテストで従来の方法を大きく上回った。データ・計算・深いネットワークの組み合わせが注目を集めた。' },
  { era: 'deep', year: '2013', title: 'word2vec', body: 'ミコロフらの方法で、大量のテキストから、意味の近さを反映した単語のベクトルを効率よく学習できるようになった。「王 − 男 + 女 ≒ 女王」の例が有名に。', lesson: '3-2' },
  { era: 'deep', year: '2014', title: '系列変換と attention', body: 'RNN で文を読み込み、別の文を生成する系列変換(seq2seq)が登場。続いてバダナウらが、翻訳中に入力のどこを見るかを学習する attention を提案した。', lesson: '4-1' },
  { era: 'tf', year: '2017', title: 'Transformer', body: '「Attention Is All You Need」。RNN を使わず attention だけで系列を処理する構造で、並列に計算できるため、大規模な学習が可能になった。', lesson: '4-2' },
  { era: 'tf', year: '2018', title: 'GPT と BERT', body: '大量のテキストで事前学習し、個別のタスクに合わせて調整する方法が広まった。OpenAI の GPT は次の単語の予測で、Google の BERT は穴埋めで事前学習した。', lesson: '5-1' },
  { era: 'tf', year: '2019', title: 'GPT-2', body: '15億パラメータの言語モデル。特定のタスク向けに学習していなくても、文章の続きを書く形で、要約や質問応答をある程度こなせることを示した。' },
  { era: 'tf', year: '2020', title: 'スケーリング則と GPT-3', body: 'モデルとデータと計算量を増やすと、損失が規則的に下がることが報告された。1750億パラメータの GPT-3 は、プロンプトに例を数個書くだけで新しいタスクをこなせた(few-shot)。', lesson: '5-3' },
  { era: 'assist', year: '2022', title: '指示に従うモデルと ChatGPT', body: '人間のフィードバックによる強化学習(RLHF)で、指示に従うよう調整した InstructGPT が発表された。11月に公開された ChatGPT で、対話型の AI が一気に広まった。', lesson: '7-2' },
  { era: 'assist', year: '2023', title: '多様な LLM の公開', body: 'GPT-4 や Claude などが公開され、長い文脈や画像の入力、ツールの呼び出しなど、アプリに組み込むための機能が API で提供されるようになった。', lesson: '9-1' },
  { era: 'assist', year: '2024', title: '考えてから答えるモデルと MCP', body: '答える前に時間をかけて考えることで、数学やプログラミングの性能を高めるモデルが登場した。11月には、AI アプリと外部のツールをつなぐ共通の方式として MCP が公開された。', lesson: '10-4' },
  { era: 'assist', year: '2025〜', title: 'エージェントの実用化', body: 'ツールを使い、自分で手順を考えながら、コードの修正や調査などの仕事を進めるエージェントが、実際の業務で使われ始めた。', lesson: '11-1' },
]

function Timeline() {
  const [era, setEra] = useState<string>('all')
  const shown = era === 'all' ? events : events.filter((e) => e.era === era)
  return (
    // 年表は読む教材そのものなので、デモ(.demo)ではなく本文として扱う(所要時間と検索の対象に含める)
    <div className="card timeline-box">
      <h4>見る:LLM までの年表</h4>
      <p className="muted">時代を選んで絞り込めます。リンクのあるできごとは、その考え方を詳しく扱うレッスンに移動できます。</p>
      <div className="row">
        <button className={era === 'all' ? '' : 'secondary'} onClick={() => setEra('all')}>すべて</button>
        {eras.map((e) => <button key={e.key} className={era === e.key ? '' : 'secondary'} onClick={() => setEra(e.key)}>{e.name}</button>)}
      </div>
      <ol className="timeline">
        {shown.map((e) => (
          <li key={e.year + e.title}>
            <span className="tl-year">{e.year}</span>
            <div className="tl-body">
              <strong>{e.title}</strong>
              <p>{e.body}</p>
              {e.lesson && <Link to={`/lesson/${e.lesson}`}>関連レッスン {e.lesson} →</Link>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>なぜ歴史を見るのか</h3>
      <p>
        LLM は、ある日突然生まれたものではありません。それぞれの時代に「何ができなかったのか」と「何がそれを破ったのか」を追うと、
        このコースで学ぶ部品が、なぜ今の形になっているのかが見えてきます。
      </p>

      <Timeline />

      <h3>流れを貫く、5つの転換</h3>
      <ol>
        <li>
          <strong>ルールを書く → データから学ぶ</strong>。人が規則を書く方法は、言葉の多様さに追いつけませんでした。
          データから確率や重みを学ぶ方法へと移ります(<Link to="/lesson/1-1">Stage 1</Link>)。
        </li>
        <li>
          <strong>特徴を人が設計する → 表現をモデルが学ぶ</strong>。単語をベクトルで表し、その中身まで学習させることで、意味の近さを扱えるようになりました
          (<Link to="/lesson/3-2">3-2 埋め込み</Link>)。層を重ねて学習できるようになったことも鍵でした(<Link to="/lesson/2-3">2-3 誤差逆伝播</Link>)。
        </li>
        <li>
          <strong>順番に読む → 必要な所を直接見る</strong>。RNN は文を1語ずつ読むため、長い文脈が苦手で、並列に計算できませんでした。
          attention と Transformer がこれを破り、巨大なモデルを学習できるようになりました(<Link to="/lesson/4-1">Stage 4</Link>)。
        </li>
        <li>
          <strong>タスクごとのモデル → 1つの大きなモデル</strong>。次の単語を当てる事前学習を、規模を大きくして行うと、
          さまざまなタスクを1つのモデルでこなせるようになりました(<Link to="/lesson/5-1">Stage 5</Link>)。
        </li>
        <li>
          <strong>文章の続きを書く → 指示に従い、行動する</strong>。事後学習で対話のアシスタントになり(<Link to="/lesson/7-1">Stage 7</Link>)、
          さらにツールを使って仕事を進めるエージェントへと広がっています(第2部)。
        </li>
      </ol>

      <h3>変わらないもの</h3>
      <p>
        これだけ発展しても、LLM の中心にあるのは「次のトークンの確率を計算する」という仕組みです。もっともらしい誤り(幻覚)、
        文脈の長さの制約、出力が毎回変わること。こうした性質は、この仕組みから来ています。仕組みを理解しておくと、新しいモデルや機能が出たときにも、
        何が変わり、何が変わらないのかを自分で判断できます。
      </p>
      <p className="muted">年は、論文や製品の公開年をもとにしています。人物や出来事は代表的なものに絞っており、ほかにも多くの研究者と成果があります。</p>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'Transformer(2017年)が、それ以前の RNN に比べて大規模な学習を可能にした主な理由はどれですか?',
      choices: [
        '文を1語ずつ順番に読むため',
        'attention で必要な所を直接参照し、並列に計算できるため',
        'ルールを人が書くため',
      ],
      answer: 1,
      explanation: '順番に読む必要がなくなり、GPU で並列に計算できるようになりました。',
    },
    {
      question: '2020年ごろに注目された「スケーリング則」が示したことはどれですか?',
      choices: [
        'モデルを大きくすると必ず性能が下がる',
        'モデル・データ・計算量を増やすと、損失が規則的に下がる',
        'データは少ないほどよい',
      ],
      answer: 1,
      explanation: '規模を大きくすると規則的に性能が上がることが、大型化の流れを後押ししました。',
    },
    {
      question: '2022年の ChatGPT につながった、指示に従わせるための主な技術はどれですか?',
      choices: ['n-gram 言語モデル', '人間のフィードバックによる強化学習(RLHF)などの事後学習', 'パーセプトロン'],
      answer: 1,
      explanation: '事前学習済みのモデルを、人の好みに合わせて調整することで、対話のアシスタントになりました。',
    },
  ],
}

export default content
