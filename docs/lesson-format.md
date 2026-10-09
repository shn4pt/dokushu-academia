# レッスンの書き方: TSX と Markdown

レッスンには、2つの形式がある。

| 形式 | 置き場所 | 向いているもの |
|---|---|---|
| **Markdown** | `src/content/<ID>.md`(`src/lessons/index.ts` に `'<ID>': md('<ID>')` と登録) | 文章・表・判定問題・クイズが中心のレッスン。**新しい講座は、まずこちら** |
| TSX | `src/lessons/<Name>.tsx`(`loaders` に `() => import('./Name')` と登録) | 専用の対話的な部品や、数式・コードの掲載が多いレッスン(LLM の講座など) |

どちらも、同じ仕組み(ロードマップ、検索、クイズ集、学習時間、出典の検査、確認の材料)に載る。Markdown は、書く量が少なく、構文の誤りが出にくい。

## Markdown のレッスンの書き方
- 本文は、ふつうの Markdown(段落、箇条書き、表、強調、引用、コード)。
- **見出しは「### 」**。これが、しおりと検索の単位になる(「#」「##」は使わない。題名は、`curriculum.ts` のレッスンの題名が表示される)。
- **対話的な部品**は、「```component 名前」で始まる囲みの中に、**JSON** で書く(文字列は二重引用符。末尾のカンマは不可)。
  - `classify`: 分類問題(`ClassifyItems`)。`title`・`description`・`options`・`items`(`text`・`ok`・`why`)。
  - `codereview`: コードレビュー問題(`CodeReview`)。`title`・`description`・`lines`・`answers`(0 始まり)・`explanation`。
  - `anscombe`: Anscombe の 4 組のデータのデモ。`{}`。
- **クイズ**は「```component quiz」の囲み(1 つだけ。必須)。`[ { "question", "choices", "answer"(0 始まり), "explanation" } ]`。本文には表示されず、レッスン末尾のクイズになる。
- **内部リンク**は `[文字](/lesson/e-1)` のように書く(自動でハッシュのルーターの形になる)。外部リンクは `rel` が自動で付く。
- 注記(出典の限界や、このサービスの整理の断り書き)は、引用(`> `)で書くと、薄い色で表示される。
- 数式(KaTeX)は、まだ使えない(必要になったら、部品として足す)。
- 部品を足すときは、`src/lessons/mdparse.ts` の `componentSpecs`(名前と必須の項目)と、`src/lessons/markdown.tsx` の `registry`(実体)に登録する。

## 形式の誤りの検出
読み取りの時点(`npm run index` = ビルドの最初)で、次を検出して、場所(レッスン・行)つきで失敗する。
- 囲みの JSON が読めない(二重引用符、カンマの誤りなど)。知らない部品。必須の項目がない。囲みの閉じ忘れ。
- クイズがない・複数ある。`answer` が範囲外。選択肢が 2 つ未満。解説が空。

## 新しいレッスン(Markdown)を足す手順
1. `src/content/<ID>.md` を書く。
2. `src/lessons/index.ts` の `loaders` に `'<ID>': md('<ID>'),` を足す。
3. `src/data/curriculum.ts` のステージに、レッスンの題名と要約を足す(新しい講座なら、`course` つきのステージ)。`src/data/catalog.ts` の `tiers.stageIds` に、ステージを入れる。
4. 出典の記録(`lesson-sources.json`)、用語集、テストを足す。ほかは、`docs/production.md` の手順書のとおり。

## 試験の結果(2026-10-09)
最初の Markdown のレッスン(`st-1`)で、検索の索引・クイズ集・学習時間・しおり・出典の検査・確認の材料・スマホの表示が、TSX と同じに動くことを確かめた。
