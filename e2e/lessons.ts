// テストが使うレッスンの一覧は、アプリ自身が生成するデータから読む(件数をテストに書き写さない)。
// quiz-bank.json は、ビルドの前に scripts/build-search-index.mjs が全レッスンから作る。
import { readFileSync } from 'node:fs'
import { stages } from '../src/data/curriculum'

export type Q = { question: string; choices: string[]; answer: number }
export const bank = JSON.parse(readFileSync('src/data/quiz-bank.json', 'utf8')) as Record<string, Q[]>
export const ids = Object.keys(bank)
export const stageIds = stages.map((s) => s.id)
