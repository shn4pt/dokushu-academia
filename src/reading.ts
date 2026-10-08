import { norm } from './search'

// 見出しは、レッスン本文(.prose)と、末尾の確認クイズの両方を対象にする
const headings = () => [...document.querySelectorAll<HTMLElement>('article h3')]

/**
 * 読み進めている位置。画面の上から3割より上に出ている最後の見出しと、その番号。
 * 次の場合は、読み進めたことにならないので null を返す。
 *  - 最初の見出し(開いた直後から上に出ているため)
 *  - ページを開いてすぐ(スクロールが画面の半分に満たない)
 */
export function currentSection(): { section: string; index: number } | null {
  if (window.scrollY < window.innerHeight * 0.5) return null
  const hs = headings()
  let index = -1
  for (let i = 0; i < hs.length; i++) {
    if (hs[i].getBoundingClientRect().top <= window.innerHeight * 0.35) index = i
    else break
  }
  return index >= 1 ? { section: hs[index].textContent ?? '', index } : null
}

export const findHeading = (text: string) => headings().find((h) => norm(h.textContent ?? '') === norm(text))

export function scrollToHeading(h: HTMLElement) {
  h.scrollIntoView({ block: 'start' })
  h.classList.add('flash')
  setTimeout(() => h.classList.remove('flash'), 2000)
}
