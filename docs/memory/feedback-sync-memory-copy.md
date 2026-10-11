---
name: feedback-sync-memory-copy
description: 記憶を更新したら docs/memory/ の写しも同じ内容に更新して commit・push する(2026-10-12 の依頼)
metadata:
  node_type: memory
  type: feedback
  originSessionId: 9c6f8dea-a6b6-45fe-9af2-ff4a49c83ce7
  modified: 2026-10-11T22:14:20.463Z
---

記憶(このディレクトリ)を作成・更新・削除したら、リポジトリの `docs/memory/` に同じ内容をコピーして commit・push する。`MEMORY.md` も含める。

**Why:** 作業端末を変えても、記憶を新しい端末に取り込んで作業の精度を保つため。`docs/memory/` は公開リポジトリに入るが、本人が公開して問題ないと判断済み(2026-10-12)。
**How to apply:** 記憶を書いたら同じターンで `cp` → commit → push まで行う(対話中の push は承認不要、[[project-writing-progress]] 参照)。機微な文字列(メール・トークン・絶対パスなど)が入っていないか確認してからコピーする。正本は記憶側、`docs/memory/` は写し。
