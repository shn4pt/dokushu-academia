---
name: feedback-factcheck-with-opus
description: 本体の執筆は Sonnet、事実確認(verify-lesson のエージェント)だけ Opus で行う(2026-10-12 の依頼)
metadata:
  node_type: memory
  type: feedback
---

講座の本体(調査・執筆・登録・テスト)は Sonnet 5.5 で進め、別の目の確認(`verify-lesson`)のエージェントは、Agent ツールの `model: "opus"` を指定して Opus で起動する。

**Why:** トークン費用を抑えつつ、誤りを見つける役は強いモデルにしておくため。これまで Opus 5.5 で書いた SWE・セキュリティの下書きにも、事実確認で毎回 5〜10 件の指摘が出ており、品質を支えているのは手順(原文を読む・別の目の確認・検査)。Sonnet 5.5 は、それ以前の大半の講座(コミット 117 件)を書いた実績がある。
**How to apply:** `verify-lesson` で Agent を呼ぶとき、`subagent_type: general-purpose` に `model: "opus"` を足す。確認の記録(`docs/verify/`)の指摘の数と種類を、Opus 本体の分(sw-1〜6、se-1〜4)と比べ、Sonnet 本体で品質が落ちていないかを見る。コミットの Co-Authored-By は、そのときの本体のモデルに従う。関連: [[project-writing-progress]]
