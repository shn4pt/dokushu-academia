import { forwardRef } from 'react'
import { Link as RouterLink, NavLink as RouterNavLink, type LinkProps, type NavLinkProps, type To } from 'react-router-dom'
import { PATH_MODE } from '../site'
import { slashPath } from './slash'

/**
 * アプリ内リンクの共通部品(試作。Issue #19)。パスの URL 版では、移動先のパスの末尾にスラッシュを足す。
 * 正規の URL(`/lesson/pm-1/`)と、リンクの href を揃え、スラッシュなしを経由した置き換え(MetaUpdater の補正)を避けるため。
 * 変換は slash.ts(search と hash は、そのまま)。ベース(`/dokushu-academia/` など)は、Router の basename が付ける。外部リンクは、この部品を使わない。
 * ハッシュ版(本番)では、何も変えない。
 */
const to_ = (to: To): To => (PATH_MODE ? slashPath(to) : to)

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ to, ...rest }, ref) {
  return <RouterLink ref={ref} to={to_(to)} {...rest} />
})

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink({ to, ...rest }, ref) {
  return <RouterNavLink ref={ref} to={to_(to)} {...rest} />
})
