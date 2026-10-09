// src/lessons/index.ts の loaders から、レッスン ID と、本文のファイルの対応を読む(複数のスクリプトが使う)。
//   'e-1': () => import('./EvidenceIntro'),   → src/lessons/EvidenceIntro.tsx
//   'st-1': md('st-1'),                       → src/content/st-1.md(Markdown 形式)
import { readFileSync } from 'node:fs'

export function readLessonFiles(indexPath = 'src/lessons/index.ts') {
  const src = readFileSync(indexPath, 'utf8')
  const map = new Map()
  for (const m of src.matchAll(/'([0-9a-z-]+)': \(\) => import\('\.\/([A-Za-z0-9]+)'\)/g)) map.set(m[1], `src/lessons/${m[2]}.tsx`)
  for (const m of src.matchAll(/'([0-9a-z-]+)': md\('([0-9a-z-]+)'\)/g)) map.set(m[1], `src/content/${m[2]}.md`)
  return map
}
