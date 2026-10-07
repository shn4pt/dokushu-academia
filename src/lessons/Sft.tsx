import { useState } from 'react'
import { Tex } from '../Tex'
import type { LessonContent } from './types'

// 説明用の例。実際のチャットテンプレートはモデルごとに異なる。
const conv = [
  { t: '<|user|>', role: 'special' },
  { t: '東京の', role: 'user' },
  { t: '人口は', role: 'user' },
  { t: '?', role: 'user' },
  { t: '<|assistant|>', role: 'special' },
  { t: '約', role: 'assistant' },
  { t: '1400', role: 'assistant' },
  { t: '万人', role: 'assistant' },
  { t: 'です', role: 'assistant' },
  { t: '。', role: 'assistant' },
  { t: '<|end|>', role: 'assistantEnd' },
] as const

function MaskDemo() {
  const [showMask, setShowMask] = useState(true)
  const counted = (r: string) => r === 'assistant' || r === 'assistantEnd'
  return (
    <div className="demo">
      <h4>デモ:SFTでは「どのトークンに損失をかけるか」を選ぶ</h4>
      <label>
        <input type="checkbox" checked={showMask} onChange={(e) => setShowMask(e.target.checked)} /> 損失の対象を色で表示
      </label>
      <div className="token-row" style={{ margin: '12px 0' }}>
        {conv.map((c, i) => (
          <span
            key={i}
            className={'token' + (showMask && counted(c.role) ? ' merged' : '')}
            style={showMask && !counted(c.role) ? { opacity: 0.45 } : undefined}
          >
            {c.t}
          </span>
        ))}
      </div>
      <p className="muted">
        色付き=損失の対象(アシスタントの応答と終了トークン)。薄い部分は入力として読むだけで、損失には含めません。
        このトークン列は説明用の例で、実際のテンプレートはモデルごとに異なります。
      </p>
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>事前学習しただけのモデルは「続きを書く」だけ</h3>
      <p>
        事前学習済みモデル(ベースモデル)は、与えられた文章の続きを予測します。「東京の人口は?」と入力すると、
        答えずに、質問を並べた続きを書き始めるかもしれません。ネット上には、質問が並ぶ文書も存在するからです。
        ここから<strong>指示に従って答える</strong>モデルにするのが<strong>事後学習</strong>で、その最初の段階が
        <strong>教師ありファインチューニング(SFT)</strong>です。
      </p>

      <h3>SFT:お手本を見せて学習する</h3>
      <p>
        「指示(プロンプト)」と「望ましい応答」のペアを多数用意し、事前学習と同じ次トークン予測で追加学習します。
        用意するデータは、人間が書いたお手本や、人間が確認・修正したデータ、他のモデルが生成して選別したデータなどです。
      </p>
      <Tex block tex={String.raw`L_{\mathrm{SFT}}=-\sum_{t\in\text{応答}}\log P_\theta\!\left(y_t\mid x,\,y_{<t}\right)`} />
      <p>事前学習との違いは、<strong>損失を応答部分にだけかける</strong>点です。指示部分は条件として読むだけです。</p>

      <MaskDemo />

      <h3>データ量は少なくてよい?</h3>
      <p>
        事前学習の数兆トークンに比べ、SFTのデータは数千〜数百万件と桁違いに小さくて済みます。知識自体は事前学習で
        ほぼ獲得されており、SFTは「質問されたら答える」という<strong>振る舞いの型</strong>を教えるのが主な役割と考えられているためです
        (LIMA 論文などが、少量でも質が高ければ効果があることを示しました)。ただし、品質の低いデータが混ざると、
        その振る舞いを学習してしまうので、<strong>量より質</strong>が重要です。
      </p>

      <h3>SFTの限界</h3>
      <ul>
        <li>お手本を<strong>真似る</strong>学習なので、お手本を超える応答は学べない。</li>
        <li>「良い応答」の書き方は無数にあり、1つのお手本が唯一の正解ではない。</li>
        <li>知らないことを聞かれても、お手本のように自信を持って答える癖がつくと、幻覚を助長することがある。</li>
      </ul>
      <p>
        次のレッスンでは、「どちらの応答が良いか」という<strong>比較</strong>から学習する方法を見ます。
      </p>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'SFT でモデルが学ぶ主な内容はどれですか?',
      choices: [
        '指示に対して、お手本のように応答する振る舞い',
        '新しい言語の語彙',
        'Webの最新ニュース',
      ],
      answer: 0,
      explanation: '知識の大半は事前学習で得ており、SFTは応答の型を教える段階です。',
    },
    {
      question: 'SFT で損失をかける範囲はどこですか?',
      choices: ['入力と応答の全部', '応答部分だけ', 'プロンプト部分だけ'],
      answer: 1,
      explanation: '指示は条件として読むだけで、応答トークンの予測に損失をかけます。',
    },
    {
      question: 'SFT データについて重要なのはどれですか?',
      choices: [
        '量さえ多ければ質は問わない',
        '量より質が重要',
        '必ず事前学習より多くなければならない',
      ],
      answer: 1,
      explanation: '少量でも質の高いデータが効果的で、質の低いデータは悪い振る舞いを学習させます。',
    },
  ],
}

export default content
