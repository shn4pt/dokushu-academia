import { courseStageIds, plannedCount, type Course } from './catalog'
import { findStage } from './curriculum'
import { isReady } from '../lessons'

/** 本文を書き終えて、公開しているレッスンの数 */
export const writtenCount = (c: Course) =>
  courseStageIds(c).reduce((n, id) => n + (findStage(id)?.lessons.filter((l) => isReady(l.id)).length ?? 0), 0)
/** 講座の全体の予定: 書き終えたレッスン + 目次の案 */
export const plannedTotal = (c: Course) => writtenCount(c) + plannedCount(c)
