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

## レッスンの追加方法

1. `src/data/curriculum.ts` にレッスンのメタ情報がある(全ステージ分は定義済み)。
2. `src/lessons/` に `{ Body, quiz }` を default export するモジュールを作る(例: `Tokenization.tsx`)。
3. `src/lessons/index.ts` の `registry` にレッスンIDで登録する。登録したレッスンだけが公開扱いになり、進捗率の分母に入る。

## デプロイ

`main` へのpushで `.github/workflows/deploy.yml` がGitHub Pagesへ公開する。
リポジトリの Settings → Pages → Source を「GitHub Actions」にしておくこと。
`base: './'` とハッシュルーティングのため、サブパス配下でもそのまま動く。
