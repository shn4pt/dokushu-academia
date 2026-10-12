---
name: project-license-policy
description: CC BY-SA/NC-SA/NC-ND の資料の扱いの方針(2026-10-12 に作者から一任されて決定)。docs/licenses.md と各レッスンの利用条件の自動表示
metadata:
  type: project
---

OWASP(CC BY-SA 4.0)の扱いは、作者から「あなたが決めてほしい」と一任され、2026-10-12 に次のように決めた。実装は src/license.ts、src/ui/SourceNote.tsx、docs/licenses.md、e2e/license.spec.ts。

- 継承(BY-SA、BY-NC-SA)の資料を訳し・要約したレッスンは、その部分を資料と同じ条件で提供する。各レッスンの末尾に、出典の題名のライセンスから、利用条件を自動で表示する。
- BY-NC-SA を含むレッスンは非営利に限る。**このサイトが広告や課金を始めるときは、先に見直す**。
- BY-NC-ND(Software Engineering at Google)は、要約と短い引用にとどめる(SWE の 5 レッスン)。翻訳に近い部分がないか、レッスンごとの確認が残っている。SWE-2 は、ND と NC-SA(Pro Git 3.0)を両方使っている。
- このリポジトリには LICENSE がなく、独自の部分とコードの条件は未決定(作者が決める)。

**Why:** 継承の条件を、表示なしに放置すると、資料のライセンス違反になりうるため。
**How to apply:** 新しい資料を使うときは、出典の記録の題名に、ライセンス(例: CC BY-SA 4.0)を書く。そうすれば、表示は自動で出る。
