import { useState } from 'react'
import { Link } from 'react-router-dom'
import { dimensions, levelFor, loadAnswers, summarize } from '../assessment'
import CodeOrder from '../ui/CodeOrder'
import type { LessonContent } from './types'

function MyPlan() {
  const [answers] = useState(() => loadAnswers())
  const s = summarize(answers)
  if (!s) {
    return (
      <div className="demo">
        <h4>あなたの計画のたたき台</h4>
        <p>
          まだ診断の結果がありません。<Link to="/lesson/19-1">19-1 の診断</Link>に答えると、ここに、最も弱い軸から始める計画のたたき台が出ます。
        </p>
      </div>
    )
  }
  const order = [...dimensions].sort((a, b) => answers[a.id] - answers[b.id])
  const target = s.min < 3 ? levelFor(s.min + 1) : null
  return (
    <div className="demo">
      <h4>あなたの計画のたたき台</h4>
      <p className="muted">19-1 の診断の結果から作った、たたき台です。チームの事情に合わせて書き直してください。</p>
      {target ? (
        <>
          <p>
            <strong>現在の目安: {s.level} → 次の目標: {target}</strong>
          </p>
          <ol>
            {order.filter((d) => answers[d.id] === s.min).map((d) => (
              <li key={d.id}>
                <strong>{d.name}(段階{answers[d.id]} → {answers[d.id] + 1})</strong>:{d.next[answers[d.id]]}
              </li>
            ))}
          </ol>
          {order.some((d) => answers[d.id] > s.min && answers[d.id] < 3) && (
            <p className="muted">
              そのあとで伸ばす軸:{order.filter((d) => answers[d.id] > s.min && answers[d.id] < 3).map((d) => `${d.name}(段階${answers[d.id]})`).join('、')}
            </p>
          )}
        </>
      ) : (
        <p>すべての軸が段階3です。新しい作業に広げるときは、その作業でも同じ仕組みが効いているかを確かめ、リスクの高い変更は人の判断に残します(18-3)。</p>
      )}
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>移行の原則</h3>
      <ul>
        <li><strong>1段ずつ上げる</strong>:L2 から一気に L5 を目指さない。1つ上の水準で、仕組みが本当に効くことを確かめてから次に進む。</li>
        <li><strong>先に検証を作る</strong>:任せる範囲を広げる前に、それを確かめる仕組みを用意する(14-1 の「検証できる範囲までしか、安全には任せられない」)。</li>
        <li><strong>低リスクの作業から始める</strong>:影響が小さく、確かめやすい作業(14-3)で試し、うまくいったら広げる。</li>
        <li><strong>基準を測ってから始める</strong>:導入前の値がないと、良くなったかどうか分からない(17-3)。</li>
        <li><strong>やめる条件も決める</strong>:変更失敗率が上がったら範囲を戻す、など。任せる範囲は広げるだけでなく、縮めることもある。</li>
      </ul>

      <MyPlan />

      <h3>計画の書き方</h3>
      <p>計画は、次の形で1ページにまとめると、チームで共有して見直しやすくなります。</p>
      <pre>{`# AI 開発の移行計画(例:L2 → L3)
## 現在地(19-1 の診断)
- 検証: 段階1 / 文脈と仕様: 段階0 / 権限と安全: 段階0
- レビュー: 段階1 / 計測: 段階0 / 人の理解: 段階1
## 目標(3か月)
- 定型の小さな作業(バグ修正・テスト追加)を、エージェントに任せられる(L3)
## やること
1. 基準を測る: 変更のリードタイム、変更失敗率、レビューの時間
2. CLAUDE.md を作る(/init のあと、コードから分からないことだけ残す)
3. 権限のルール: テスト・ビルドを許可、push と .env の読み取りを拒否
4. 2人で、低リスクの作業から試す。計画(plan モード)を必ず確認する
5. 1か月ごとに指標と費用を比べ、範囲を広げるか決める
## やめる・戻す条件
- 変更失敗率が基準より明らかに悪化したら、任せる範囲を戻して原因を調べる
## 人に残す判断
- 認証・決済・本番データに関わる変更は、引き続き人が主導する`}</pre>

      <CodeOrder
        title="並べ替え:L3 から L4 へ移る手順"
        description="エージェントを手元で使えている(L3)チームが、課題を渡して PR を受け取る(L4)段階へ移る手順です。正しい順番に並べ替えてください。"
        lines={[
          '導入前の指標(リードタイム・変更失敗率・レビューの時間)を測る',
          'CI で型・lint・テストを必須のチェックにし、ブランチを保護する',
          'issue のテンプレートに「やらないこと」と「完了の条件」の欄を作る',
          'GitHub Actions を最小権限で導入し、低リスクの課題だけを渡す',
          '指標と費用を基準と比べ、任せる課題の範囲を広げるか決める',
        ]}
        explanation="測ってから始め、任せる前に検証(CI)と課題の書き方を整え、低リスクの課題で試し、計測の結果で範囲を決めます。検証より先に委任を始めると、届いた PR を確かめる手段がないまま、レビューの負担だけが増えます。"
      />

      <h3>個人の場合</h3>
      <p>
        一人で開発している場合も、考え方は同じです。CLAUDE.md と権限の設定から始め、テストを用意し、
        「計画を確認してから実装させる」「差分を説明できるまでコミットしない」を習慣にします。次の 19-3 では、このアプリ自体が、
        どのような進め方で作られたかを事例として振り返ります。
      </p>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'AI 開発の移行の進め方として、適切なものはどれですか?',
      choices: [
        'L2 から一気に L5 を目指す',
        '検証の仕組みを先に作り、1段ずつ、低リスクの作業から広げる',
        '指標は測らず、実感で判断する',
      ],
      answer: 1,
      explanation: '確かめる仕組みを先に用意し、1段ずつ試して、計測の結果で範囲を決めます。',
    },
    {
      question: '移行計画に「やめる・戻す条件」を書いておく理由として、最も適切なものはどれですか?',
      choices: [
        '計画を長くするため',
        '問題が起きたときに、任せる範囲を縮める判断を迷わず行えるようにするため',
        'AI に読ませるため',
      ],
      answer: 1,
      explanation: '任せる範囲は広げるだけでなく、状況に応じて縮めることもあります。条件を先に決めておくと判断が速くなります。',
    },
  ],
}

export default content
