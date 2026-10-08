import { useState } from 'react'
import { checkKey, describeError } from '../api/client'
import { MODELS, apiActions, formatUsd, useApi, type Effort } from '../api/settings'

export default function ApiKeyPage() {
  const api = useApi()
  const [key, setKey] = useState('')
  const [mode, setMode] = useState<'memory' | 'session'>(api.keyMode)
  const [check, setCheck] = useState('')
  const [checking, setChecking] = useState(false)

  async function test() {
    setChecking(true)
    setCheck('')
    try {
      const m = await checkKey()
      setCheck(`接続できました(${m.display_name})。`)
    } catch (e) {
      setCheck(describeError(e))
    } finally {
      setChecking(false)
    }
  }

  return (
    <>
      <h1>Claude API の設定</h1>
      <p className="lead">第2部のレッスンでは、このブラウザから Claude API を直接呼び出して試せます。設定しなくても、用意した応答の例で流れを学べます。</p>

      <section className="card notice-card">
        <strong>APIキーを入力する前に</strong>
        <ul>
          <li>キーは、このブラウザから Anthropic の API(api.anthropic.com)に直接送られます。このサイトのサーバーには送られません(このサイトはサーバーを持ちません)。</li>
          <li>キーはこのページのメモリか、タブを閉じると消える領域(sessionStorage)にだけ置きます。進捗データやエクスポートには含めません。</li>
          <li>それでもブラウザ上のキーは、拡張機能や共有PCなどから漏れるおそれがあります。<strong>学習専用のキー</strong>を作り、可能なら<strong>利用上限を設定</strong>し、使い終わったら<strong>無効化</strong>してください。</li>
          <li>API の利用には料金がかかります。実行のたびに、トークン数と概算の費用を表示します。</li>
          <li>本番のアプリでは、キーをブラウザに置かず、サーバー側から API を呼び出してください(9-1 で説明します)。</li>
        </ul>
      </section>

      <section className="card">
        <h2 className="card-title">APIキー</h2>
        <p>状態: {api.apiKey ? <strong>設定済み({api.keyMode === 'session' ? 'タブを閉じるまで保持' : 'このページのメモリのみ'})</strong> : '未設定'}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!key.trim()) return
            apiActions.setKey(key, mode)
            setKey('')
            setCheck('')
          }}
        >
          <label className="field">
            <span className="muted">APIキー(sk-ant- で始まる文字列)</span>
            <input
              className="text-input"
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={api.apiKey ? '新しいキーで置き換える' : 'sk-ant-...'}
            />
          </label>
          <fieldset className="plain-fieldset">
            <legend className="muted">保存のしかた</legend>
            <label><input type="radio" checked={mode === 'memory'} onChange={() => setMode('memory')} /> このページのメモリのみ(再読み込みで消える・最も安全)</label>
            <label><input type="radio" checked={mode === 'session'} onChange={() => setMode('session')} /> このタブを閉じるまで保持(sessionStorage)</label>
          </fieldset>
          <div className="row">
            <button type="submit" disabled={!key.trim()}>保存する</button>
            <button type="button" className="secondary" onClick={test} disabled={!api.apiKey || checking}>接続を確認する</button>
            <button type="button" className="danger" onClick={() => { apiActions.clearKey(); setCheck('') }} disabled={!api.apiKey}>キーを削除する</button>
          </div>
        </form>
        {check && <p role="status">{check}</p>}
        <p className="muted">接続の確認は、モデル情報の取得で行うため、トークンを消費しません。</p>
      </section>

      <section className="card">
        <h2 className="card-title">実行の設定</h2>
        <label className="field">
          <span className="muted">モデル(100万トークンあたりの料金: 入力 / 出力)</span>
          <select className="sel-input" value={api.settings.model} onChange={(e) => apiActions.updateSettings({ model: e.target.value })}>
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.label} ・ ${m.input} / ${m.output} ・ {m.note}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="muted">effort(考える深さ。高いほど丁寧だが、出力トークンと時間が増える)</span>
          <select className="sel-input" value={api.settings.effort} onChange={(e) => apiActions.updateSettings({ effort: e.target.value as Effort })}>
            <option value="low">low(学習用の既定。安く速い)</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </label>
        <label className="field">
          <span className="muted">最大出力トークン(max_tokens。費用の上限にもなる)</span>
          <input
            className="text-input"
            type="number"
            min={256}
            max={16000}
            step={256}
            value={api.settings.maxTokens}
            onChange={(e) => {
              const v = e.target.valueAsNumber
              if (Number.isFinite(v)) apiActions.updateSettings({ maxTokens: Math.min(16000, Math.max(256, Math.round(v))) })
            }}
          />
        </label>
        <label><input type="checkbox" checked={api.settings.showThinking} onChange={(e) => apiActions.updateSettings({ showThinking: e.target.checked })} /> 思考の要約を表示する(thinking の display: "summarized")</label>
      </section>

      <section className="card">
        <h2 className="card-title">このタブでの利用量</h2>
        <p>
          呼び出し {api.usage.calls} 回 ・ 入力 {api.usage.input.toLocaleString()} ・ 出力 {api.usage.output.toLocaleString()} トークン ・ 概算 <strong>{formatUsd(api.usage.cost)}</strong>
        </p>
        <p className="muted">標準料金での概算です。正確な請求額は Claude Console で確認してください。</p>
      </section>
    </>
  )
}
