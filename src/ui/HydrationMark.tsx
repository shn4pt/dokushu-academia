import { useEffect } from 'react'

/**
 * パスの URL 版(試作。Issue #19): 引き継ぎ(hydrate)または初回の描画が終わり、効果(effect)が走ったことを、`<html data-hydrated="1">` で示す。
 * テストは、React の内部名ではなく、アプリが管理するこの印を待つ。サーバーの描画では、何も出さない(effect は走らない)。
 * 印は、「引き継ぎの警告がない」ことの証明ではない。警告は、`window.__recoverableErrors` と console.error で、別に確かめる。
 */
export default function HydrationMark() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = '1'
  }, [])
  return null
}
