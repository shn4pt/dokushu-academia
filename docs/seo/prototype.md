# SEO・AEO 第2段階: 3 ページの本文 HTML と通常 URL の試作(Issue #15)

設計(`docs/seo/plan.md`、PR #14 でマージ済み)の成立性を、**講座一覧・PM の講座・PM-1** で確かめた試作の記録。**本番のビルド・デプロイは、ハッシュ版のまま**で、全教材の展開、本番への切り替え、ドメイン、契約、private 化は、していない。Codex が試作をレビューし、全展開の条件を決める。

## 基準
- **基準コミット**: `f1d0daf`(PR #14 のマージ後の `main`)。ブランチ `seo-prototype`。設計 PR と、この実装の変更は、混ぜていない。
- **実行環境**: Node 22.23.3、Playwright の Chromium、macOS。
- **新しい依存関係**: なし(Vite の SSR と、既存の `react-dom/server`、`react-router-dom` だけ)。

## 実行するコマンド

| コマンド | 内容 | 出力 |
|---|---|---|
| `npm run build` | **本番のハッシュ版**(変更なし。`deploy.yml` が使う) | `dist/` |
| `npm run build:path` | パス版。ベース `/dokushu-academia/`(GitHub Pages のプロジェクト配下の形) | `dist-path/` |
| `npm run build:path:root` | パス版。ベース `/`(独自ドメインの、ルート配下の形) | `dist-path-root/` |
| `npm run serve:path` | パス版を、手元で配信(`http://localhost:4174/dokushu-academia/`) | |
| `npx playwright test --project=path` | 試作の検査(41 件) | |
| `npx playwright test` | 既存の全テスト + 試作の検査(990 件) | |

- 環境変数: `SITE_BASE`(ベース。`/` で始まり、`/` で終わる)、`SITE_ORIGIN`(正規 URL のオリジン。既定 `https://shn4pt.github.io`)、`OUT_DIR`(出力先。`dist` は、拒否する)。実際のドメインは、不要。
- パス版の出力は、`.gitignore` に入れ、本番の `dist/` と混ざらない。`deploy.yml` は、変更していない(`npm run build` と `path: dist` のまま)。CI(`ci.yml`)は、試作の検査のために、`build:path` と `build:path:root` を足した。
- 静的配信 `scripts/serve-static.mjs` は、GitHub Pages に近い挙動(ディレクトリの `index.html`、スラッシュなしのパスを 301、`404.html` を 404 のステータスで返す)を再現する。**GitHub Pages 自体の挙動の確認ではない**(未確認のまま。§限界)。SPA の全 URL に 200 で `index.html` を返す配信では、検証していない。

## 生成対象

| ルート | ファイル | 種類 | noindex | canonical |
|---|---|---|---|---|
| `/catalog` | `catalog/index.html` | 本文入り HTML | なし | `<オリジン><ベース>catalog/` |
| `/course/pm` | `course/pm/index.html` | 本文入り HTML | なし | `…course/pm/` |
| `/lesson/pm-1` | `lesson/pm-1/index.html` | 本文入り HTML | なし | `…lesson/pm-1/` |
| `/`(`/index.html`) | `index.html` | 講座一覧と同じ内容 | なし | **`…catalog/`**(`/catalog/` にそろえた) |
| `/progress` | `progress/index.html` | ブラウザで描画する殻(本文なし) | あり | なし |
| 見つからないページ | `404.html` | ブラウザで描画する殻 | あり | なし |

そのほかに、`sitemap.xml`(**生成した公開ページ 3 件だけ**。`/` と殻は載せない)、`legacy-redirect.js`(旧ハッシュ URL の転送。外部ファイル)、`prerender-manifest.json`(生成の一覧)。

## HTTP の結果(`scripts/serve-static.mjs`、パス版)

| URL | ステータス | 転送先 | バイト数 |
|---|---|---|---|
| `…/dokushu-academia/catalog/` | 200 | | 21,350 |
| `…/dokushu-academia/course/pm/` | 200 | | 10,607 |
| `…/dokushu-academia/lesson/pm-1/` | 200 | | 42,040 |
| `…/dokushu-academia/`、`…/index.html` | 200 | | 21,297 |
| `…/dokushu-academia/progress/`(殻) | 200 | | 1,892 |
| `…/dokushu-academia/lesson/pm-1`(スラッシュなし) | **301** | `/dokushu-academia/lesson/pm-1/` | 0 |
| `…/dokushu-academia/lesson/pm-2/`(**生成していない**) | **404** | | 1,715(殻) |
| `…/dokushu-academia/lesson/nothing/`、`…/nothing/` | **404** | | 1,715(殻) |
| `…/dokushu-academia/sitemap.xml` | 200 | | 341 |
| ルート配下 `…:4175/lesson/pm-1/`、`…/sitemap.xml` | 200 | | 41,598、290 |

3 ページの HTML には、主要本文、出典と更新記録(折りたたみの中身も)、内部リンク(ベース付きの `<a href>`)、ページ固有の `<title>`・description・canonical・og:title・og:description・og:url・og:type が、含まれる。`<h1>` と、クイズの問題文・選択肢も、含まれる。**「読み込み中…」は、ない。ハッシュのリンク(`#/`)も、ない**。個人の進捗・キーは、含まれない(HTML に `llm-learning:` や `sk-ant` がないことを検査)。

## 構成(変更・追加したファイル)

- **切り替えの仕組み**: `src/site.ts`(`PATH_MODE`、`SITE_BASE`、`SITE_ORIGIN`。ビルド時の `VITE_SITE_MODE=path` で決まる。通常のビルドでは false で、挙動は変わらない)、`vite.config.ts`(パス版のときだけ、ベースと出力先を切り替え)。
- **生成**: `src/entry-server.tsx`(`renderToString`。`renderToStaticMarkup` は使わない)、`scripts/prerender.mjs`(同じ `App` を、サーバーで描画して、ページごとに書き出す)、`scripts/build-path.mjs`(ビルドの手順)。
- **引き継ぎ**: `src/main.tsx`(生成した HTML(`data-ssr`)があれば `hydrateRoot`、殻や、生成していないページは `createRoot`。`onRecoverableError` で、回復可能なエラーを記録し、`window.__recoverableErrors` に積む)、`src/lessons/preload.ts`(本文を、描画の前に読み込んで渡す)、`src/pages/LessonPage.tsx`(最初の描画から、事前に読み込んだ本文を使う)、`src/progress.ts`(`getServerSnapshot` は**モジュールの定数**。`useProgressReady` を追加。下記)。
- **メタ情報**: `src/seo.ts`(ルートから、title / description / canonical / 共有情報 / robots を作る。**初期 HTML の生成と、ページ移動後の head の更新で、同じ関数**。既存のデータだけを使い、新しい本文を書き写さない)、`src/ui/MetaUpdater.tsx`(ページ移動のたびに head を更新。重複させず、不要なタグを除く。スラッシュなしの URL を、スラッシュ付きに置き換える)。
- **見つからないページ**: `src/ui/NotFound.tsx`、`src/App.tsx`・`CoursePage.tsx`・`StagePage.tsx`・`LessonPage.tsx`(パス版では、未知のルート・ID を、ほかのページへ移さず、「見つかりません」と講座一覧へのリンクにする。ハッシュ版は、これまでどおり)。
- **内部リンク**: `src/lessons/mdparse.ts`・`markdown.tsx`(パス版では、本文の内部リンクを、ベース付きの正規 URL(末尾スラッシュ)にし、クリックは、ブラウザ内の移動にする)、`src/pages/ReviewPage.tsx`(固定のハッシュのリンクを `Link` に)。
- **配信・検査**: `scripts/serve-static.mjs`、`playwright.config.ts`(パス版の出力があるときだけ、静的配信と `path` プロジェクトを足す)、`e2e/prototype.path.spec.ts`、`.github/workflows/ci.yml`、`package.json`、`.gitignore`。

## 引き継ぎ(ハイドレーション)の記録

- 3 ページ × 進捗なし/あり = **6 通り**と、ルート配下の PM-1 で、`window.__recoverableErrors`(回復可能なエラー)が空で、コンソールの警告・エラーもない(フィクスチャーが、`console.error` を失敗にする)。進捗ありでは、引き継ぎの後に、ヘッダーの進捗が、保存済みの値(1% 以上)に更新される。進捗なしでは、0%。
- **404 の殻や、生成していないページ(PM-2 など)**は、HTML に `data-ssr` がなく、`createRoot` でブラウザが描画する(無条件に `hydrateRoot` しない)。
- **検査で見つかった不具合と、その修正**: 生成した HTML を引き継ぐと、「前回の続きから読む」の案内が出なかった。引き継ぎの最初の描画は、サーバーと同じ空の進捗で、保存済みの進捗は、その後に更新される。一方、案内を決める処理は、最初の 1 回だけ、進捗を読んでいた(ハッシュ版は、最初の描画から、保存済みの進捗があったので、問題がなかった)。**`useProgressReady`(引き継ぎの間は false、後で true)を足し、案内の処理を、true になってから行うようにした**。ハッシュ版の挙動は、変わらない(最初から true)。
- **設計の E2 で見つかった不一致(数値の最後の桁 3 件、`CodeOrder` 4 件)は、今回の対象 3 ページに、関係しない**(対象は、PM-1・講座一覧・PM の講座。E2 でも、PM-1 は警告なし)。**修正していない。全展開前の残件として記録する**。

## 進捗の検証

テスト用のプロファイル(読了 2、クイズ 1、復習の記録 1、読み位置 1、最終訪問のある進捗)を、ページの読み込み前に入れて、PM-1 を直接開く。

| 操作 | 結果 |
|---|---|
| 直接アクセス | 引き継ぎの警告なし。「前回は『3 つの要点』まで読みました」の案内が出る(読み位置から再開) |
| 「続きから読む」 | 動く |
| 折りたたみ(演習の回答例) | 開いて、表が見える |
| クイズ 5 問に答える | 「5 / 5 問正解」 |
| 完了にする | 「✓ 完了済み」 |
| 保存データ | **保存済みの読了(2 件)・クイズの最高点・復習の記録が、消えず、初期化されない**(読了の日時、クイズの最高点以上、復習の正誤の回数以上)。正常な閲覧処理による更新(最終訪問が `pm-1` に、完了後の読み位置の削除)は、許し、**訪問後の JSON 全体の完全一致を、条件にしていない** |
| 再読み込み | 完了の状態が、反映される |
| 進捗なしで講座一覧を読む | 保存データのキーを、作らない(初期値で書き込まない) |

## ページ移動とメタ情報の検証

初期 HTML と、移動後の `head` の両方で、title / description / canonical / og:url / og:title / robots を確認し、**タグが重複しない**(それぞれ 1 件以下、`<title>` は 1 件)こと、**公開教材に noindex が残らない**ことを検査する。

- 講座一覧 → PM の講座 → PM-1 → PM-2: 各ルートの canonical・title に一致する(PM-2 は、HTML を生成していないが、ブラウザ内の移動で、正しいメタ情報になる)。
- 進捗(殻。初期 HTML に noindex あり)→ 公開教材(ln-1): noindex が消える → 進捗: noindex が戻る → 戻る: noindex が消える、canonical は ln-1 → 進む: noindex。
- PM-1 → 進捗 → 戻る: noindex の追加・除去と、canonical が、PM-1 のものに戻る。
- PM-1 → PM-2(ページ送りのリンクと、本文中の内部リンク)は、**ページ全体を取得し直さず**(マーカーが残る)、URL がスラッシュ付きになる。

## 旧ハッシュ URL の救済

`legacy-redirect.js`(外部ファイル。CSP により、インラインの実行スクリプトは使わない)が、ルートにいて、ハッシュが `#/` で始まるときだけ、パスの URL へ移す。

| 旧 URL | 移動先 |
|---|---|
| `/#/lesson/pm-1` | `/lesson/pm-1/` |
| `/#/course/pm` | `/course/pm/` |
| `/#/catalog` | `/catalog/` |
| `/#/lesson/nothing`(未知の ID) | `/lesson/nothing/` → 「見つかりません」(404) |
| `/lesson/pm-1/#top`(見出しへの通常の `#`) | **移さない**(教材の移転と誤認しない) |

ルート配下のビルドでも、同じ(`/#/course/pm` → `/course/pm/`)。

## ベースとオリジン(2 通り)

`SITE_BASE=/dokushu-academia/`(プロジェクト配下)と、`SITE_BASE=/`(ルート配下)の両方で、深い URL(`/lesson/pm-1/`)の、アセット・内部リンク・canonical・サイトマップが解決する(ネットワークのエラーなし、アセットの URL がベース付き、canonical・og:url・サイトマップが、同じ `<オリジン><ベース>`)。ルート配下の HTML に、プロジェクト配下のベースが混ざらない。**実際のドメインは、不要**(`SITE_ORIGIN` の値を変えるだけ)。

## 境界・保守

- **CSP**: 生成した全ページ(3 ページ、`/`、`/progress/`、`/404.html`)の CSP のメタタグが、本番のハッシュ版(`dist/index.html`)と同じ。`script-src 'self'`、`connect-src 'self' https://api.anthropic.com`。インラインの実行スクリプトは、ない(src のない `<script>` を検出する検査)。
- **本番に混ざらない**: ハッシュ版の出力(`dist/`)に、`lesson/`、`catalog/`、`sitemap.xml`、`legacy-redirect.js` が、ない。`package.json` の `build` と `deploy.yml` が、変わっていないことも、検査している。
- ライセンス文書の公開ページ化は、**含めていない**(リンクは、現状の公開 GitHub のまま。private 化の前の、別作業)。非公開資料・有料商品は、作っていない。本文・出典・クイズ・確認日は、変更していない。

## 対象外の限界(試作であることの記録)

- **生成していないページ(PM-2 など)の直接アクセス・再読み込み**: HTTP は **404**(殻の `404.html`)。ブラウザで、アプリが描画するので、読める。初期 HTML には、本文がない(検索エンジンには、見えない)。全展開で解消する。アプリ内の移動(PM-1 → PM-2 など)は、動く。
- **内部リンクのスラッシュ**: 本文中のリンクは、末尾スラッシュ付き。ヘッダー、カード、ページ送りなど、`Link` で作るリンクは、スラッシュなし(`/dokushu-academia/course/pm`)で、配信側が、スラッシュ付きへ 301 する。クリックしたあとの URL は、`MetaUpdater` が、スラッシュ付きに置き換える。クローラーが、初期 HTML のリンクを辿ると、1 回の転送が入る。全展開の前に、`Link` の包み方(スラッシュ付きで出す)を検討する。
- **配信先の挙動**: `scripts/serve-static.mjs` は、GitHub Pages の再現で、**GitHub Pages 自体ではない**。特に、`404.html` が 404 のステータスで配られるか、スラッシュなしの転送は、**GitHub Pages では、未検証**(次の配信先調査と、本番移行前の検証で確認する)。
- **レッスン全体の引き継ぎ**: 試作は、PM-1 だけ。ほかの 171 レッスンの、枠を含む引き継ぎ(クイズ、しおり、完了ボタン)は、未検証。E2 の不一致 7 件(`CodeOrder` 4、数値の最後の桁 3)は、**全展開の前に直す残件**。
- JS なしでは、対話部品(判定問題、実験ツール、クイズ、進捗の保存)は、操作できない。初期の状態の HTML は、読める。必要な場所(レッスンの冒頭)に、短く表示した。
- サイトマップは、試作の 3 件だけ(全展開で、設計の §4.4 のとおり、約 196 件)。
- 利用者による検証、検索エンジンでの登録、実測の表示速度は、していない。検索順位・AI での引用は、保証しない。

## スクリーンショット

`docs/seo/prototype/`(PC 1000px、スマホ 390px。Chromium、倍率 1、ライト、日本語、保存データなし。パス版を、`scripts/serve-static.mjs` で配信)。講座一覧・PM の講座・PM-1 の、JS あり / JS なし(`javaScriptEnabled: false`)と、PM-1 の、進捗あり(続きの案内)と、クイズ操作後。いずれも、横はみ出しなし。
