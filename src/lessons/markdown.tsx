import { createElement, type ComponentType } from 'react'
import ClassifyItems from '../ui/ClassifyItems'
import CodeReview from '../ui/CodeReview'
import AnscombeDemo from '../ui/AnscombeDemo'
import { parseLesson } from './mdparse'
import type { LessonContent } from './types'

// Markdown の「```component 名前」の囲みを、実際の部品に対応づける。名前と必須の項目は mdparse.ts の componentSpecs。
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const registry: Record<string, ComponentType<any>> = {
  classify: ClassifyItems,
  codereview: CodeReview,
  anscombe: AnscombeDemo,
}

/** Markdown のレッスンを読み込む。index.ts の loaders から、loadMarkdown('id', import('../content/id.md?raw')) の形で使う。 */
export async function loadMarkdown(id: string, source: Promise<{ default: string }>): Promise<{ default: LessonContent }> {
  const { segments, quiz } = parseLesson((await source).default, id)
  function Body() {
    return (
      <>
        {segments.map((s, i) =>
          s.kind === 'html' ? (
            // 本文は、このリポジトリの Markdown(信頼できる入力)。見出しなどが、本文の直下の要素になるよう、枠は display: contents にする
            <div key={i} className="md" dangerouslySetInnerHTML={{ __html: s.html }} />
          ) : (
            createElement(registry[s.name], { key: i, ...s.props })
          ),
        )}
      </>
    )
  }
  return { default: { Body, quiz } }
}
