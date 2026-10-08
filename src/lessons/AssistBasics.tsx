import ApiPlayground from '../ui/ApiPlayground'
import type { LessonContent } from './types'

function Body() {
  return (
    <>
      <h3>補完(L1):AI が見ているものを意識する</h3>
      <p>
        エディタの補完は、カーソルの前後のコードや、開いているファイルなどを手がかりに、続きを予測しています(第1部で学んだ次トークン予測と同じ考え方です)。
        つまり、<strong>周りのコードが手がかりになるほど、提案は良くなります</strong>。
      </p>
      <ul>
        <li>関数名や変数名を、意図が分かる名前にする(<code>calc</code> より <code>calcShippingFee</code>)。</li>
        <li>先に関数の説明コメントや型を書いてから、本体を書かせる。</li>
        <li>参考になる既存のコードや型定義を、開いておく。</li>
        <li>提案は「読んでから」採用する。長い提案ほど、境界の条件やエラー処理を確かめる。</li>
      </ul>

      <h3>対話支援(L2):文脈を渡す</h3>
      <p>
        チャットで頼むときの失敗の多くは、<strong>モデルがあなたの状況を知らない</strong>ことから起きます(9-3 のプロンプト設計と同じです)。
        次の情報を渡すと、手戻りが大きく減ります。
      </p>
      <ul>
        <li><strong>環境</strong>:言語とバージョン、フレームワーク、使ってよいライブラリ・使えないライブラリ。</li>
        <li><strong>既存のコード</strong>:関係する型や関数、呼び出し元。</li>
        <li><strong>入力と出力の例</strong>、特に<strong>境界の例</strong>(空、最大、不正な値)。</li>
        <li><strong>制約</strong>:性能、セキュリティ、コーディング規約。</li>
        <li><strong>欲しいもの</strong>:コードだけか、テストも書くか、複数の案と比較が欲しいか。</li>
      </ul>
      <pre>{`【環境】TypeScript 5、Node.js 22。外部ライブラリは使わない。
【既存のコード】type User = { id: number; name: string; email: string }
【やりたいこと】User の配列を CSV の文字列にする関数 toCsv を書いてほしい。
【条件】Excel で開ける形。名前にカンマ・ダブルクォート・改行が入ることがある。
【欲しいもの】関数と、境界の例を含むテスト。`}</pre>

      <ApiPlayground
        title="試す:あいまいな頼み方"
        prompt="ユーザー一覧を CSV にする関数を書いて"
        sample={{
          text: 'function toCsv(users) {\n  const header = "id,name,email";\n  const rows = users.map(u => `${u.id},${u.name},${u.email}`);\n  return [header, ...rows].join("\\n");\n}',
          stopReason: 'end_turn',
          usage: { input: 24, output: 86 },
        }}
      />
      <ApiPlayground
        title="試す:文脈を渡した頼み方"
        description="同じ依頼に、環境・既存の型・境界の条件・欲しいものを添えました。出力の違いを比べてみましょう。"
        prompt={'【環境】TypeScript 5、Node.js 22。外部ライブラリは使わない。\n【既存のコード】type User = { id: number; name: string; email: string }\n【やりたいこと】User の配列を CSV の文字列にする関数 toCsv を書いてほしい。\n【条件】Excel で開ける形。名前にカンマ・ダブルクォート・改行が入ることがある。\n【欲しいもの】関数と、境界の例を含むテスト。'}
        sample={{
          text: 'type User = { id: number; name: string; email: string };\n\n// カンマ・ダブルクォート・改行を含む値は、ダブルクォートで囲み、中の " は "" にする\nconst escape = (v: string | number): string => {\n  const s = String(v);\n  return /[",\\r\\n]/.test(s) ? `"${s.replace(/"/g, \'""\')}"` : s;\n};\n\nexport function toCsv(users: User[]): string {\n  const header = ["id", "name", "email"].join(",");\n  const rows = users.map((u) => [u.id, u.name, u.email].map(escape).join(","));\n  // Excel で文字化けしないよう、先頭に BOM を付け、改行は CRLF にする\n  return "\\uFEFF" + [header, ...rows].join("\\r\\n");\n}\n\n// テスト(例)\n// toCsv([]) は "\\uFEFFid,name,email"\n// name が \'山田, "太郎"\' のとき "山田, ""太郎""" と出力される\n// name に改行を含むとき、その値がダブルクォートで囲まれる',
          stopReason: 'end_turn',
          usage: { input: 142, output: 298 },
        }}
      />
      <p className="muted">
        あいまいな頼み方では、カンマや改行を含む名前で CSV が壊れるコードが返りがちです。条件を渡すと、境界の扱いまで考えたコードとテストが返ります。
        ただし、どちらの場合も、そのまま信用せず確かめる必要があります(15-2)。
      </p>

      <h3>対話の進め方のコツ</h3>
      <ul>
        <li><strong>先に方針を聞く</strong>:いきなりコードを頼まず、「どんな方法がありますか?それぞれの長所と短所は?」と聞いてから選ぶ。</li>
        <li><strong>小さく頼む</strong>:大きな機能を一度に頼まず、部品ごとに頼んで、その都度確かめる。</li>
        <li><strong>テストも一緒に頼む</strong>:ただし、AI が書いたテストは AI のコードの誤りを見逃すことがある。境界の例は自分でも考える。</li>
        <li><strong>エラーはそのまま渡す</strong>:エラーメッセージ、再現手順、期待した動きを貼り付けると、原因を絞り込みやすい。</li>
        <li><strong>会話が長くなったら、新しく始める</strong>:誤った前提が積み重なった会話を続けるより、整理した要件で新しく頼むほうが早いことが多い(6-3、11-3)。</li>
      </ul>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: '補完の提案の質を上げる工夫として、適切なものはどれですか?',
      choices: [
        '関数名を短く1文字にする',
        '意図が分かる名前や、説明コメント・型を先に書いておく',
        '関係するファイルをすべて閉じておく',
      ],
      answer: 1,
      explanation: '補完は周りのコードを手がかりに予測するため、手がかりが多いほど良い提案になります。',
    },
    {
      question: 'チャットでコードを頼むときに渡すべき情報として、特に重要なものはどれですか?',
      choices: [
        '言語やバージョン、既存の型、境界の例、制約',
        '自分の役職',
        '好きなエディタの色',
      ],
      answer: 0,
      explanation: 'モデルはあなたの状況を知らないので、環境と条件を具体的に伝えます。',
    },
    {
      question: '誤った前提が積み重なって会話が長くなったときの対処として適切なものはどれですか?',
      choices: [
        '同じ会話の中で、強い口調で何度も直させる',
        '要件を整理して、新しい会話で頼み直す',
        'AI を使うのをやめる',
      ],
      answer: 1,
      explanation: '長い会話は誤った前提を引きずりやすいため、整理した要件で始め直すほうが早いことが多いです。',
    },
  ],
}

export default content
