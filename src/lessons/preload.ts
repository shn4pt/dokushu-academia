import type { LessonContent } from './types'
import { isReady, loadLessonContent } from './index'

// 本文を、描画の前に読み込んでおく入れ物(パスの URL 版)。
// 生成した HTML を、ブラウザで引き継ぐには、最初の描画で、本文が同期的に読める必要がある(「読み込み中…」にしない)。
const cache = new Map<string, LessonContent>()

export const getPreloaded = (id: string | undefined) => (id ? cache.get(id) : undefined)

export async function preloadLesson(id: string) {
  if (!isReady(id) || cache.has(id)) return
  cache.set(id, await loadLessonContent(id))
}

/** アプリ内のパス(ベースを除いたもの)から、レッスン ID を取り出す。例: `/lesson/pm-1/` → `pm-1` */
export function lessonIdFromRoute(route: string) {
  const m = /^\/lesson\/([^/]+)\/?$/.exec(route)
  return m ? decodeURIComponent(m[1]) : undefined
}
