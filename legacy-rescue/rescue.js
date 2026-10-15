// 旧サイト向けの、移行の案内と進捗の書き出し(ローカル試作。Issue #23、docs/seo/hosting.md §5.2)。
// アプリ本体とは独立した、静的な 1 ページ。読むのは localStorage の `llm-learning:progress` だけ(全体の一括取得はしない)。
// この画面は、localStorage に書き込まない・削除しない(setItem / removeItem / clear を呼ばない)。データの送信もしない(fetch / XHR / 計測なし)。
// 新サイトの URL は、ビルド時に埋め込む(scripts/build-legacy-rescue.mjs)。この試作では、ローカル(localhost / 127.0.0.1)だけを許可する。
(function () {
  'use strict'
  var KEY = 'llm-learning:progress'
  var NEW_ORIGIN = '__NEW_ORIGIN__' // 例: http://localhost:4175(末尾のスラッシュなし)
  var DELAY_MS = 3000

  var $ = function (id) { return document.getElementById(id) }
  var isObject = function (v) { return !!v && typeof v === 'object' && !Array.isArray(v) }

  /**
   * 保存データの状態を、区別して返す。
   *  - unreadable: 読み取りに失敗(ストレージの拒否など)。空とは扱わない
   *  - none: 保存なし(キーがない)。読み取りは成功している
   *  - corrupt: JSON として読めない
   *  - unknown: JSON だが、既知の形式(version 1)ではない
   *  - empty: 既知の正常な形式で、学習記録(完了・クイズ・問題・しおり)が空
   *  - progress: 既知の正常な形式で、学習記録がある
   */
  function inspect() {
    var raw
    try {
      raw = window.localStorage.getItem(KEY)
    } catch (e) {
      return { kind: 'unreadable', raw: null }
    }
    if (raw === null) return { kind: 'none', raw: null }
    var parsed
    try {
      parsed = JSON.parse(raw)
    } catch (e) {
      return { kind: 'corrupt', raw: raw }
    }
    var ok =
      isObject(parsed) && parsed.version === 1 && isObject(parsed.completed) && isObject(parsed.quiz) &&
      (parsed.questions === undefined || isObject(parsed.questions)) &&
      (parsed.reading === undefined || isObject(parsed.reading))
    if (!ok) return { kind: 'unknown', raw: raw }
    var n = Object.keys(parsed.completed).length + Object.keys(parsed.quiz).length +
      Object.keys(parsed.questions || {}).length + Object.keys(parsed.reading || {}).length
    return { kind: n === 0 ? 'empty' : 'progress', raw: raw, parsed: parsed }
  }

  /** アプリの exportJson と同じ形(questions / reading を補い、整形して出力する)。新サイトの「インポート」に通る。 */
  function exportText(parsed) {
    var state = {}
    Object.keys(parsed).forEach(function (k) { state[k] = parsed[k] })
    state.questions = parsed.questions || {}
    state.reading = parsed.reading || {}
    return JSON.stringify(state, null, 2)
  }

  function download(text, name, type) {
    var blob = new Blob([text], { type: type })
    var a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(function () { URL.revokeObjectURL(a.href) }, 1000)
  }

  /**
   * 旧ハッシュ URL(#/lesson/pm-1 など)を、新サイトの URL にする。サイト内の転送に限る。
   * 先頭が `//`、バックスラッシュ、制御文字、`.` と `..` の区間は拒否(null)。パスにだけスラッシュを足し、search と hash は保つ。
   */
  function mapHash(hash) {
    if (hash.indexOf('#/') !== 0) return null
    var raw = hash.slice(2)
    if (raw.charAt(0) === '/' || /[\\\u0000-\u001f]/.test(raw)) return null
    var m = /^([^?#]*)(.*)$/.exec(raw)
    if (/(^|\/)(\.|%2e){1,2}(\/|$)/i.test(m[1])) return null
    var route = m[1].replace(/\/+$/, '')
    var target
    try { target = new URL(NEW_ORIGIN + '/' + (route ? route + '/' : '') + m[2]) } catch (e) { return null }
    if (target.origin !== NEW_ORIGIN) return null
    return target.href
  }

  function isLocalOrigin(o) { return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o) }

  var info = inspect()
  var mapped = mapHash(location.hash)
  var newHref = mapped || NEW_ORIGIN + '/'
  $('link-new').href = newHref
  $('new-origin').textContent = NEW_ORIGIN + '/'

  var text = $('status-text')
  var actions = $('actions')
  var btnExport = $('btn-export')
  var btnRaw = $('btn-raw')
  var btnStop = $('btn-stop')
  var result = $('result')

  function show(el, on) { el.hidden = !on }

  function backupButtons(withExport) {
    show(actions, true)
    show(btnExport, withExport)
    show(btnRaw, true)
    btnExport.onclick = function () {
      download(exportText(info.parsed), 'llm-learning-progress.json', 'application/json')
      result.textContent = '進捗を書き出しました(llm-learning-progress.json)。このファイルを、新サイトの「進捗と設定」から読み込んでください。'
    }
    btnRaw.onclick = function () {
      download(info.raw, 'llm-learning-progress-raw-backup.txt', 'text/plain')
      result.textContent = '元の保存データを、そのまま保存しました(llm-learning-progress-raw-backup.txt)。このファイルが、新サイトの「インポート」で読み込めるとは限りません。'
    }
  }

  switch (info.kind) {
    case 'progress':
      text.textContent = '学習の進捗が保存されています。自動では移動しません。先に、書き出してバックアップを取ってください。'
      backupButtons(true)
      break
    case 'corrupt':
      text.textContent = '保存されたデータを、読み取れませんでした(JSON として壊れています)。このページは、元のデータを変更・削除しません。自動では移動しません。元の保存データを、そのまま保存してください。新サイトの「インポート」で読み込めるとは限りません。'
      backupButtons(false)
      break
    case 'unknown':
      text.textContent = '保存されたデータが、この画面の知っている形式ではありません(未知の version または形式)。元のデータを変更・削除せず、自動では移動しません。元の保存データを、そのまま保存してください。新サイトの「インポート」で読み込めるとは限りません。'
      backupButtons(false)
      break
    case 'unreadable':
      text.textContent = 'このブラウザでは、保存データを読み取れませんでした(ストレージが無効か、拒否されています)。進捗の有無を確認できないので、自動では移動しません。ブラウザの設定(Cookie・サイトデータの許可、プライベートモード)を確認して、読み込み直してください。'
      break
    default: // none, empty
      text.textContent = info.kind === 'none'
        ? '保存された進捗は、見つかりませんでした。'
        : '保存された進捗に、学習の記録はありませんでした。'
      if (isLocalOrigin(NEW_ORIGIN)) {
        var left = Math.round(DELAY_MS / 1000)
        var cd = $('countdown')
        show(cd, true)
        show(actions, true)
        show(btnStop, true)
        cd.textContent = left + ' 秒後に、新サイトへ移動します。'
        var stopped = false
        var timer = setInterval(function () {
          left -= 1
          if (left <= 0) {
            clearInterval(timer)
            if (!stopped) location.replace(newHref)
          } else if (!stopped) cd.textContent = left + ' 秒後に、新サイトへ移動します。'
        }, 1000)
        btnStop.onclick = function () {
          stopped = true
          clearInterval(timer)
          show(btnStop, false)
          cd.textContent = '自動の移動を止めました。下の「新サイトを開く」から移動できます。'
        }
      }
  }
})()
