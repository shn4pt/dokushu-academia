import { Link } from 'react-router-dom'
import ClassifyItems from '../ui/ClassifyItems'
import type { LessonContent } from './types'

function Body() {
  return (
    <>
      <h3>コーディングエージェントは、あなたの権限で動く</h3>
      <p>
        手元で動かすコーディングエージェントは、あなたのアカウントの権限でファイルを書き換え、コマンドを実行し、ネットワークにつながります。
        第2部で学んだ<strong>最小権限</strong>と<strong>取り消しにくい操作の前の承認</strong>(<Link to="/lesson/11-2">11-2</Link>、<Link to="/lesson/12-2">12-2</Link>)は、
        そのまま開発の道具にも当てはまります。読み込んだ issue や Web ページ、依存パッケージの中の文が、指示としてふるまうプロンプトインジェクションの危険もあります。
      </p>

      <h3>権限モード:どこまで聞かずに進めるか</h3>
      <p>Claude Code には、作業の性質に合わせて選ぶ権限モードがあります(<code>Shift+Tab</code> または <code>--permission-mode</code> で切り替え)。</p>
      <table className="calc text">
        <thead><tr><th>モード</th><th>聞かずに実行するもの</th><th>向いている場面</th></tr></thead>
        <tbody>
          <tr><td><code>default</code>(Manual)</td><td>読み取りだけ</td><td>すべての操作を自分で確認したいとき、慎重さが要る作業</td></tr>
          <tr><td><code>acceptEdits</code></td><td>読み取り、ファイルの編集、よく使うファイル操作</td><td>レビューしながらコードを繰り返し直すとき</td></tr>
          <tr><td><code>plan</code></td><td>読み取り(変更はしない)</td><td>変更する前に、コードを調べて計画するとき(16-1)</td></tr>
          <tr><td><code>auto</code></td><td>ほぼすべて。別のモデル(分類器)が操作を確認し、危険そうなものだけを止める</td><td>長い作業で、確認の回数を減らしたいとき</td></tr>
          <tr><td><code>dontAsk</code></td><td>事前に許可したツールだけ。確認が必要なものは拒否</td><td>CI やスクリプトなど、決まったことだけをさせるとき</td></tr>
          <tr><td><code>bypassPermissions</code></td><td>すべて</td><td>隔離したコンテナや仮想マシンの中だけ</td></tr>
        </tbody>
      </table>
      <p className="muted">
        確認が多すぎると、10回目あたりから中身を読まずに許可するようになります(承認疲れ)。確認を減らす正しい方法は、何でも許すことではなく、
        <strong>安全と分かっている操作を事前に許可</strong>し、<strong>危ない操作を確実に禁止</strong>することです。モードの名前と既定値は版によって変わるため、使う前に公式のドキュメントで確かめてください。
      </p>

      <h3>権限のルール:許可・確認・拒否</h3>
      <p>
        ルールは設定ファイルに書きます。チームで共有するなら <code>.claude/settings.json</code>、自分だけなら <code>.claude/settings.local.json</code>、
        すべてのプロジェクトに効かせるなら <code>~/.claude/settings.json</code> です。
      </p>
      <pre className="code-file">{`{
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(git commit *)"
    ],
    "deny": [
      "Bash(git push *)",
      "Read(./.env)"
    ]
  }
}`}</pre>
      <p>
        ルールは<strong>拒否(deny)→ 確認(ask)→ 許可(allow)</strong>の順に調べられ、最初に当てはまったものが使われます。
        より細かいルールが優先されるわけではないので、広い拒否のルールに、許可のルールで例外を作ることはできません。
        また、<code>&amp;&amp;</code> や <code>|</code> でつないだコマンドは1つずつ調べられ、どれか1つでも拒否に当てはまれば拒否されます。
      </p>

      <ClassifyItems
        title="判定:上の設定のとき、この操作はどうなる?"
        description="上の設定ファイルだけがあり、モードは Manual(default)とします。それぞれの操作が、そのまま実行されるか、確認を求められるか、拒否されるかを選んでください。"
        options={['実行', '確認', '拒否']}
        items={[
          { text: 'npm run test', ok: ['実行'], why: 'Bash(npm run *) の許可に当てはまります。' },
          { text: 'git push origin main', ok: ['拒否'], why: 'Bash(git push *) の拒否に当てはまります。' },
          { text: 'npm install left-pad', ok: ['確認'], why: 'npm run ではないので許可に当てはまらず、どのルールにもないため、Manual モードでは確認を求められます。' },
          { text: 'npm run build && git push', ok: ['拒否'], why: 'つないだコマンドは1つずつ調べられます。後半の git push が拒否に当てはまります。' },
          { text: '.env ファイルを読む(Read ツール)', ok: ['拒否'], why: 'Read(./.env) の拒否に当てはまります。' },
          { text: 'src/App.tsx を編集する', ok: ['確認'], why: 'ファイルの編集は、Manual モードでは確認を求められます(acceptEdits モードなら確認なしで実行されます)。' },
        ]}
      />
      <p className="muted">
        引数の中身まで細かく縛るルール(例:特定の URL にだけ curl を許す)は、書き方の違いで簡単にすり抜けられます。コマンドの細かな制限は、次のサンドボックスと組み合わせて考えます。
      </p>

      <h3>フック:必ず実行させたいことを、仕組みにする</h3>
      <p>
        <strong>フック</strong>は、ツールを使う前後やセッションの終わりなど、決まった時点で自動で実行されるコマンドです。CLAUDE.md の指示は守られないことがありますが、
        フックは<strong>毎回、例外なく</strong>実行されます。次は、AI がファイルを編集・作成するたびに、整形ツール(Prettier)をかける例です。
      </p>
      <pre className="code-file">{`{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write" }
        ]
      }
    ]
  }
}`}</pre>
      <ul>
        <li><code>PreToolUse</code>:ツールを使う前。スクリプトが終了コード 2 で終わると、その操作を止められる(例:migrations フォルダへの書き込みを禁止する)。</li>
        <li><code>PostToolUse</code>:ツールが成功した後(例:整形、lint、型チェック)。</li>
        <li><code>Stop</code>:AI が応答を終えるとき(例:テストが通るまで、終わらせない)。</li>
      </ul>

      <h3>サンドボックス:OS のレベルで囲う</h3>
      <p>
        権限のルールは「この操作をしてよいか」をコマンドの文字列で判断しますが、<strong>サンドボックス</strong>は、OS がコマンドの実行中に、届く範囲そのものを制限します。
        Claude Code のサンドボックス(macOS、Linux、WSL2 で利用可能。<code>/sandbox</code> で設定)では、シェルのコマンドとそこから起動したプロセスについて、
      </p>
      <ul>
        <li>書き込めるのは、作業フォルダと一時フォルダ(と、追加したフォルダ)だけ。</li>
        <li>ネットワークは、許可したドメイン(<code>allowedDomains</code>)にしかつながらない。</li>
      </ul>
      <p>
        という境界を設けます。範囲の中なら、1つずつ確認しなくても安全に実行させられます。ただし、サンドボックスが囲うのはシェルのコマンドだけで、
        ファイルの読み書きや Web 取得の組み込みツールは、権限のルールに従います。さらに強く隔離したいときは、コンテナや仮想マシンの中で動かします。
      </p>

      <h3>守りを重ねる</h3>
      <table className="calc text">
        <thead><tr><th>層</th><th>役割</th><th>強さ</th></tr></thead>
        <tbody>
          <tr><td>CLAUDE.md</td><td>決まりと注意を伝える</td><td>お願い(守られないことがある)</td></tr>
          <tr><td>権限モードとルール</td><td>操作ごとに、実行・確認・拒否を決める</td><td>ツールの呼び出しを確実に止める</td></tr>
          <tr><td>フック</td><td>決まった時点で、必ずチェックや整形を実行する</td><td>毎回実行される</td></tr>
          <tr><td>サンドボックス・コンテナ</td><td>ファイルとネットワークの届く範囲を、OS で制限する</td><td>ルールをすり抜けても、範囲の外には出られない</td></tr>
          <tr><td>バージョン管理とレビュー</td><td>変更を元に戻せるようにし、人が確かめる</td><td>最後の砦</td></tr>
        </tbody>
      </table>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'allow に Bash(git *)、deny に Bash(git push *) があるとき、git push origin main はどうなりますか?',
      choices: ['許可される(allow のほうが先に書いてあるため)', '拒否される(deny が先に調べられるため)', 'ルールが矛盾するのでエラーになる'],
      answer: 1,
      explanation: 'ルールは deny → ask → allow の順に調べられ、最初に当てはまったものが使われます。',
    },
    {
      question: '「AI が編集したファイルには、必ず整形をかける」を実現する方法として、最も適切なものはどれですか?',
      choices: ['CLAUDE.md に書く', 'PostToolUse のフックで整形ツールを実行する', '毎回の依頼で頼む'],
      answer: 1,
      explanation: 'フックは決まった時点で毎回実行されます。CLAUDE.md の指示は守られないことがあります。',
    },
    {
      question: 'すべての確認を省く bypassPermissions モードを使ってよい場面はどれですか?',
      choices: ['普段の開発用の PC で、作業を速くしたいとき', '隔離したコンテナや仮想マシンの中で動かすとき', '本番のサーバーで作業するとき'],
      answer: 1,
      explanation: 'すべての操作が確認なしで実行されるため、何が起きても被害が外に及ばない、隔離した環境でだけ使います。',
    },
  ],
}

export default content
