import { useState } from 'react'
import { Slider } from '../components'
import { MODELS, formatUsd } from '../api/settings'
import { PRICES, WRITE_MULTIPLIER, breakEvenReads, cachingSavings } from '../capstone2/cost'

/** キャッシュで得をするかを、計算で確かめる: 先頭部分の長さ・呼び出しの回数・有効期限切れの回数。 */
export default function CacheCalc() {
  const [model, setModel] = useState('claude-opus-5-5')
  const [prefix, setPrefix] = useState(5000)
  const [n, setN] = useState(10)
  const [ttl, setTtl] = useState<'5m' | '1h'>('5m')
  const [expired, setExpired] = useState(0)
  const hits = Math.max(0, n - 1 - expired)
  const r = cachingSavings(model, prefix, n, ttl, hits)
  const be = breakEvenReads(model, ttl)
  const p = PRICES[model]

  return (
    <div className="demo cache-calc">
      <h4>試す:キャッシュで、いくら得をするか</h4>
      <p className="muted">同じ先頭部分を何回使うかと、有効期限切れで読めなかった回数から、先頭部分の入力費用を比べます(出力と、先頭より後ろの入力は含みません)。</p>
      <div className="row">
        <label className="row">モデル
          <select className="sel-input" value={model} onChange={(e) => setModel(e.target.value)}>
            {MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </label>
        <label className="row">書き込みの種類
          <select className="sel-input" value={ttl} onChange={(e) => setTtl(e.target.value as '5m' | '1h')}>
            <option value="5m">5分のキャッシュ(書き込み {WRITE_MULTIPLIER['5m']}倍)</option>
            <option value="1h">1時間のキャッシュ(書き込み {WRITE_MULTIPLIER['1h']}倍)</option>
          </select>
        </label>
      </div>
      <Slider label="共通の先頭部分のトークン数" value={prefix} min={1000} max={100000} step={1000} onChange={setPrefix} format={(v) => v.toLocaleString('ja-JP')} />
      <Slider label="その先頭部分を使う呼び出しの回数" value={n} min={1} max={50} step={1} onChange={(v) => { setN(v); setExpired(Math.min(expired, Math.max(0, v - 1))) }} />
      <Slider label="期限切れで、読めなかった回数" value={Math.min(expired, Math.max(0, n - 1))} min={0} max={Math.max(0, n - 1)} step={1} onChange={setExpired} />
      <table className="calc text">
        <tbody>
          <tr><td>キャッシュなし</td><td>{formatUsd(r.without)}</td></tr>
          <tr><td>キャッシュあり(書き込み {1 + Math.min(expired, n - 1)} 回・読み取り {hits} 回)</td><td>{formatUsd(r.withCache)}</td></tr>
          <tr><td>差し引き</td><td id="calc-saved"><strong>{r.saved >= 0 ? `${formatUsd(r.saved)} 得` : `${formatUsd(-r.saved)} 損`}</strong></td></tr>
        </tbody>
      </table>
      <p className="muted" role="status">
        {MODELS.find((m) => m.id === model)?.label} の、読み取りの単価は、通常の入力の {p.cacheReadMultiplier * 100}%。
        書き込みの割増の分は、<strong>{be} 回の読み取り</strong>で元が取れます。読み取りが0回(毎回、期限切れや、先頭が変わる)だと、書き込みの割増の分だけ損をします。
      </p>
    </div>
  )
}
