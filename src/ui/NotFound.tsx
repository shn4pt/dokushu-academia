import { Link } from 'react-router-dom'

/** 見つからないページ(パスの URL 版)。HTTP のステータスは、配信側(404.html は 404 で返る)が決める。 */
export default function NotFound() {
  return (
    <section aria-labelledby="not-found">
      <h1 id="not-found">見つかりません</h1>
      <p>このページは、ありません。URL が変わった、または、まだ公開していない可能性があります。</p>
      <p><Link to="/catalog" className="standalone-link">講座一覧へ</Link></p>
    </section>
  )
}
