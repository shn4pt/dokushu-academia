import type { To } from 'react-router-dom'

/**
 * アプリ内リンクの移動先のパスの末尾に、スラッシュを足す(パスの URL 版。Issue #19)。
 * 対象は、`/` で始まるパスだけ(相対パス・外部の URL・ルート `/` は、そのまま)。search(`?q=PM`)と hash(`#top`)は、パスの後ろに、そのまま残す。
 * ベース(`/dokushu-academia/` など)は、ここでは扱わない(Router の basename が付ける)。
 */
export function slashPath(to: To): To {
  if (typeof to === 'string') {
    const m = /^([^?#]*)(.*)$/.exec(to)!
    return needsSlash(m[1]) ? m[1] + '/' + m[2] : to
  }
  return needsSlash(to.pathname) ? { ...to, pathname: to.pathname + '/' } : to
}

function needsSlash(p: string | undefined): p is string {
  return !!p && p.startsWith('/') && !p.startsWith('//') && p.length > 1 && !p.endsWith('/')
}
