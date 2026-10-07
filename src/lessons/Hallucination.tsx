import { useState } from 'react'
import { Slider } from '../components'
import type { LessonContent } from './types'

function ci(p: number, n: number) {
  const half = 1.96 * Math.sqrt((p * (1 - p)) / n)
  return [Math.max(0, p - half), Math.min(1, p + half)] as const
}

function Interval({ name, p, n }: { name: string; p: number; n: number }) {
  const [lo, hi] = ci(p, n)
  return (
    <div className="attn-row sim-row" style={{ gridTemplateColumns: '5em 1fr 9em' }}>
      <span className="attn-token">{name}</span>
      <div className="bar-track" style={{ position: 'relative', height: 14 }} aria-hidden>
        <div className="bar-fill" style={{ position: 'absolute', left: `${lo * 100}%`, width: `${(hi - lo) * 100}%` }} />
      </div>
      <span className="attn-weight">{(lo * 100).toFixed(0)}〜{(hi * 100).toFixed(0)}%</span>
    </div>
  )
}

function EvalDemo() {
  const [a, setA] = useState(0.72)
  const [b, setB] = useState(0.76)
  const [n, setN] = useState(100)
  const [loA, hiA] = ci(a, n)
  const [loB, hiB] = ci(b, n)
  const overlap = loA <= hiB && loB <= hiA

  return (
    <div className="demo">
      <h4>デモ:ベンチマークの正答率の「ばらつき」</h4>
      <p className="muted">
        問題数が少ないと、正答率の差が実力差か偶然かを区別できません。バーは、正規近似による95%信頼区間の目安です
        (簡易計算で、各問題は独立と仮定)。
      </p>
      <Slider label="モデルAの正答率" value={a} min={0.3} max={0.95} step={0.01} onChange={setA} format={(v) => `${(v * 100).toFixed(0)}%`} />
      <Slider label="モデルBの正答率" value={b} min={0.3} max={0.95} step={0.01} onChange={setB} format={(v) => `${(v * 100).toFixed(0)}%`} />
      <Slider label="問題数" value={n} min={20} max={3000} step={10} onChange={setN} />
      <Interval name="A" p={a} n={n} />
      <Interval name="B" p={b} n={n} />
      <p>
        {overlap
          ? '区間が重なっています。この問題数では、AとBに実力差があるとは言い切れません。'
          : '区間が重なっていません。差は偶然とは考えにくい水準です。'}
      </p>
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>幻覚(ハルシネーション)とは</h3>
      <p>
        もっともらしいが事実と異なる内容を、自信ありげに生成する現象です。存在しない論文や関数名、誤った日付などが典型です。
      </p>

      <h3>なぜ起きるのか</h3>
      <ul>
        <li>
          <strong>目的が「もっともらしい続き」だから</strong>:事前学習は、次のトークンを当てる学習です(5-1)。
          事実かどうかではなく、「ありそうな文章」を作る能力が鍛えられます。
        </li>
        <li>
          <strong>知識が圧縮されている</strong>:重みの中の知識はあいまいで、特にまれな事実(ロングテール)は不正確になりやすい。
        </li>
        <li>
          <strong>「知らない」と言う訓練が不足しがち</strong>:お手本や好みの比較で、答えている応答のほうが評価されやすいと、
          不確かでも答える方向に偏る。
        </li>
        <li>
          <strong>文脈に引きずられる</strong>:質問に誤った前提が含まれていると、それに合わせた応答を作りやすい。
        </li>
        <li>
          <strong>生成の誤りが連鎖する</strong>:一度誤ったトークンを出すと、それを前提に続きを作ってしまう。
        </li>
      </ul>

      <h3>対策</h3>
      <ul>
        <li><strong>根拠を与える</strong>:RAG(8-1)で資料を渡し、「資料の範囲で答える」よう指示する。</li>
        <li><strong>出典の提示と検証</strong>:引用元を出させ、人間またはプログラムで確認する。</li>
        <li><strong>確認できるものはツールで確かめる</strong>:計算、検索、コード実行など(8-2)。</li>
        <li><strong>不確かさの表明</strong>:「わからない」と答えてよい、と明示する。</li>
        <li><strong>用途に応じた設計</strong>:誤りが許されない場面では、モデルの出力を最終判断にしない。</li>
      </ul>

      <h3>モデルの性能をどう測るか</h3>
      <p>
        モデルの比較には<strong>ベンチマーク</strong>(問題集)が使われます。ただし、読み方に注意が必要です。
      </p>
      <ul>
        <li><strong>汚染</strong>:評価問題が学習データに入っていると、実力より高く出る(5-2)。</li>
        <li><strong>飽和</strong>:正答率が上限に近づき、差がつかなくなる。</li>
        <li><strong>実務との乖離</strong>:ベンチマークの得点が、自分の用途での使いやすさと一致するとは限らない。</li>
        <li><strong>統計的なばらつき</strong>:問題数が少ないと、数%の差は偶然かもしれない。</li>
      </ul>

      <EvalDemo />

      <h3>自分の用途の評価を作る</h3>
      <p>
        最も信頼できるのは、自分の用途を代表する入力と、期待する出力の基準を用意した評価です。
        小さくても構わないので評価セットを作り、モデルやプロンプトを変えるたびに同じセットで測ると、
        変更が本当に改善かどうかを判断できます。出力の採点には、人間、ルール、あるいは別のLLM(LLM-as-a-judge)を使いますが、
        採点者自身にも偏りがあることに注意が必要です。
      </p>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: '幻覚が起きやすい根本的な理由として最も適切なものはどれですか?',
      choices: [
        'モデルが「もっともらしい続き」を生成するよう学習されており、事実性を直接は保証していないから',
        'モデルが意図的に嘘をつくから',
        'メモリが足りないから',
      ],
      answer: 0,
      explanation: '次トークン予測の目的は、事実の正しさではなく、文章としての尤もらしさです。',
    },
    {
      question: '幻覚を減らす方法として適切なものはどれですか?',
      choices: [
        '根拠となる資料を与え、その範囲で答えるよう指示する',
        'temperature を最大にする',
        '常に長く答えさせる',
      ],
      answer: 0,
      explanation: 'RAG などで根拠を与え、検証可能にするのが有効です。',
    },
    {
      question: '問題数の少ないベンチマークで、正答率が数%違う2つのモデルを比べるとき、注意すべきことはどれですか?',
      choices: [
        '差が偶然のばらつきの範囲に収まっている可能性がある',
        '正答率の高い方が必ず優れている',
        '問題数は結果に影響しない',
      ],
      answer: 0,
      explanation: '問題数が少ないほど信頼区間が広がり、差を実力差と断定できません。',
    },
  ],
}

export default content
