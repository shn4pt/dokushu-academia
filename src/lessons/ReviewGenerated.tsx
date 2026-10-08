import CodeReview from '../ui/CodeReview'
import type { LessonContent } from './types'

function Body() {
  return (
    <>
      <h3>生成されたコードは「他人が書いたコード」</h3>
      <p>
        AI が書いたコードでも、マージした時点で<strong>あなたのチームのコード</strong>になります。もっともらしく見えるのは、
        LLM が「ありそうなコード」を生成するからで、正しさの保証ではありません(8-3)。よくある問題の種類を知っておくと、レビューで見つけやすくなります。
      </p>
      <table className="calc text">
        <thead><tr><th>種類</th><th>例</th></tr></thead>
        <tbody>
          <tr><td>存在しない API・パッケージ</td><td>ありそうな名前の関数やライブラリを使う。研究では、生成コードの中に存在しないパッケージ名が一定の割合で現れた(14-2)</td></tr>
          <tr><td>古い書き方</td><td>非推奨になった API や、古いバージョンの書き方を使う</td></tr>
          <tr><td>境界の誤り</td><td>空の配列、0、最大値、最後の1件などの扱いが誤っている</td></tr>
          <tr><td>セキュリティ</td><td>SQL やコマンドへの値の埋め込み、秘密情報の直書き、入力の検証の欠落</td></tr>
          <tr><td>エラー処理</td><td>例外を握りつぶす、失敗を成功と同じに扱う</td></tr>
          <tr><td>甘いテスト</td><td>AI が書いたテストが、同じ誤りを前提にしていて、誤りを見逃す</td></tr>
        </tbody>
      </table>

      <h3>レビューの練習</h3>
      <CodeReview
        title="レビュー1:ユーザーの検索"
        description="名前でユーザーを検索する関数です。問題のある行を1つ選んでください。"
        lines={[
          'export async function findUsers(db: Db, name: string) {',
          '  if (!name.trim()) return [];',
          '  const sql = `SELECT id, name FROM users WHERE name LIKE \'%${name}%\'`;',
          '  const rows = await db.query(sql);',
          '  return rows.map((r) => ({ id: r.id, name: r.name }));',
          '}',
        ]}
        answers={[2]}
        explanation="3行目で、利用者の入力をそのまま SQL の文字列に埋め込んでいます(SQL インジェクション)。名前に ' を含めるだけで、任意の SQL を実行される恐れがあります。プレースホルダ(パラメータ化クエリ)を使い、値は別に渡します。"
      />
      <CodeReview
        title="レビュー2:ページ分け"
        description="1ページ10件ずつに分けて、指定したページの項目を返す関数です。問題のある行を1つ選んでください。"
        lines={[
          'export function getPage<T>(items: T[], page: number, size = 10): T[] {',
          '  const result: T[] = [];',
          '  const start = (page - 1) * size;',
          '  for (let i = start; i <= start + size; i++) {',
          '    if (i < items.length) result.push(items[i]);',
          '  }',
          '  return result;',
          '}',
        ]}
        answers={[3]}
        explanation="4行目の条件が <= になっているため、1ページに11件入ってしまい、次のページの先頭の項目が重複します。< にするのが正しく、items.slice(start, start + size) を使えば、こうした境界の誤りを避けられます。テストでは「ちょうど10件」「11件」など境界の例を確かめます。"
      />
      <CodeReview
        title="レビュー3:外部 API の呼び出し"
        description="天気の API を呼び出す関数です。問題のある行を1つ選んでください。"
        lines={[
          'const WEATHER_API_KEY = "sk_live_9f8a7b6c5d4e3f2a1b0c";',
          '',
          'export async function getWeather(city: string) {',
          '  const url = `https://api.example.com/weather?city=${encodeURIComponent(city)}`;',
          '  const res = await fetch(url, { headers: { Authorization: `Bearer ${WEATHER_API_KEY}` } });',
          '  if (!res.ok) throw new Error(`天気を取得できませんでした: ${res.status}`);',
          '  return res.json();',
          '}',
        ]}
        answers={[0]}
        explanation="1行目で、API キーをコードに直接書いています。リポジトリに含まれると、履歴を通じて漏れ続けます。環境変数やシークレット管理の仕組みから読み込みます。もし誤ってコミットしたら、キーを無効にして発行し直します。"
      />

      <h3>確かめ方のチェックリスト</h3>
      <ol>
        <li><strong>動かす</strong>:実際に実行し、正常な例と、境界・異常の例を試す。</li>
        <li><strong>テストを自分でも考える</strong>:AI が書いたテストに加えて、境界の例を自分で足す。テストが失敗すべきときに失敗するかも確かめる。</li>
        <li><strong>使っている API とパッケージを確かめる</strong>:公式のドキュメントで存在とバージョンを確認する。知らないパッケージは、本当に存在するか、保守されているか、名前が紛らわしくないかを確かめてから入れる。</li>
        <li><strong>機械に任せられるチェックは機械に</strong>:型チェック、lint、セキュリティの検査、依存関係の検査を CI で動かす。</li>
        <li><strong>説明できるかを確かめる</strong>:変更のすべての行について、なぜそうなっているかを説明できなければ、まだマージしない(15-3)。</li>
      </ol>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'AI が提案した、聞いたことのないパッケージを入れる前にすべきことはどれですか?',
      choices: [
        'AI が提案したので、すぐに入れる',
        '本当に存在するか、保守されているか、名前が紛らわしくないかを確かめる',
        'パッケージ名を少し変えて入れる',
      ],
      answer: 1,
      explanation: '存在しないパッケージ名が生成されることがあり、その名前を攻撃者が先に登録する攻撃も指摘されています。',
    },
    {
      question: 'AI が書いたテストについて、注意すべきことはどれですか?',
      choices: [
        'AI のテストは常に完全なので、追加は不要',
        '同じ誤りを前提にして誤りを見逃すことがあるので、境界の例を自分でも考える',
        'テストは不要',
      ],
      answer: 1,
      explanation: 'コードとテストが同じ思い込みで書かれていると、誤りを見逃します。',
    },
    {
      question: '利用者の入力を SQL に埋め込むコードの、適切な直し方はどれですか?',
      choices: [
        'プレースホルダ(パラメータ化クエリ)で値を別に渡す',
        '入力の前後に空白を足す',
        'エラーを握りつぶす',
      ],
      answer: 0,
      explanation: '値を SQL の文字列に埋め込まず、パラメータとして渡すことで、SQL インジェクションを防げます。',
    },
  ],
}

export default content
