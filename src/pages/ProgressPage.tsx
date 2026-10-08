import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ProgressBar } from '../components'
import { stages } from '../data/curriculum'
import { overallMinutes, overallStats, stageStats } from '../data/stats'
import { isReady } from '../lessons'
import { progressActions, useProgress } from '../progress'
import { formatMinutes } from '../time'

export default function ProgressPage() {
  const p = useProgress()
  const { done, total, percent } = overallStats(p)
  const time = overallMinutes(p)
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')

  function download() {
    const blob = new Blob([progressActions.exportJson()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'llm-learning-progress.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function onImport(file: File | undefined) {
    if (!file) return
    const ok = progressActions.importJson(await file.text())
    setMessage(ok ? '進捗を読み込みました。' : '読み込めませんでした。ファイルの形式を確認してください。')
    if (fileRef.current) fileRef.current.value = ''
  }

  function reset() {
    if (window.confirm('進捗をすべて消去します。よろしいですか?')) {
      progressActions.reset()
      setMessage('進捗をリセットしました。')
    }
  }

  return (
    <>
      <h1>進捗と設定</h1>
      <section className="card">
        <div className="row between">
          <strong>全体</strong>
          <span>{percent}%({done} / {total})</span>
        </div>
        <ProgressBar value={percent} label="全体の進捗" />
        <p className="muted time-line">
          学習時間の目安: 全体で {formatMinutes(time.total, true)} ・ 残り <strong>{formatMinutes(time.remaining, true)}</strong>
        </p>
      </section>

      {stages.map((s) => {
        const st = stageStats(s, p)
        return (
          <section key={s.id} className="card">
            <div className="row between">
              <Link to={`/stage/${s.id}`} className="stage-link"><strong>{s.title}</strong></Link>
              <span className="muted">{st.total === 0 ? '準備中' : `${st.done} / ${st.total}`}</span>
            </div>
            <ul className="plain">
              {s.lessons.filter((l) => isReady(l.id)).map((l) => {
                const at = p.completed[l.id]
                const quiz = p.quiz[l.id]
                return (
                  <li key={l.id}>
                    {at ? '✓' : '○'} <Link to={`/lesson/${l.id}`}>{l.title}</Link>
                    <span className="muted">
                      {at && ` 完了 ${new Date(at).toLocaleDateString('ja-JP')}`}
                      {quiz && ` / クイズ ${quiz.best}/${quiz.total}`}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}

      <h2>データの管理</h2>
      <p className="muted">
        進捗はこのブラウザのlocalStorageにのみ保存されます。ブラウザの変更やデータ削除に備え、
        JSONでバックアップできます。
      </p>
      <div className="row">
        <button onClick={download}>エクスポート</button>
        <button className="secondary" onClick={() => fileRef.current?.click()}>インポート</button>
        <button className="danger" onClick={reset}>リセット</button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => onImport(e.target.files?.[0])}
        />
      </div>
      {message && <p role="status">{message}</p>}
    </>
  )
}
