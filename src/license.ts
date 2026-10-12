import type { Source } from './sources'

/** 出典の題名に書かれた、Creative Commons のライセンスから、レッスンに表示する「利用条件」を作る。 */
export type LicenseItem = { name: string; license: string; url: string }
export type LicenseNotes = { share: LicenseItem[]; noDerivs: LicenseItem[]; attribution: LicenseItem[] }
const LICENSE_RE = /CC (BY(?:-NC)?(?:-SA|-ND)?) ([0-9]\.[0-9])/
export function licenseNotes(list: Source[]): LicenseNotes {
  const out: LicenseNotes = { share: [], noDerivs: [], attribution: [] }
  const seen = new Set<string>()
  for (const x of list) {
    const m = LICENSE_RE.exec(x.title)
    if (!m) continue
    const name = x.title.split('(')[0].trim()
    const license = `CC ${m[1]} ${m[2]}`
    const key = `${name}|${license}`
    if (seen.has(key)) continue
    seen.add(key)
    const item = { name, license, url: `https://creativecommons.org/licenses/${m[1].toLowerCase()}/${m[2]}/deed.ja` }
    if (m[1].endsWith('-SA')) out.share.push(item)
    else if (m[1].endsWith('-ND')) out.noDerivs.push(item)
    else out.attribution.push(item)
  }
  return out
}
