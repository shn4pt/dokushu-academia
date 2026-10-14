// 試作(Issue #15、docs/seo/plan.md): 通常の URL(パスの URL)で配る版の設定。
// 通常のビルド(`npm run build`、本番のハッシュ版)では、PATH_MODE は false で、挙動は変わらない。
// パス版は `npm run build:path`(出力は dist-path/)。

/** パスの URL 版のビルドか(ビルド時に決まる)。 */
export const PATH_MODE = import.meta.env.VITE_SITE_MODE === 'path'

/** パス版のベース(例: `/dokushu-academia/` か `/`)。ハッシュ版では使わない。 */
export const SITE_BASE = PATH_MODE ? import.meta.env.BASE_URL : '/'

/** 正規 URL のオリジン(canonical、共有情報、サイトマップの絶対 URL に使う)。ドメイン未定の間は github.io。 */
export const SITE_ORIGIN = (import.meta.env.VITE_SITE_ORIGIN as string | undefined) ?? 'https://shn4pt.github.io'

/** Router に渡す basename(末尾のスラッシュなし。ルート配下では空)。 */
export const ROUTER_BASENAME = SITE_BASE.replace(/\/$/, '')

/** アプリ内のパス(例: `/lesson/pm-1`)を、ベース付きの正規 URL(末尾スラッシュ)にする。 */
export function pageUrl(route: string, origin = SITE_ORIGIN) {
  const r = route === '/' ? '' : route.replace(/^\//, '').replace(/\/$/, '') + '/'
  return origin + SITE_BASE + r
}
