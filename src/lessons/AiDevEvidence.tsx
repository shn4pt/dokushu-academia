import { useState } from 'react'
import { Slider } from '../components'
import type { LessonContent } from './types'

function GuessDemo() {
  const [guess, setGuess] = useState(20)
  const [shown, setShown] = useState(false)
  return (
    <div className="demo">
      <h4>予想する:経験豊富な開発者は、AI でどれだけ速くなったか</h4>
      <p className="muted">
        2025年前半、熟練の開発者が、長年関わってきた大規模なオープンソースの実際の課題に取り組みました。課題ごとに、AI ツールを使ってよいかを
        ランダムに決めて、かかった時間を比べています。AI を使うと、作業時間はどう変わったと思いますか?
      </p>
      <Slider label="あなたの予想" value={guess} min={-40} max={60} step={5} onChange={(v) => { setGuess(v); setShown(false) }} format={(v) => (v >= 0 ? `${v}% 速くなった` : `${-v}% 遅くなった`)} />
      <button onClick={() => setShown(true)}>結果を見る</button>
      {shown && (
        <div role="status">
          <table className="calc text">
            <tbody>
              <tr><td>あなたの予想</td><td>{guess >= 0 ? `${guess}% 速くなった` : `${-guess}% 遅くなった`}</td></tr>
              <tr><td>開発者自身の事前の予想</td><td>24% 速くなる</td></tr>
              <tr><td>作業後の、開発者自身の実感</td><td>20% 速くなった</td></tr>
              <tr><td><strong>計測した結果</strong></td><td><strong>19% 遅くなった(時間が19% 増えた)</strong></td></tr>
            </tbody>
          </table>
          <p className="muted">METR の研究(2025年7月公開)。実感と計測の結果が、逆向きにずれていた点が注目されました。</p>
        </div>
      )}
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>開発ツールの変遷</h3>
      <ol className="timeline">
        <li><span className="tl-year">2021〜2022</span><div className="tl-body"><strong>補完の普及</strong><p>GitHub Copilot が2021年6月に技術プレビューとして公開され、2022年6月に一般提供が始まった。エディタで次の数行を提案する補完(L1)が広まった。</p></div></li>
        <li><span className="tl-year">2022〜</span><div className="tl-body"><strong>対話支援</strong><p>2022年11月の ChatGPT 以降、質問に答え、コードを生成する対話型の支援(L2)が広く使われるようになった。</p></div></li>
        <li><span className="tl-year">2023〜2024</span><div className="tl-body"><strong>エディタへの統合</strong><p>チャットがエディタに組み込まれ、開いているコードを文脈として渡したり、複数のファイルを編集したりできるツールが増えた。</p></div></li>
        <li><span className="tl-year">2025</span><div className="tl-body"><strong>コーディングエージェント</strong><p>コードベースを自分で調べ、編集し、コマンドやテストを実行するエージェント型のツール(L3)が広まった。Anthropic の Claude Code は、2025年2月に研究プレビューとして公開され、5月に一般提供が始まった。</p></div></li>
        <li><span className="tl-year">2025〜</span><div className="tl-body"><strong>委任と自動化</strong><p>課題を渡すと、別の環境で作業して PR を出す非同期の使い方や、CI の中でエージェントを動かす使い方(L4)が広がっている。</p></div></li>
      </ol>

      <h3>研究は何を示しているか</h3>
      <p>
        「AI で開発がどれだけ速くなるか」については、条件によって大きく異なる結果が報告されています。代表的なものを見てみましょう。
      </p>

      <GuessDemo />

      <table className="calc text">
        <thead><tr><th>研究</th><th>条件</th><th>結果</th></tr></thead>
        <tbody>
          <tr>
            <td>Peng ら(2023年)</td>
            <td>JavaScript で HTTP サーバーを作る、決まった1つの課題。Copilot の有無で比較</td>
            <td>Copilot を使ったグループが 55.8% 速く完了</td>
          </tr>
          <tr>
            <td>METR(2025年7月)</td>
            <td>熟練の開発者16人が、慣れた大規模なオープンソースの実際の課題246件(主に Cursor と当時の Claude を使用)</td>
            <td>AI を使うと作業時間が19% 増えた。本人たちは速くなったと感じていた</td>
          </tr>
          <tr>
            <td>METR の続報(2026年2月)</td>
            <td>2025年後半のツールで同様の実験を行おうとしたもの</td>
            <td>「AI なしでは作業したくない」と参加や課題を断る開発者が増え、結果が偏ったため、信頼できる推定はできないとした。ただし、以前より速くなっている可能性が高いと考えている</td>
          </tr>
          <tr>
            <td>DORA(Google)の2024年の報告</td>
            <td>開発組織への大規模な調査</td>
            <td>AI の導入が進むほど、個人の生産性や文書・コードの質の実感は上がる一方、チーム全体の届ける速さ(スループット)と安定性は下がる関連が見られた(推定で、速さが1.5%、安定性が7.2% の低下)</td>
          </tr>
          <tr>
            <td>Spracklen ら(USENIX Security 2025)</td>
            <td>16 の LLM で生成した 57.6 万件のコードを分析</td>
            <td>存在しないパッケージを使う「パッケージの幻覚」が、商用モデルで少なくとも 5.2%、オープンなモデルで 21.7% 見られた</td>
          </tr>
        </tbody>
      </table>
      <p className="muted">数値は各研究の公表内容に基づきます。いずれも特定の条件での結果で、ツールやモデルは急速に変わっています。</p>

      <h3>ここから読み取れること</h3>
      <ul>
        <li><strong>効果は、作業と状況で大きく変わる</strong>。決まった小さな課題では大きく速くなる一方、熟練者が慣れた複雑なコードベースで作業する場合は、速くならないこともあった。</li>
        <li><strong>実感は、あてにならない</strong>。速くなったと感じていても、計測すると逆のことがある。12-1 で学んだとおり、自分の状況で測ることが大切。</li>
        <li><strong>コードを書く速さだけが、ボトルネックではない</strong>。レビュー、統合、テスト、本番での安定性まで含めて見ないと、全体としては遅くなったり、不安定になったりしうる。</li>
        <li><strong>新しい種類のリスクがある</strong>。存在しないパッケージ名を、攻撃者が先に登録して悪意のあるコードを仕込む、といった攻撃も指摘されている(15-2)。</li>
        <li><strong>状況は急速に変わっている</strong>。ツールとモデルの進歩は速く、1年前の結果が今も当てはまるとは限らない。だからこそ、自分のチームで継続的に測る仕組みが要る(Stage 17)。</li>
      </ul>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'METR の2025年の研究で注目された点はどれですか?',
      choices: [
        '開発者は速くなったと感じていたが、計測すると作業時間が増えていた',
        'AI を使うと必ず2倍速くなった',
        'AI ツールは誰も使わなかった',
      ],
      answer: 0,
      explanation: '実感と計測が逆向きにずれていました。自分の状況で測ることの大切さを示しています。',
    },
    {
      question: 'DORA の2024年の報告から読み取れることとして適切なものはどれですか?',
      choices: [
        'AI を導入すれば、チーム全体の届ける速さと安定性も必ず上がる',
        '個人の実感が上がっても、チーム全体の速さや安定性はむしろ下がる関連が見られた',
        'AI は開発に一切影響しない',
      ],
      answer: 1,
      explanation: 'コードを書く以外の工程(レビュー、統合、安定性)まで含めて見る必要があります。',
    },
    {
      question: '研究の結果を自分のチームに当てはめるときの姿勢として、最も適切なものはどれですか?',
      choices: [
        '最も良い数字を信じて、そのまま期待する',
        '条件の違いを踏まえ、自分のチームで成果の指標を継続的に測る',
        '悪い結果があるので、AI は使わない',
      ],
      answer: 1,
      explanation: '効果は作業や状況で大きく変わり、ツールも急速に変わるため、自分たちで測ることが大切です。',
    },
  ],
}

export default content
