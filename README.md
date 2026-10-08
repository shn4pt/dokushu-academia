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
見出しごとの索引 `src/data/search-index.json` を作る。`npm run dev` と `npm run build` の前に自動で実行されるため、
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

