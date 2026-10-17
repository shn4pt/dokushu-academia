// 全展開のローカル検証基盤(Issue #33 の A)の、**承認済みの範囲**。docs/seo/rollout.md、Issue #33。
// A(基盤の実装と、既存の 3 ページ+8 教材での検証)だけが承認されている。**B(全 172 教材の生成・診断)は、承認されていない**。
// この一覧を広げる変更は、作者の承認(Issue #33 の B)が要る。PRERENDER_DIAG(scripts/prerender.mjs)は、この一覧の外の ID を、拒否する。
export const APPROVED_PAGES = ['/catalog', '/course/pm', '/lesson/pm-1']
/** 診断の対象のレッスン: 記録された不一致 7 件(CodeOrder 4 件・数値の末尾 3 件)と、対照(pm-1) */
export const APPROVED_LESSONS = ['pm-1', '1-3', '4-3', 'st-3', '9-2', '9-4', '10-2', '19-2']
export const APPROVED_LESSON_SET = new Set(APPROVED_LESSONS)
