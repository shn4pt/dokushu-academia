// 旧サイト向けの、移行の案内と進捗の書き出し(ローカル試作。Issue #23、docs/seo/hosting.md §5.2)。
// アプリ本体とは独立した、静的な 1 ページ。読むのは localStorage の `llm-learning:progress` だけ(全体の一括取得はしない)。
// この画面は、localStorage に書き込まない・削除しない(setItem / removeItem / clear を呼ばない)。データの送信もしない(fetch / XHR / 計測なし)。
// 新サイトの URL は、ビルド時に埋め込む(scripts/build-legacy-rescue.mjs)。この試作では、ローカル(localhost / 127.0.0.1)だけを許可する。
(function () {
  'use strict'
  var KEY = 'llm-learning:progress'
  var NEW_ORIGIN = '__NEW_ORIGIN__' // 例: http://localhost:4175(末尾のスラッシュなし)
  var DELAY_MS = 3000
  var AUTO_FORWARD = __AUTO_FORWARD__ // 運営者の設定(ビルド時)。false なら、自動転送を一括で無効にし、手動のリンクだけにする

  var $ = function (id) { return document.getElementById(id) }
  var isObject = function (v) { return !!v && typeof v === 'object' && !Array.isArray(v) }

  var isStr = function (v) { return typeof v === 'string' }
  var isNum = function (v) { return typeof v === 'number' && isFinite(v) }
  var onlyKeys = function (o, keys) { return Object.keys(o).every(function (k) { return keys.indexOf(k) !== -1 }) }
  var every = function (o, f) { return Object.keys(o).every(function (k) { return f(o[k]) }) }

  /**
   * 保守的な、既知の形式の検証(アプリの進捗の形: src/progress.ts)。**未知の項目・型の違いは、すべて「既知でない」**とする。
   * 既存のアプリの import は、浅い型の検査で受け入れる。移行のために、正常と確定できることとは、別。
   */
  function isKnownProgress(p) {
    if (!isObject(p) || p.version !== 1) return false
    if (!onlyKeys(p, ['version', 'completed', 'quiz', 'questions', 'reading', 'lastVisited'])) return false
    if (!isObject(p.completed) || !every(p.completed, isStr)) return false
    if (!isObject(p.quiz) || !every(p.quiz, function (q) { return isObject(q) && onlyKeys(q, ['best', 'total']) && isNum(q.best) && isNum(q.total) })) return false
    if (p.questions !== undefined) {
      if (!isObject(p.questions)) return false
      if (!every(p.questions, function (q) {
        return isObject(q) && onlyKeys(q, ['right', 'wrong', 'streak', 'last', 'at']) &&
          isNum(q.right) && isNum(q.wrong) && isNum(q.streak) && (q.last === 'right' || q.last === 'wrong') && isStr(q.at)
      })) return false
    }
    if (p.reading !== undefined) {
      if (!isObject(p.reading)) return false
      if (!every(p.reading, function (r) {
        return isObject(r) && onlyKeys(r, ['section', 'index', 'at']) && isStr(r.section) && isStr(r.at) && (r.index === undefined || isNum(r.index))
      })) return false
    }
    if (p.lastVisited !== undefined && !(isStr(p.lastVisited) && p.lastVisited.length > 0)) return false
    return true
  }

  /**
   * 保存データの状態を、区別して返す。
   *  - unreadable: 読み取りに失敗(ストレージの拒否など)。空とは扱わない
   *  - none: 保存なし(キーがない)。読み取りは成功している
   *  - corrupt: JSON として読めない
   *  - unknown: JSON だが、既知の形式(version 1。項目・型が既知のもの)ではない。未知の追加項目、型の違いを含む
   *  - empty: 既知の正常な形式で、記録(完了・クイズ・問題・しおり・最後に見たレッスン)が、すべてない
   *  - progress: 既知の正常な形式で、記録が 1 つでもある(最後に見たレッスンだけの場合を含む)
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
    if (!isKnownProgress(parsed)) return { kind: 'unknown', raw: raw }
    var n = Object.keys(parsed.completed).length + Object.keys(parsed.quiz).length +
      Object.keys(parsed.questions || {}).length + Object.keys(parsed.reading || {}).length + (parsed.lastVisited ? 1 : 0)
    return { kind: n === 0 ? 'empty' : 'progress', raw: raw, parsed: parsed }
  }

  /** アプリの exportJson と同じ形(questions / reading を補い、整形して出力する)。**既知の進捗の項目だけ**で作る(検証済みなので、未知の項目は、ここに来ない)。新サイトの「インポート」に通る。 */
  function exportText(parsed) {
    var state = { version: 1, completed: parsed.completed, quiz: parsed.quiz, questions: parsed.questions || {}, reading: parsed.reading || {} }
    if (parsed.lastVisited) state.lastVisited = parsed.lastVisited
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

  var info
  var mapped = mapHash(location.hash)
  var newHref = mapped || NEW_ORIGIN + '/'
  $('link-new').href = newHref
  $('new-origin').textContent = NEW_ORIGIN + '/'

  var text = $('status-text')
  var actions = $('actions')
  var btnExport = $('btn-export')
  var btnRaw = $('btn-raw')
  var btnStop = $('btn-stop')
  var cd = $('countdown')
  var result = $('result')
  var timer = null

  function show(el, on) { el.hidden = !on }

  var RAW_NOTE = '元の保存データには、進捗以外の内容が含まれている可能性があります。このファイルは、外部に共有しないでください。'

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
      result.textContent = '元の保存データを、そのまま保存しました(llm-learning-progress-raw-backup.txt)。' + RAW_NOTE + 'このファイルが、新サイトの「インポート」で読み込めるとは限りません。'
    }
  }

  function stopTimer() {
    if (timer) { clearInterval(timer); timer = null }
  }

  /** 状態の表示を、最初から組み立てる(再確認で状態が変わったときにも使う)。 */
  function render() {
    stopTimer()
    show(actions, false); show(btnExport, false); show(btnRaw, false); show(btnStop, false); show(cd, false)
    result.textContent = ''
    switch (info.kind) {
      case 'progress':
        text.textContent = '学習の進捗(最後に見たレッスンだけの場合を含む)が保存されています。自動では移動しません。先に、書き出してバックアップを取ってください。'
        backupButtons(true)
        break
      case 'corrupt':
        text.textContent = '保存されたデータを、読み取れませんでした(JSON として壊れています)。このページは、元のデータを変更・削除しません。自動では移動しません。元の保存データを、そのまま保存してください。新サイトの「インポート」で読み込めるとは限りません。' + RAW_NOTE
        backupButtons(false)
        break
      case 'unknown':
        text.textContent = '保存されたデータが、この画面の知っている形式ではありません(未知の version・項目、または型が違う値を含みます)。元のデータを変更・削除せず、自動では移動しません。元の保存データを、そのまま保存してください。新サイトの「インポート」で読み込めるとは限りません。' + RAW_NOTE
        backupButtons(false)
        break
      case 'unreadable':
        text.textContent = 'このブラウザでは、保存データを読み取れませんでした(ストレージが無効か、拒否されています)。進捗の有無を確認できないので、自動では移動しません。ブラウザの設定(Cookie・サイトデータの許可、プライベートモード)を確認して、読み込み直してください。'
        break
      default: // none, empty
        text.textContent = info.kind === 'none'
          ? '保存された進捗は、見つかりませんでした。'
          : '保存された進捗に、学習の記録はありませんでした。'
        if (AUTO_FORWARD && isLocalOrigin(NEW_ORIGIN)) startCountdown()
        else {
          show(cd, true)
          cd.textContent = '自動の移動は、行いません。下の「新サイトを開く」から移動できます。'
        }
    }
  }

  function startCountdown() {
    var left = Math.round(DELAY_MS / 1000)
    show(cd, true)
    show(actions, true)
    show(btnStop, true)
    cd.textContent = left + ' 秒後に、新サイトへ移動します。'
    timer = setInterval(function () {
      left -= 1
      if (left > 0) { cd.textContent = left + ' 秒後に、新サイトへ移動します。'; return }
      stopTimer()
      // 移動の直前に、保存状態を再確認する(待っている間に、別のタブで進捗が増えた場合を守る)
      info = inspect()
      if (info.kind === 'none' || info.kind === 'empty') location.replace(newHref)
      else render()
    }, 1000)
    btnStop.onclick = function () {
      stopTimer()
      show(btnStop, false)
      cd.textContent = '自動の移動を止めました。下の「新サイトを開く」から移動できます。'
    }
  }

  info = inspect()
  render()
})()
