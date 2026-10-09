import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type Anthropic from '@anthropic-ai/sdk'
import { describeError, sendRequest } from '../api/client'
import { findModel, formatUsd, useApi } from '../api/settings'
import { PRICES, cacheHitRate, callCost, costWithoutCache, promptTokens, type Usage } from '../capstone2/cost'

// キャッシュされる、長い共通の先頭部分(店の方針)。約1,400字で、キャッシュできる最小の長さ(512トークン)を、十分に超える
const POLICY = `あなたは、ネットショップ「みどり堂」のサポート担当です。次の方針に従って、お客様の質問に1〜2文で答えてください。方針に書かれていないことは、推測せず、分からないと伝えます。

【返品】商品の到着から30日以内で、未使用・未開封のものに限り、返品できます。開封済みの食品、下着、名前入りの商品、ダウンロード商品は、返品できません。商品に不具合があった場合は、期間にかかわらず、無料で交換または返金します。返品の送料は、お客様都合の場合はお客様の負担、不具合や誤送の場合は当店の負担です。返品の受付後、商品が当店に届いてから7営業日以内に、元の支払い方法に返金します。

【配送】通常は、ご注文から2〜4営業日で発送します。お届けまでは、本州で1〜2日、北海道・九州で2〜3日、沖縄・離島で3〜5日が目安です。配送日時の指定は、発送日の翌日から14日先まで可能です。送料は、5,500円(税込)以上のご注文で無料、それ未満は、本州 550円、北海道・九州 770円、沖縄・離島 1,100円です。天候や災害による遅れは、メールでお知らせします。

【お支払い】クレジットカード(VISA、Mastercard、JCB、American Express)、コンビニ払い、銀行振込、代金引換、電子マネーが使えます。コンビニ払いは、ご注文から5日以内に、お支払いください。期限を過ぎると、ご注文は自動的にキャンセルされます。銀行振込の手数料は、お客様の負担です。代金引換の手数料は、330円(税込)です。分割払いは、クレジットカードの3回・6回・12回に対応しています。

【領収書】ご注文の完了後、マイページの「注文履歴」から、領収書をダウンロードできます。宛名は、ご注文時のお名前になります。宛名の変更や、但し書きの追加は、ご注文から30日以内に、サポート窓口にご連絡ください。インボイス制度に対応した、適格請求書も発行できます。再発行は、何度でも無料です。

【ご注文の変更・キャンセル】発送前であれば、マイページから、変更やキャンセルができます。発送の準備が始まったあとは、変更できません。その場合は、お届け後の返品の手続きをご利用ください。お届け先の住所の変更は、発送前に限り、サポート窓口で承ります。

【ポイント】100円(税込)のお買い物につき、1ポイントが付きます。1ポイントは、1円として、次回以降のお買い物に使えます。有効期限は、最後に付与された日から1年間です。返品・キャンセルがあった場合、その注文で付与されたポイントは、取り消されます。ほかのお客様へのポイントの譲渡は、できません。

【会員登録】会員登録は無料です。登録すると、注文履歴の確認、お届け先の保存、ポイントの利用ができます。退会は、マイページから、いつでも可能です。退会すると、保有しているポイントは、すべて失効します。パスワードを忘れたときは、ログイン画面の「パスワードを再設定」から、登録したメールアドレスに届くリンクで、再設定してください。

【お問い合わせ】サポート窓口の受付時間は、平日の10時から18時です。メールでのお問い合わせは、24時間受け付けており、2営業日以内に返信します。お電話でのお問い合わせは、混み合う時間帯があります。お問い合わせの際は、ご注文番号(A-1234 の形式)をお知らせください。個人情報や、クレジットカードの番号は、メールに書かないでください。`

const QUESTIONS = ['返品できる期限は、いつまでですか?', '送料が無料になる金額を教えてください。', 'コンビニ払いの期限は、いつまでですか?']

type Row = { question: string; usage: Usage; fromApi: boolean }

// キーがないときに見せる、説明用の例(実際の API の出力ではない)。約1,000トークンの先頭部分を想定した数字
const SAMPLE_STABLE: Row[] = [
  { question: QUESTIONS[0], usage: { input_tokens: 38, output_tokens: 41, cache_creation_input_tokens: 1010, cache_read_input_tokens: 0 }, fromApi: false },
  { question: QUESTIONS[1], usage: { input_tokens: 36, output_tokens: 39, cache_creation_input_tokens: 0, cache_read_input_tokens: 1010 }, fromApi: false },
  { question: QUESTIONS[2], usage: { input_tokens: 37, output_tokens: 44, cache_creation_input_tokens: 0, cache_read_input_tokens: 1010 }, fromApi: false },
]
const SAMPLE_VOLATILE: Row[] = QUESTIONS.map((q, i) => ({ question: q, usage: { input_tokens: 38 - i, output_tokens: 40, cache_creation_input_tokens: 1030, cache_read_input_tokens: 0 }, fromApi: false }))

/** プロンプトキャッシュを、実際に試す: 同じ先頭部分で3回呼び、usage のキャッシュの項目を見る。 */
export default function CacheExperiment() {
  const api = useApi()
  const model = findModel(api.settings.model)
  const [mode, setMode] = useState<'stable' | 'volatile'>('stable')
  const [rows, setRows] = useState<Row[]>([])
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const abortRef = useRef<AbortController | null>(null)
  const priced = model.id in PRICES

  async function run() {
    setError('')
    setRows([])
    setRunning(true)
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const out: Row[] = []
      for (let i = 0; i < QUESTIONS.length; i++) {
        // 「時刻を先頭に入れる」場合は、毎回、先頭が変わる(キャッシュに一致しない)
        const text = mode === 'volatile' ? `現在時刻: ${new Date().toISOString()}(呼び出し ${i + 1})\n${POLICY}` : POLICY
        const request: Anthropic.Beta.MessageCreateParamsNonStreaming = {
          model: model.id,
          max_tokens: 1024,
          system: [{ type: 'text', text, cache_control: { type: 'ephemeral' } }],
          messages: [{ role: 'user', content: QUESTIONS[i] }],
          output_config: { effort: 'low' },
        }
        const message = await sendRequest(request, controller.signal)
        const u = message.usage
        out.push({
          question: QUESTIONS[i],
          fromApi: true,
          usage: {
            input_tokens: u.input_tokens,
            output_tokens: u.output_tokens,
            cache_creation_input_tokens: u.cache_creation_input_tokens ?? 0,
            cache_read_input_tokens: u.cache_read_input_tokens ?? 0,
          },
        })
        setRows([...out])
      }
    } catch (e) {
      setError(describeError(e))
    } finally {
      setRunning(false)
      abortRef.current = null
    }
  }

  const sample = () => {
    setError('')
    setRows(mode === 'stable' ? SAMPLE_STABLE : SAMPLE_VOLATILE)
  }

  const usages = rows.map((r) => r.usage)
  const costModel = priced ? model.id : 'claude-opus-5-5'
  const withCache = usages.reduce((s, u) => s + callCost(costModel, u), 0)
  const without = usages.reduce((s, u) => s + costWithoutCache(costModel, u), 0)

  return (
    <div className="demo cache-experiment">
      <h4>試す:プロンプトキャッシュを実測する</h4>
      <p className="muted">
        約1,400字(キャッシュできる最小の長さを超える長さ)の共通の先頭部分(店の方針)に、質問を変えて3回呼びます。応答の <code>usage</code> の、キャッシュの項目の変化を見ましょう。
        使うモデルは、API の設定で選んだもの(安く試すなら Haiku 5.5)です。3回で、数円もかかりません。
      </p>
      <div className="api-status">
        {api.apiKey ? (
          <span className="muted">{model.label} ・ <Link to="/api-key">設定を変更</Link></span>
        ) : (
          <span className="muted">APIキーが未設定です。説明用の例で確かめられます。実際に試すには <Link to="/api-key">APIキーを設定</Link> してください。</span>
        )}
      </div>
      <fieldset className="plain-fieldset">
        <legend className="muted">先頭部分</legend>
        <label><input type="radio" name="cache-mode" checked={mode === 'stable'} onChange={() => { setMode('stable'); setRows([]) }} /> 毎回、同じ(安定した先頭)</label>
        <label><input type="radio" name="cache-mode" checked={mode === 'volatile'} onChange={() => { setMode('volatile'); setRows([]) }} /> 先頭に、毎回変わる現在時刻を入れる</label>
      </fieldset>
      <div className="row">
        {api.apiKey && (running ? (
          <button className="secondary" onClick={() => abortRef.current?.abort()}>中断</button>
        ) : (
          <button onClick={run}>3回実行する</button>
        ))}
        <button className="secondary" onClick={sample} disabled={running}>説明用の例を見る</button>
      </div>
      {error && <p className="notice" role="alert">{error}</p>}
      {running && <p className="muted" aria-live="polite">実行中…({rows.length + 1} / 3)</p>}
      {rows.length > 0 && (
        <div role="status">
          {!rows[0].fromApi && <p className="muted">説明用に用意した例です。実際の API の出力ではありません(実際の値は、毎回異なります)。</p>}
          <table className="calc text cache-table">
            <thead>
              <tr><th>呼び出し</th><th>input_tokens</th><th>cache_creation_input_tokens</th><th>cache_read_input_tokens</th><th>プロンプトの長さ</th></tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{i + 1}: {r.question}</td>
                  <td>{r.usage.input_tokens}</td>
                  <td>{r.usage.cache_creation_input_tokens ?? 0}</td>
                  <td>{r.usage.cache_read_input_tokens ?? 0}</td>
                  <td>{promptTokens(r.usage)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            ヒット率(入力のうち、キャッシュから読んだ割合): <strong>{(cacheHitRate(usages) * 100).toFixed(0)}%</strong>
            {' ・ '}費用(キャッシュあり): <strong>{formatUsd(withCache)}</strong>
            {' ・ キャッシュなしだったら: '}<strong>{formatUsd(without)}</strong>
          </p>
          {!priced && <p className="muted">このモデルの単価はこのコースの表にないので、費用は Claude Opus 5.5 の単価で計算した目安です。</p>}
          <p className="muted">
            {mode === 'stable'
              ? '1回目は、先頭部分をキャッシュに書き込み(cache_creation)、2回目以降は、読み取り(cache_read)になるはずです。'
              : '先頭が毎回変わるので、どの呼び出しも書き込みになり、読み取りは0のままのはずです(書き込みの割増の分だけ、損をします)。'}
            モデルによっては、キャッシュが効くまでに、数秒かかることがあります。
          </p>
        </div>
      )}
    </div>
  )
}
