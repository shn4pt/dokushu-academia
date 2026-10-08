import { useState } from 'react'
import type { LessonContent } from './types'

type Lv = 'low' | 'mid' | 'high'
const label: Record<Lv, string> = { low: '低い', mid: '中くらい', high: '高い' }

function recommend(risk: Lv, verify: Lv): { level: string; note: string } {
  if (risk === 'high' && verify !== 'high') return { level: 'L1〜L2(人が主導)', note: '影響が大きく、確かめにくい。AI は調べものや下書きに使い、設計と判断は人が行う。' }
  if (risk === 'high') return { level: 'L2〜L3(人が細かく確認)', note: '確かめやすくても、影響が大きい。小さく区切り、計画と差分を人が丁寧にレビューする。' }
  if (verify === 'low') return { level: 'L2〜L3(人が確認しながら)', note: '影響は大きくないが、確かめにくい。まず確かめる手段(テストや動作確認の手順)を用意すると、任せやすくなる。' }
  if (risk === 'mid' || verify === 'mid') return { level: 'L3(エージェントに任せ、差分をレビュー)', note: '計画を確認し、テストを通したうえで差分をレビューする。' }
  return { level: 'L3〜L4(任せて、成果物を確かめる)', note: '影響が小さく、自動で確かめられる。課題として渡し、CI とレビューで確かめる。' }
}

function Matrix() {
  const [risk, setRisk] = useState<Lv>('mid')
  const [verify, setVerify] = useState<Lv>('mid')
  const r = recommend(risk, verify)
  return (
    <div className="demo">
      <h4>試す:任せる水準の目安</h4>
      <p className="muted">作業のリスクと、検証のしやすさを選ぶと、任せる水準の目安が出ます(考え方を示すための目安です)。</p>
      <div className="row">
        <span>リスク(影響の大きさ・取り消しにくさ):</span>
        {(['low', 'mid', 'high'] as Lv[]).map((v) => <button key={v} className={risk === v ? '' : 'secondary'} onClick={() => setRisk(v)}>{label[v]}</button>)}
      </div>
      <div className="row">
        <span>検証のしやすさ(自動で確かめられるか):</span>
        {(['low', 'mid', 'high'] as Lv[]).map((v) => <button key={v} className={verify === v ? '' : 'secondary'} onClick={() => setVerify(v)}>{label[v]}</button>)}
      </div>
      <p role="status"><strong>目安: {r.level}</strong></p>
      <p className="muted">{r.note}</p>
    </div>
  )
}

type Task = { name: string; risk: Lv; verify: Lv; ok: string[]; why: string }
const tasks: Task[] = [
  { name: '画面の文言の誤字を直す', risk: 'low', verify: 'high', ok: ['L3', 'L4'], why: '影響が小さく、差分を見ればすぐ確かめられる。課題として任せてよい。' },
  { name: 'テストが整った関数を、読みやすく書き直す', risk: 'low', verify: 'high', ok: ['L3', 'L4'], why: 'テストが振る舞いを守ってくれるので、任せやすい代表例。' },
  { name: '使っているライブラリのメジャーバージョンを上げる', risk: 'mid', verify: 'mid', ok: ['L3'], why: '影響が広がりうる。エージェントに作業させ、テストと差分のレビューで確かめる。' },
  { name: 'ログイン・認証の処理を変更する', risk: 'high', verify: 'mid', ok: ['L2', 'L3'], why: 'セキュリティに直結する。小さく区切り、人が設計と差分を丁寧に確認する。' },
  { name: '本番データベースの構造を変更する', risk: 'high', verify: 'low', ok: ['L1', 'L2'], why: '取り消しにくく、事前に確かめにくい。手順の下書きなどに AI を使い、判断と実行は人が行う。' },
  { name: '使い捨ての試作画面を作る', risk: 'low', verify: 'low', ok: ['L3', 'L4'], why: '捨てる前提なら、品質の確認は軽くてよい。思い切って任せ、見て判断する。' },
]
const levelOptions = ['L1', 'L2', 'L3', 'L4']

function TaskSort() {
  const [picks, setPicks] = useState<(string | null)[]>(() => tasks.map(() => null))
  const [checked, setChecked] = useState(false)
  const score = tasks.filter((t, i) => picks[i] && t.ok.includes(picks[i]!)).length
  return (
    <div className="demo">
      <h4>判定:この作業は、どの水準で任せる?</h4>
      <p className="muted">それぞれの作業に、最も適切だと思う水準を選んでください(適切な答えが複数ある作業もあります)。</p>
      {tasks.map((t, i) => (
        <div key={t.name} className={'task-row' + (checked ? (picks[i] && t.ok.includes(picks[i]!) ? ' ok' : ' ng') : '')}>
          <div><strong>{t.name}</strong></div>
          <div className="row">
            {levelOptions.map((l) => (
              <button key={l} className={picks[i] === l ? '' : 'secondary'} onClick={() => { setPicks(picks.map((p, j) => (j === i ? l : p))); setChecked(false) }}>{l}</button>
            ))}
          </div>
          {checked && <p className="muted">目安: {t.ok.join(' または ')}。{t.why}</p>}
        </div>
      ))}
      <div className="row">
        <button onClick={() => setChecked(true)} disabled={picks.some((p) => p === null)}>答え合わせ</button>
        {checked && <strong>{score} / {tasks.length}</strong>}
      </div>
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>2つの軸で考える</h3>
      <p>どこまで AI に任せるかは、作業ごとに、次の2つの軸で考えると判断しやすくなります。</p>
      <ul>
        <li>
          <strong>リスク</strong>:誤ったときの影響の大きさと、取り消しやすさ。お金、認証・権限、個人情報、本番のデータに関わる作業は高い。
        </li>
        <li>
          <strong>検証のしやすさ</strong>:正しいかどうかを、自動で、すぐに確かめられるか。テストが整っている、型やチェックで誤りが分かる、
          動かせばすぐ分かる、といった作業は高い。
        </li>
      </ul>
      <p>
        リスクが低く、検証しやすい作業ほど、高い水準で任せられます。逆に、リスクが高く、確かめにくい作業は、人が主導します。
        さらに、<strong>何を作るかが明確か</strong>(仕様がはっきりしているか)も重要です。あいまいな作業は、まず人が考えを整理してから任せます。
      </p>

      <Matrix />
      <TaskSort />

      <h3>任せる範囲を広げるには、軸を動かす</h3>
      <p>
        水準は、作業の性質で固定されているわけではありません。次のように<strong>2つの軸を動かす</strong>ことで、同じ作業でも、より高い水準で任せられるようになります。
        これが、AI を使った開発を進化させていくときの基本的な戦略です。
      </p>
      <table className="calc text">
        <thead><tr><th>動かす軸</th><th>具体的な手段</th></tr></thead>
        <tbody>
          <tr><td>検証のしやすさを上げる</td><td>テストを書く・増やす、型やチェック(lint)を入れる、CI で自動実行する、動作を確かめる手順を書いておく</td></tr>
          <tr><td>リスクを下げる</td><td>変更を小さく区切る、本番から隔離した環境で作業させる、権限を絞る、元に戻せるようにする(バージョン管理、段階的な公開)</td></tr>
          <tr><td>仕様を明確にする</td><td>何を作るか、何をしないか、完了の条件を、文章で書いてから任せる</td></tr>
        </tbody>
      </table>
      <p>
        たとえば「テストのない古いコードの書き直し」は、そのままでは確かめにくいので任せにくい作業です。しかし、まず現在の振る舞いを守るテストを
        (AI の助けも借りて)用意すれば、書き直しそのものは高い水準で任せられるようになります。
      </p>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: '最も高い水準で任せやすい作業はどれですか?',
      choices: [
        '本番データベースの構造変更',
        'テストが整った関数を読みやすく書き直す',
        '決済の金額計算の変更',
      ],
      answer: 1,
      explanation: '影響が小さく、テストで振る舞いを確かめられるため、任せやすい作業です。',
    },
    {
      question: '同じ作業を、より高い水準で任せられるようにする方法として適切なものはどれですか?',
      choices: [
        'テストを用意し、変更を小さく区切り、権限を絞る',
        'AI により強い口調で指示する',
        'レビューを省略する',
      ],
      answer: 0,
      explanation: '検証のしやすさを上げ、リスクを下げると、任せられる範囲が広がります。',
    },
    {
      question: 'リスクが高く、確かめにくい作業での AI の使い方として適切なものはどれですか?',
      choices: [
        'エージェントにすべて任せて、結果だけ見る',
        '調べものや下書きに使い、設計と判断・実行は人が行う',
        'AI には一切触れさせない',
      ],
      answer: 1,
      explanation: 'AI を助けとして使いつつ、取り消しにくい判断は人が主導します。',
    },
  ],
}

export default content
