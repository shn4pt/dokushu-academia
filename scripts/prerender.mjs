// パスの URL 版(試作)の、ページごとの HTML の書き出し。`vite build` の後に、build-path.mjs が呼ぶ。
// 同じコンポーネント(src/App.tsx)を、サーバーで描画し(renderToString)、ブラウザで引き継ぐ(hydrateRoot)。
// 本文を別のテンプレートに書き写さない。メタ情報は、src/seo.ts(ブラウザの中の移動と同じ関数)から作る。
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createServer } from 'vite'

const OUT = process.env.OUT_DIR ?? 'dist-path'
const BASE = process.env.SITE_BASE ?? '/dokushu-academia/'
const ORIGIN = process.env.VITE_SITE_ORIGIN ?? 'https://shn4pt.github.io'

// 試作の対象: 本文入りの HTML を生成するページと、ブラウザで描画する殻(noindex)。生成していないページは、試作の限界として、404.html の殻から、ブラウザで描画される。
const PAGES = [
  { route: '/catalog', file: 'catalog/index.html', ssr: true, sitemap: true },
  { route: '/course/pm', file: 'course/pm/index.html', ssr: true, sitemap: true },
  { route: '/lesson/pm-1', file: 'lesson/pm-1/index.html', ssr: true, sitemap: true },
  // 公開文書(Issue #31)。ライセンス・資料の扱いは、元ファイルから生成する。出典の一覧は、初期 HTML に含める
  { route: '/licenses', file: 'licenses/index.html', ssr: true, sitemap: true },
  { route: '/licenses/materials', file: 'licenses/materials/index.html', ssr: true, sitemap: true },
  { route: '/report', file: 'report/index.html', ssr: true, sitemap: true },
  { route: '/sources', file: 'sources/index.html', ssr: true, sitemap: true },
  { route: '/', file: 'index.html', ssr: true, sitemap: false }, // 講座一覧と同じ内容。canonical は /catalog/
  { route: '/progress', file: 'progress/index.html', ssr: false, sitemap: false }, // ブラウザで描画する殻(noindex)
  { route: '/__not-found__', file: '404.html', ssr: false, sitemap: false }, // 見つからないページの殻(noindex)。配信側が 404 で返す
]

// 診断専用(Issue #19): PRERENDER_DIAG にレッスン ID(カンマ区切り)を渡すと、そのレッスンの本文入り HTML も、出力先に書く。
// 引き継ぎの不一致を調べるための局所的な生成で、出力先の名前に `diag` を含むときだけ有効。サイトマップには載せない。全レッスンの生成ではない
if (process.env.PRERENDER_DIAG) {
  if (!/diag/.test(OUT)) throw new Error('PRERENDER_DIAG は、出力先(OUT_DIR)の名前に diag を含むときだけ使えます')
  for (const id of process.env.PRERENDER_DIAG.split(',').map((x) => x.trim()).filter(Boolean)) {
    if (!/^[\w-]+$/.test(id)) throw new Error(`レッスン ID が不正です: ${id}`)
    if (PAGES.some((p) => p.route === `/lesson/${id}`)) continue
    PAGES.splice(PAGES.length - 2, 0, { route: `/lesson/${id}`, file: `lesson/${id}/index.html`, ssr: true, sitemap: false })
  }
}

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
  optimizeDeps: { noDiscovery: true },
})
try {
  const { renderRoute } = await vite.ssrLoadModule('/src/entry-server.tsx')
  const seo = await vite.ssrLoadModule('/src/seo.ts')
  const template = readFileSync(join(OUT, 'index.html'), 'utf8')
  if (!template.includes('<div id="root"></div>')) throw new Error('index.html の雛形に、<div id="root"></div> がありません')
  const redirectTag = `<script src="${BASE}legacy-redirect.js"></script>`
  const written = []
  for (const page of PAGES) {
    const meta = seo.routeMeta(page.route)
    let html = template
      .replace(/<title>[^<]*<\/title>/, seo.titleHtml(meta) + '\n    ' + seo.renderTagsHtml(meta))
      // 旧ハッシュ URL の転送(外部ファイル。CSP により、インラインの実行スクリプトは使わない)。CSP のメタタグの後に置く
      .replace('<meta charset="UTF-8" />', '<meta charset="UTF-8" />\n    ' + redirectTag)
    const inner = page.ssr ? await renderRoute(page.route) : ''
    html = html.replace('<div id="root"></div>', `<div id="root"${page.ssr ? ' data-ssr="1"' : ''}>${inner}</div>`)
    if (!html.includes(redirectTag)) throw new Error('旧ハッシュ URL の転送のタグを、入れられませんでした')
    const path = join(OUT, page.file)
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, html)
    written.push({ route: page.route, file: page.file, ssr: page.ssr, noindex: meta.noindex, canonical: seo.seoTags(meta).find((t) => t.attrs.rel === 'canonical')?.attrs.href ?? null })
  }
  // 旧ハッシュ URL(`#/lesson/pm-1` など)の救済: ルートにいて、ハッシュが `#/` で始まるときだけ、パスの URL へ移す。見出しの `#` は、そのまま
  writeFileSync(
    join(OUT, 'legacy-redirect.js'),
    `(function () {
  var base = ${JSON.stringify(BASE)};
  var h = location.hash;
  if (h.indexOf('#/') !== 0) return;
  if (location.pathname !== base && location.pathname !== base + 'index.html') return;
  // サイト内の転送に限る: 先頭が スラッシュ2つ、バックスラッシュ、制御文字は転送しない。パス部分だけにスラッシュを足し、検索語やハッシュは、そのまま渡す
  var raw = h.slice(2);
  if (raw.charAt(0) === '/' || /[\\\\\\u0000-\\u001f]/.test(raw)) return;
  var m = /^([^?#]*)(.*)$/.exec(raw);
  if (/(^|\\/)(\\.|%2e){1,2}(\\/|$)/i.test(m[1])) return; // . と .. の区間(エンコード含む)は転送しない
  var route = m[1].replace(/\\/+$/, '');
  var target;
  try { target = new URL(base + (route ? route + '/' : '') + m[2], location.origin); } catch (e) { return; }
  if (target.origin !== location.origin || target.pathname.indexOf(base) !== 0) return;
  location.replace(target.pathname + target.search + target.hash);
})();
`,
  )
  // サイトマップ: 生成した、検索に出すページだけ
  const urls = PAGES.filter((p) => p.sitemap).map((p) => `  <url><loc>${ORIGIN}${BASE}${p.route.slice(1)}/</loc></url>`)
  writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`)
  writeFileSync(join(OUT, 'prerender-manifest.json'), JSON.stringify({ base: BASE, origin: ORIGIN, pages: written }, null, 2) + '\n')
  console.log(`prerender: ${written.length} ページ(本文入り ${written.filter((p) => p.ssr).length}、殻 ${written.filter((p) => !p.ssr).length})、サイトマップ ${urls.length} 件`)
} finally {
  await vite.close()
}
