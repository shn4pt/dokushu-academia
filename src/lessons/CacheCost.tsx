import { Link } from 'react-router-dom'
import CodeReview from '../ui/CodeReview'
import CacheCalc from '../ui/CacheCalc'
import CacheExperiment from '../ui/CacheExperiment'
import costSource from '../capstone2/cost.ts?raw'
import type { LessonContent } from './types'

function Body() {
  return (
    <>
      <h3>キャッシュは、測らないと効いているか分からない</h3>
      <p>
        <Link to="/lesson/11-4">11-4</Link> では、プロンプトキャッシュの仕組みと、読み取りが基本料金のごく一部で済むことを学びました。
        ただ、「キャッシュを付けたから安くなった」とは限りません。先頭の部分が少しでも変わると、キャッシュは効かず、<strong>書き込みの割増だけを毎回払う</strong>ことになります。
        だから、<strong>実際の使用量(usage)を見て、効いているかを測ります</strong>。
      </p>

      <h3>usage の3つの入力トークン</h3>
      <p>応答の <code>usage</code> には、入力が3つに分けて返ります。</p>
      <table className="calc text">
        <thead><tr><th>フィールド</th><th>意味</th><th>料金</th></tr></thead>
        <tbody>
          <tr><td><code>cache_read_input_tokens</code></td><td>キャッシュから読み取った分</td><td>基本の入力料金の 0.1 倍(モデルにより 0.05 倍など。料金表で確認)</td></tr>
          <tr><td><code>cache_creation_input_tokens</code></td><td>キャッシュに書き込んだ分</td><td>基本の 1.25 倍(5分)、または 2 倍(1時間)</td></tr>
          <tr><td><code>input_tokens</code></td><td>最後のキャッシュの境目より<strong>後</strong>の、キャッシュされていない分</td><td>基本の入力料金</td></tr>
        </tbody>
      </table>
      <p>
        注意:<code>input_tokens</code> は、入力の合計ではありません。<strong>入力の合計 = 3つの足し算</strong>です。
        「入力が減った」と見えるのは、キャッシュに回った分が、別のフィールドに移っただけの場合があります。
        料金の倍率とモデルごとの単価は、変わることがあるので、最新の料金表で確認してください。このレッスンの計算の部品は、料金を一か所の表にまとめています。
      </p>

      <h3>実験:同じ前置きで、3回呼ぶ</h3>
      <p>
        同じ前置き(店のポリシーの文章)をキャッシュして、質問を変えて3回呼びます。<strong>1回目は書き込み、2回目以降は読み取り</strong>になるはずです。
        次の「入れ替わる」モードでは、前置きの先頭に時刻を入れて、毎回違う文面にします。キャッシュが効かなくなる様子を見てください。
      </p>
      <CacheExperiment />
      <p className="muted">
        キャッシュは、前置きが一定の長さ(最小のトークン数。モデルによって違う)以上でないと作られません。短いと、<code>cache_creation_input_tokens</code> も <code>cache_read_input_tokens</code> も 0 のままです。
        この実験は、そのために、十分な長さの前置きを使っています。
      </p>

      <h3>元が取れるのは、何回目から?</h3>
      <p>
        書き込みは割増、読み取りは割引です。同じ前置きを何回読み取れば、キャッシュなしより安くなるか(損益分岐)は、書き込みの倍率と読み取りの倍率で決まります。
      </p>
      <CacheCalc />
      <ul>
        <li>5分のキャッシュ(書き込み 1.25 倍、読み取り 0.1 倍)なら、<strong>1回読み取れば、元が取れます</strong>(1.25 + 0.1 = 1.35 &lt; 2.0)。</li>
        <li>1時間のキャッシュ(書き込み 2 倍)は、2回目の呼び出しで読み取ると合計が 2.1 倍で、キャッシュなしの 2 倍をわずかに上回ります。<strong>2回以上読み取る見込みがあるときに</strong>選びます。</li>
        <li>呼び出しの間隔が<strong>有効期限(5分)を超える</strong>と、読み取りは起きず、また書き込みになります。期限は、読み取りのたびに延びます。間隔が長いなら、1時間のキャッシュを検討します。</li>
      </ul>

      <h3>キャッシュが効かなくなる原因</h3>
      <ul>
        <li><strong>先頭の部分が変わる</strong>:システムプロンプトの先頭に、時刻・リクエストの ID・利用者名を入れる。<strong>変わる情報は、キャッシュの境目より後ろ</strong>に置く。</li>
        <li><strong>ツールの定義が変わる</strong>:ツールの一覧は、システムプロンプトより前に来る。順序の入れ替えや、説明文の変更も、以降のキャッシュを無効にする(20-1 で一覧を決まった順序にしたのは、このため)。</li>
        <li><strong>前置きが短すぎる</strong>:最小のトークン数に届かないと、エラーにもならず、ただキャッシュされない。</li>
        <li><strong>有効期限が切れる</strong>:間隔が空く。</li>
        <li><strong>モデルを変える</strong>:キャッシュはモデルごとに別。そのほかの設定を変えた直後も、usage で、読み取りが続いているかを確かめる。</li>
      </ul>

      <h3>費用を記録して、見張る</h3>
      <p>
        本番では、<strong>呼び出しごとに usage を記録</strong>し、キャッシュの命中率と費用を集計します。
        「命中率」は、読み取り ÷ (読み取り + 書き込み + キャッシュ対象外の入力) の割合です。急に下がったら、前置きのどこかが変わったと疑えます。
      </p>
      <details>
        <summary>cost.ts の全文を見る</summary>
        <pre className="code-file">{costSource}</pre>
      </details>

      <CodeReview
        title="読解:usage のログから、キャッシュが壊れた呼び出しを見つける"
        description="同じ会話で、同じ前置き(約 2,000 トークン)をキャッシュしながら、5回呼んだ記録です(単位:トークン)。キャッシュが効かなくなった呼び出しを、1つ選んでください。"
        lines={[
          '1回目  input=40  cache_creation=2000  cache_read=0',
          '2回目  input=45  cache_creation=0     cache_read=2000',
          '3回目  input=38  cache_creation=0     cache_read=2000',
          '4回目  input=42  cache_creation=2020  cache_read=0',
          '5回目  input=41  cache_creation=0     cache_read=2020',
        ]}
        answers={[3]}
        explanation="4回目で、読み取りが 0 になり、また書き込み(2,020 トークン)になっています。前置きの内容が変わったか(長さも 2,000 から 2,020 に増えています)、有効期限が切れたかです。5回目に 2,020 を読み取れているので、4回目以降の新しい前置きでキャッシュが作り直され、そのあとは安定しています。原因は、4回目の直前に、前置きへ何かが加わった変更を探します。"
      />

      <h3>バッチと組み合わせる</h3>
      <p>
        Batch API(非同期で、費用が約半額)と、プロンプトキャッシュは、併用できます。ただしバッチの中の処理は、順序も時刻も保証されないので、
        キャッシュの読み取りは<strong>ベストエフォート</strong>(効くことが多いが、保証はされない)です。
        同じ前置きを共有するリクエストをまとめて送り、usage で、実際の命中率を測ってください。
      </p>
      <p className="muted">
        料金の倍率、有効期限、最小のトークン数は、変更されることがあります。実際の費用は、必ず最新の料金表と、自分の usage の記録で確かめてください。
        このレッスンの実験は、API キーを入力した場合に、実際の API を呼びます(キーを入れない場合は、説明用の例を表示します)。
      </p>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'usage の input_tokens について、正しい説明はどれですか?',
      choices: [
        '入力トークンの合計',
        '最後のキャッシュの境目より後の、キャッシュされていない入力の分',
        'キャッシュから読み取った分',
      ],
      answer: 1,
      explanation: '入力の合計は、input_tokens + cache_creation_input_tokens + cache_read_input_tokens です。',
    },
    {
      question: 'システムプロンプトの先頭に現在の時刻を入れると、キャッシュはどうなりますか?',
      choices: [
        '時刻が変わるたびに先頭の文面が変わるので、キャッシュが効かず、書き込みの割増だけを払う',
        '何も変わらない',
        'キャッシュの料金が安くなる',
      ],
      answer: 0,
      explanation: 'キャッシュは先頭から一致する部分に効きます。変わる情報は、境目より後ろに置きます。',
    },
    {
      question: '5分のキャッシュ(書き込み 1.25 倍、読み取り 0.1 倍)は、何回読み取ると元が取れますか?',
      choices: ['1回', '5回', '10回'],
      answer: 0,
      explanation: '書き込み 1.25 + 読み取り 0.1 = 1.35 倍で、キャッシュなしの 2 回分(2.0 倍)より安くなります。',
    },
  ],
}

export default content
