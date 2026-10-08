# LLMのしくみ 学習ロードマップ

LLMの仕組みを段階的に学ぶブラウザアプリ(React + Vite)。ログイン不要で、進捗はlocalStorageに保存される。

```bash
npm install
npm run dev     # 開発サーバ
npm run build   # 型チェック + ビルド(dist/ は静的ホスティング可)
npm run index   # 検索用の索引だけを作り直す
```

## 検索の仕組み

レッスン本文はReactコンポーネントなので、`scripts/build-search-index.mjs` が本文を描画してテキストを取り出し、
見出しごとの索引 `src/data/search-index.json` を作る(あわせて、復習用の問題集と、学習時間の算出用の統計も作る)。`npm run dev` と `npm run build` の前に自動で実行されるため、
レッスンを追加・編集すれば索引にも反映される。索引はコミットしない(`.gitignore` 済み)。
`tsc` を直接実行するときは、先に `npm run index` で索引を作っておくこと。

## 復習の仕組み

クイズの答え合わせのたびに、問題ごとの正誤を localStorage(`questions`)に記録する。問題のキーは
`レッスンID:問題文のハッシュ`(`src/review.ts`)で、問題の並び順を変えても記録は保たれる。問題文を書き換えると別の問題として扱われる。

- 一度でも間違えた問題が復習の対象。復習で2回連続で正解すると卒業する(`GRADUATE_STREAK`)。
- 復習は選択肢をシャッフルして出題する。完了にしたレッスンからのランダム練習もある。
- 出題用の問題集は、検索の索引と同じスクリプトが `src/data/quiz-bank.json` に生成する(コミットしない)。

## レッスンの追加方法

1. `src/data/curriculum.ts` にレッスンのメタ情報がある(全ステージ分は定義済み)。
2. `src/lessons/` に `{ Body, quiz }` を default export するモジュールを作る(例: `Tokenization.tsx`)。
3. `src/lessons/index.ts` の `registry` にレッスンIDで登録する。登録したレッスンだけが公開扱いになり、進捗率の分母に入る。

## デプロイ

`main` へのpushで `.github/workflows/deploy.yml` がGitHub Pagesへ公開する。
リポジトリの Settings → Pages → Source を「GitHub Actions」にしておくこと。
`base: './'` とハッシュルーティングのため、サブパス配下でもそのまま動く。

## しおり(続きから再開)の仕組み

レッスン内で「最も先まで読み進めた見出し」を、スクロールに合わせて localStorage(`reading`)に自動で記録する(`src/reading.ts`)。
位置は座標ではなく見出しのテキストで持つので、画面幅や文字サイズが変わってもずれない。このため、レッスン内の見出しは重複させないこと。

- 最初の見出しと、ページを開いてすぐの位置は、読み進めたと見なさない。読み返して戻っても、しおりは戻らない。
- ホームの「続きから学ぶ」からは、自動でその見出しまで移動する。ほかの経路で開いたときは、案内バナーで選べる。
- レッスンを完了にするとしおりは消え、完了済みのレッスンでは記録しない。検索結果から開いたときは、検索の移動を優先する。

## 学習時間の目安

各レッスンの所要時間は、実測ではなく本文から機械的に見積もった目安。ビルド時に `scripts/build-search-index.mjs` が、本文の文字数・コード・数式・デモ・クイズの数を数え(`src/data/lesson-stats.json`、コミットしない)、
`src/time.ts` の前提で時間に換算する。レッスンを編集すれば、時間も自動で更新される。

- 前提(初学者が理解しながら進む速さの仮の値): 本文は1分200字、コードは2倍の時間、数式は1つ0.5分、デモは1つ3分、クイズは1問0.7分。
- 実際に使ってみてずれていれば、`src/time.ts` の定数だけを調整すればよい。
- ステージ・全体の合計は、5分単位に丸めて表示する(精度を見せすぎないため)。

## 第2部(エージェント開発編)と Claude API

Stage 9 以降は、Claude API を自分のプログラムから使う内容。レッスン内のプレイグラウンド(`src/ui/ApiPlayground.tsx`)で、
利用者が自分の APIキーを入れると、ブラウザから Claude API を直接呼び出して試せる。キーがなくても、説明用に用意した応答の例で流れを確認できる。

- APIキーはメモリか sessionStorage(タブを閉じると消える)にだけ置く(`src/api/settings.ts`)。localStorage・進捗データ・エクスポートには入れない。
- 呼び出しは公式 SDK(`@anthropic-ai/sdk`)に `dangerouslyAllowBrowser: true` を指定して行う(`src/api/client.ts`)。学習用の構成で、本番のアプリではサーバー側から呼ぶこと。
- 本番ビルドには CSP を付け、通信先を自サイトと `https://api.anthropic.com` に限定している(`vite.config.ts`)。
- Opus と Sonnet では、安全上の拒否に備えてサーバー側のフォールバック(`fallbacks: "default"`)を有効にしている。
- SDK は大きいので、プレイグラウンドを含むレッスンと API 設定ページを開いたときにだけ読み込む。

