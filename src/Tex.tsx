import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

export function Tex({ tex, block }: { tex: string; block?: boolean }) {
  const html = useMemo(
    () => katex.renderToString(tex, { displayMode: !!block, throwOnError: false }),
    [tex, block],
  )
  const Tag = block ? 'div' : 'span'
  return <Tag className={block ? 'tex-block' : undefined} dangerouslySetInnerHTML={{ __html: html }} />
}
