import { useState } from 'react'
import type { LessonContent } from './types'

function CostCalc() {
  const [devs, setDevs] = useState(10)
  const [days, setDays] = useState(18)
  const [perDay, setPerDay] = useState(13)
  const [hours, setHours] = useState(2)
  const [rate, setRate] = useState(6000)
  const cost = devs * days * perDay
  const yen = 150
  const saved = devs * hours * 4 * rate
  const fmt = (n: number) => Math.round(n).toLocaleString('ja-JP')
  return (
    <div className="demo">
      <h4>試す:費用と効果の見積もり</h4>
      <p className="muted">チームの人数や使い方を変えて、1か月の費用と、効果の見積もりを比べてみましょう(あくまで考え方を示すための概算です)。</p>
      <label className="row">開発者の人数: {devs}人<input type="range" min={1} max={100} value={devs} onChange={(e) => setDevs(Number(e.target.value))} /></label>
      <label className="row">1か月に使う日数: {days}日<input type="range" min={1} max={22} value={days} onChange={(e) => setDays(Number(e.target.value))} /></label>
      <label className="row">1人1日あたりの費用: ${perDay}<input type="range" min={1} max={60} value={perDay} onChange={(e) => setPerDay(Number(e.target.value))} /></label>
      <label className="row">1人が1週間に短縮できる時間(計測した値): {hours}時間<input type="range" min={0} max={10} step={0.5} value={hours} onChange={(e) => setHours(Number(e.target.value))} /></label>
      <label className="row">1時間あたりの人件費: {fmt(rate)}円<input type="range" min={2000} max={15000} step={500} value={rate} onChange={(e) => setRate(Number(e.target.value))} /></label>
      <table className="calc text">
        <tbody>
          <tr><td>1か月の費用</td><td>${fmt(cost)}(1ドル{yen}円として約{fmt(cost * yen)}円)</td></tr>
          <tr><td>短縮した時間の価値(1か月を4週として)</td><td>約{fmt(saved)}円</td></tr>
          <tr><td>差し引き</td><td><strong>約{fmt(saved - cost * yen)}円</strong></td></tr>
        </tbody>
      </table>
      <p className="muted">
        「短縮できる時間」に、実感の値を入れてはいけません(14-2 で見たとおり、実感と計測はずれることがあります)。また、短縮した時間が、
        手戻りや障害の対応で消えていないかも、あわせて確かめます。
      </p>
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>何を測るか:速さと安定性の両方</h3>
      <p>
        AI を開発に取り入れた効果は、<strong>実感ではなく、計測で</strong>判断します(14-2)。ソフトウェアの開発の成果を測る指標として広く使われているのが、
        DORA(Google の DevOps Research and Assessment)の指標です。現在は、次の5つで、<strong>速さ</strong>と<strong>安定性</strong>の両方を見ます。
      </p>
      <table className="calc text">
        <thead><tr><th>分類</th><th>指標</th><th>意味</th></tr></thead>
        <tbody>
          <tr><td rowSpan={3}>速さ</td><td>変更のリードタイム</td><td>コミットしてから、本番に出るまでの時間</td></tr>
          <tr><td>デプロイの頻度</td><td>一定の期間に、どれだけデプロイしたか</td></tr>
          <tr><td>失敗からの復旧時間</td><td>失敗したデプロイから、復旧するまでの時間</td></tr>
          <tr><td rowSpan={2}>安定性</td><td>変更失敗率</td><td>デプロイのうち、取り消しや緊急の修正が必要になった割合</td></tr>
          <tr><td>手戻りのデプロイの割合</td><td>デプロイのうち、本番の障害への対応として予定外に行ったものの割合</td></tr>
        </tbody>
      </table>
      <p>
        AI で速さの指標だけが良くなり、変更失敗率や手戻りが増えているなら、<strong>速く作って、速く壊している</strong>状態です。
        14-1 で見たとおり、検証の仕組みが追いつかないまま任せる範囲を広げると、こうなります。
      </p>

      <h3>測ってはいけないもの、目標にしてはいけないもの</h3>
      <ul>
        <li><strong>書いたコードの行数</strong>:AI を使えば簡単に増やせる。増えたコードは、保守の負担でもある。</li>
        <li><strong>AI の提案の採用率</strong>:採用が多いことは、正しいことを意味しない。読まずに採用しても上がる。</li>
        <li><strong>AI が書いたコードの割合</strong>:それ自体は価値ではない。目標にすると、それを増やすための行動が起きる。</li>
      </ul>
      <p className="muted">
        指標を目標にすると、その指標は良い指標でなくなります(グッドハートの法則)。導入の状況を知るために使う値と、成果を判断する値を分けて考えます。
        あわせて、PR の大きさ、レビューにかかる時間、AI のレビューの指摘のうち役立ったものの割合なども見ると、どこが詰まっているかが分かります。
      </p>

      <h3>費用を知る</h3>
      <p>
        Claude Code の費用は、使ったトークンの量で決まります(サブスクリプションの場合は、プランの利用枠を消費します)。公式のドキュメントによると、
        企業での利用の平均は、<strong>開発者1人あたり、使った日1日で約13ドル、1か月で150〜250ドル</strong>で、利用者の9割は1日30ドル未満に収まっています。
        ただし、モデルの選び方、コードベースの大きさ、使い方(複数のセッションの並行や自動化)で大きく変わります。
      </p>
      <ul>
        <li>手元では <code>/usage</code> で、そのセッションのトークンの使用量と費用の目安を確認できる。</li>
        <li>チームでは、管理画面の利用状況や、分析の機能、OpenTelemetry での計測で、人ごと・モデルごとの費用を把握する。</li>
        <li>まず小さなグループで試し、費用の基準値を測ってから広げる。</li>
      </ul>

      <CostCalc />

      <h3>費用を抑える</h3>
      <table className="calc text">
        <thead><tr><th>工夫</th><th>理由</th></tr></thead>
        <tbody>
          <tr><td>関係のない作業に移るときは <code>/clear</code></td><td>古い文脈は、以降のすべての依頼で毎回送られ、費用がかかり続ける(11-3)</td></tr>
          <tr><td>作業に合ったモデルを選ぶ</td><td>多くのコーディングの作業は、上位のモデルでなくても十分にこなせる。難しい設計の判断に上位のモデルを使う(12-3)</td></tr>
          <tr><td>CLAUDE.md を短く保ち、特定の作業の手順はスキルに移す</td><td>CLAUDE.md は毎回読み込まれる。スキルは必要なときだけ読み込まれる</td></tr>
          <tr><td>具体的に頼む</td><td>あいまいな依頼は、広い範囲のファイルを読ませる</td></tr>
          <tr><td>長い出力の作業はサブエージェントに任せる</td><td>テストやログの長い出力を、元の会話の文脈に入れずに済む</td></tr>
          <tr><td>CI では、繰り返しの回数とタイムアウトに上限を設ける</td><td><code>--max-turns</code>、ワークフローのタイムアウト、同時実行の制限で、暴走を防ぐ(17-1)</td></tr>
        </tbody>
      </table>

      <h3>導入の進め方</h3>
      <ol>
        <li><strong>基準を測る</strong>:導入の前に、DORA の指標、レビューの時間、障害の件数を測っておく。</li>
        <li><strong>小さく試す</strong>:少人数で、任せやすい作業(14-3)から始める。CLAUDE.md、権限の設定、CI のチェックを整える。</li>
        <li><strong>比べる</strong>:速さと安定性の指標、費用を、基準と比べる。実感のアンケートだけで判断しない。</li>
        <li><strong>広げる</strong>:うまくいったやり方(CLAUDE.md、スキル、ワークフロー)をリポジトリに入れて共有し、検証の仕組みを育てながら、任せる範囲を広げる。</li>
      </ol>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'AI の導入後、デプロイの頻度は上がったが、変更失敗率も大きく上がりました。この状態の解釈として適切なものはどれですか?',
      choices: [
        '速くなったので、導入は成功している',
        '検証の仕組みが追いつかず、速く作って速く壊している可能性がある',
        '変更失敗率は気にしなくてよい',
      ],
      answer: 1,
      explanation: '速さと安定性の両方を見ます。安定性が落ちているなら、検証の仕組みを強化してから任せる範囲を広げます。',
    },
    {
      question: '成果の指標として目標にするのが不適切なものはどれですか?',
      choices: ['変更失敗率', 'AI の提案の採用率', '変更のリードタイム'],
      answer: 1,
      explanation: '採用率が高いことは正しさを意味せず、目標にすると読まずに採用する行動を招きます。',
    },
    {
      question: 'Claude Code の費用を抑える工夫として、適切なものはどれですか?',
      choices: [
        '1つのセッションで、関係のない作業も続けて頼む',
        '関係のない作業に移るときは /clear で文脈を消し、CLAUDE.md を短く保つ',
        'CLAUDE.md に、すべての作業の詳しい手順を書く',
      ],
      answer: 1,
      explanation: '文脈は毎回の依頼で送られるため、不要な文脈を持ち越さないことが費用を抑えます。',
    },
  ],
}

export default content
