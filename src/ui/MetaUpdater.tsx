import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { applyMeta, routeMeta } from '../seo'

/**
 * パスの URL 版: ページを移動するたびに、title / description / canonical / 共有情報 / robots を、現在のルートに合わせる。
 * 初期 HTML と同じ関数(routeMeta / applyMeta)を使う。戻る・進むでも、ルートが変わるので、同じ処理が走る。
 * 末尾のスラッシュがない URL は、正規の形(スラッシュ付き)に置き換える(履歴は増やさない)。
 */
export default function MetaUpdater() {
  const { pathname, search, hash } = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    if (pathname.length > 1 && !pathname.endsWith('/')) {
      navigate(pathname + '/' + search + hash, { replace: true })
      return
    }
    applyMeta(routeMeta(pathname))
  }, [pathname, search, hash, navigate])
  return null
}
