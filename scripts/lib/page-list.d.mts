export type PlanEntry = {
  route: string
  kind: string
  mode: string
  noindex: boolean
  sitemap: boolean
  canonical: string | null
  duplicateOf?: string
  pendingDecision?: boolean
}
type Ids = { id: string }[]
export function buildPageList(data: { courses: Ids; stages: Ids; lessons: Ids }, opt?: { includeLlm?: boolean }): PlanEntry[]
export function validatePageList(
  list: PlanEntry[],
  data: { courses: Ids; stages: Ids; lessons: Ids },
  opt?: { routeMeta?: (route: string) => { noindex: boolean; canonical: string | null } },
): string[]
export function summarize(list: PlanEntry[]): {
  total: number
  generate: number
  generateWithoutRoot: number
  shells: number
  sitemap: number
  pendingDecision: string[]
  byKind: Record<string, number>
}
