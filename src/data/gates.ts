// 公開前の品質ゲートと、鮮度の点検に使う、純粋な関数(画面には使わない)。
// scripts/freshness.mjs と e2e のテストから使う。値の import は持たない(Node でそのまま読めるようにするため)。
import type { EvidenceKind } from './catalog'

export type SourceEntry = { status: string; checkedAt?: string; sources?: { how: string; url?: string }[] }

/** 確認日が、これより古いと「再確認が要る」とみなす日数(根拠の種類ごと)。 */
export const maxAgeDays: Record<EvidenceKind, number> = {
  law: 90, // 法令・基準は変わるので、短い。超えると、公開を止める(ゲート)
  tech: 180, // 公式ドキュメントや製品は変わりやすい。超えると、再確認の対象
  academic: 365,
  practice: 365,
}

export const ageDays = (checkedAt: string, now: Date) => Math.floor((now.getTime() - Date.parse(checkedAt)) / 86400000)

/**
 * 法令・基準の講座のレッスンが、公開してよい状態かを調べる。問題があれば、理由を返す(空なら通過)。
 *  - 原典で確認済み(verified)で、原文を読んだ出典(how: read、url あり)があり、確認日が maxAgeDays.law 日以内。
 */
export function lawLessonErrors(entry: SourceEntry | undefined, now: Date): string[] {
  if (!entry) return ['出典の記録がありません']
  const errors: string[] = []
  if (entry.status !== 'verified') errors.push(`法令・基準のレッスンは、原典で確認済み(verified)でないと公開できません(いまは ${entry.status})`)
  if (!entry.sources?.some((s) => s.how === 'read' && s.url)) errors.push('原文を読んだ出典(how: read、url あり)がありません')
  if (!entry.checkedAt) errors.push('確認日がありません')
  else if (ageDays(entry.checkedAt, now) > maxAgeDays.law) errors.push(`確認日(${entry.checkedAt})から ${maxAgeDays.law} 日をこえています。再確認してください`)
  return errors
}

type StageLike = { id: string; lessons: { id: string }[] }
type CourseLike = { id: string; evidence: EvidenceKind; tiers: { stageIds?: string[] }[] }

/** レッスンが属する講座を返す(ステージ → 講座)。 */
export function courseOfLesson<C extends CourseLike>(lessonId: string, stages: StageLike[], courses: C[]): C | undefined {
  const stage = stages.find((s) => s.lessons.some((l) => l.id === lessonId))
  return stage ? courses.find((c) => c.tiers.some((t) => t.stageIds?.includes(stage.id))) : undefined
}
