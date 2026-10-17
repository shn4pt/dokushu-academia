// ページ別のメタ情報(title / description / canonical / 共有情報 / robots)。試作(Issue #15、docs/seo/plan.md §4.4・§4.4a)。
// 初期 HTML の生成(scripts/prerender.mjs)と、ブラウザの中のページ移動(src/ui/MetaUpdater.tsx)で、同じ関数を使う。
// 新しいデータは書かず、既存のデータ(catalog / curriculum / course-entry)から作る。
import { findCourse } from './data/catalog'
import { entries } from './data/course-entry'
import { findLesson, findStage, lessonNo } from './data/curriculum'
import { pageUrl } from './site'

export const SITE_NAME = '独習アカデミア'
export const TAGLINE = 'AIと事業・プロダクトをつくる人の学び直し'
const SITE_DESCRIPTION = '顧客・事業・数字・開発について、自分で判断するための知識を、学問と一次情報に基づいて学べる講座集です。自分の困りごとに近い講座から選べます。'

export type RouteMeta = {
  title: string
  description: string
  /** 正規 URL のアプリ内のパス(例: `/catalog`)。canonical と og:url に使う。見つからないページは、正規 URL がないので null */
  canonical: string | null
  /** 検索に出さないページ(個人の状態、検索、見つからないページ) */
  noindex: boolean
  ogType: 'website' | 'article'
}

const named = (page: string) => `${page} | ${SITE_NAME}`
const normalize = (route: string) => (route.length > 1 ? route.replace(/\/+$/, '') : route) || '/'

/** アプリ内のパス(ベースを除く。末尾のスラッシュは有無どちらも可)から、メタ情報を作る。 */
export function routeMeta(route: string): RouteMeta {
  const r = normalize(route)
  const base = { description: SITE_DESCRIPTION, canonical: r as string | null, noindex: false, ogType: 'website' as const }
  const notFound: RouteMeta = { ...base, title: named('見つかりません'), canonical: null, noindex: true }
  if (r === '/' || r === '/catalog') return { ...base, title: `${SITE_NAME} — ${TAGLINE}`, canonical: '/catalog' }
  const fixed: Record<string, [string, string, boolean]> = {
    '/map': ['このサービスの地図', '講座のつながりと、この構成の理由、根拠の表示の読み方を、1 枚で見られます。', false],
    '/roadmap': ['ロードマップ', 'LLM の講座の、全レッスンの並びです。', false],
    '/llm': ['LLM の講座', 'LLM のしくみ、AI エージェント開発、AI を使った開発の 3 講座の、全体像と進捗です。', false],
    '/glossary': ['用語集', '講座で使う用語の説明です。', false],
    '/sources': ['出典と確認の状況', 'レッスンごとの、出典と、確認の程度の一覧です。', false],
    '/licenses': ['ライセンス', '講座の文章(CC BY-SA 4.0)とコード(MIT)のライセンスと、資料から訳した部分の例外です。', false],
    '/licenses/materials': ['資料のライセンスと、このサイトの扱い', '講座が参考にした資料の利用条件と、このサイトの扱いの方針・一覧です。', false],
    '/report': ['誤りの報告', '教材の誤りや、出典・ライセンスの表示の誤りを見つけたときの、報告のしかたです。', false],
    '/progress': ['進捗', '', true],
    '/review': ['復習', '', true],
    '/search': ['検索', '', true],
    '/api-key': ['Claude API の設定', '', true],
  }
  if (fixed[r]) {
    const [name, description, noindex] = fixed[r]
    return { ...base, title: named(name), description: description || SITE_DESCRIPTION, noindex }
  }
  let m = /^\/course\/([^/]+)$/.exec(r)
  if (m) {
    const c = findCourse(decodeURIComponent(m[1]))
    if (!c) return notFound
    const e = entries[c.id]
    return { ...base, title: named(c.title), description: e ? `${e.decision} ${e.when}` : c.summary }
  }
  m = /^\/stage\/([^/]+)$/.exec(r)
  if (m) {
    const s = findStage(decodeURIComponent(m[1]))
    return s ? { ...base, title: named(s.title), description: s.goal ?? SITE_DESCRIPTION } : notFound
  }
  m = /^\/lesson\/([^/]+)$/.exec(r)
  if (m) {
    const l = findLesson(decodeURIComponent(m[1]))
    return l ? { ...base, title: named(`${lessonNo(l)} ${l.title}`), description: l.summary, ogType: 'article' } : notFound
  }
  return notFound
}

export type SeoTag = { tag: 'meta' | 'link'; attrs: Record<string, string> }

/** メタ情報から、head に置くタグを作る(title 以外)。`og:image` は、第 1 段階では付けない。 */
export function seoTags(m: RouteMeta): SeoTag[] {
  const tags: SeoTag[] = [
    { tag: 'meta', attrs: { name: 'description', content: m.description } },
    { tag: 'meta', attrs: { property: 'og:type', content: m.ogType } },
    { tag: 'meta', attrs: { property: 'og:site_name', content: SITE_NAME } },
    { tag: 'meta', attrs: { property: 'og:locale', content: 'ja_JP' } },
    { tag: 'meta', attrs: { property: 'og:title', content: m.title } },
    { tag: 'meta', attrs: { property: 'og:description', content: m.description } },
  ]
  if (m.canonical !== null) {
    const url = pageUrl(m.canonical)
    tags.push({ tag: 'link', attrs: { rel: 'canonical', href: url } }, { tag: 'meta', attrs: { property: 'og:url', content: url } })
  }
  if (m.noindex) tags.push({ tag: 'meta', attrs: { name: 'robots', content: 'noindex' } })
  return tags
}

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** 初期 HTML に入れる、タグの文字列(prerender 用)。どのタグにも data-seo を付け、移動後の更新で見つけられるようにする。 */
export function renderTagsHtml(m: RouteMeta) {
  return seoTags(m)
    .map((t) => `<${t.tag} ${Object.entries(t.attrs).map(([k, v]) => `${k}="${esc(v)}"`).join(' ')} data-seo="1" />`)
    .join('\n    ')
}

export const titleHtml = (m: RouteMeta) => `<title>${esc(m.title)}</title>`

const keyOf = (tag: string, attrs: Record<string, string>) => `${tag}:${attrs.name ?? attrs.property ?? attrs.rel}`
const keyOfEl = (el: Element) => `${el.tagName.toLowerCase()}:${el.getAttribute('name') ?? el.getAttribute('property') ?? el.getAttribute('rel')}`

/** ブラウザの中のページ移動で、head を現在のルートに合わせる。既存のタグを書き換え、重複を除き、不要になったタグ(例: noindex)を取り除く。 */
export function applyMeta(m: RouteMeta, doc: Document = document) {
  doc.title = m.title
  const want = seoTags(m)
  const have = new Map<string, Element[]>()
  doc.head.querySelectorAll('[data-seo]').forEach((el) => {
    const k = keyOfEl(el)
    have.set(k, [...(have.get(k) ?? []), el])
  })
  for (const t of want) {
    const k = keyOf(t.tag, t.attrs)
    const [first, ...dups] = have.get(k) ?? []
    dups.forEach((d) => d.remove())
    const el = first ?? doc.head.appendChild(Object.assign(doc.createElement(t.tag), {}))
    for (const [a, v] of Object.entries(t.attrs)) el.setAttribute(a, v)
    el.setAttribute('data-seo', '1')
    have.delete(k)
  }
  for (const rest of have.values()) rest.forEach((el) => el.remove())
}
