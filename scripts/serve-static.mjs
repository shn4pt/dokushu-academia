// 静的配信(試作の検証用)。GitHub Pages に近い、次の挙動だけを再現する。GitHub Pages 自体の挙動は、別に確認する(docs/seo/plan.md §5.3)。
//  - ファイルと、ディレクトリの index.html を配る
//  - スラッシュなしのディレクトリのパスは、スラッシュ付きへ 301
//  - 存在しないパスは、404.html の内容を、404 のステータスで返す(SPA の全 URL に 200 で index.html を返さない)
// 使い方: node scripts/serve-static.mjs <ディレクトリ> <ポート> <ベース(例: /dokushu-academia/)>
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join, normalize, resolve } from 'node:path'

const [dir = 'dist-path', port = '4174', base = '/dokushu-academia/'] = process.argv.slice(2)
const root = resolve(dir)
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.xml': 'application/xml', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2', '.woff': 'font/woff' }

function notFound(res) {
  const page = join(root, '404.html')
  const body = existsSync(page) ? readFileSync(page) : Buffer.from('404 Not Found')
  res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' })
  res.end(body)
}

createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost')
  let path
  try { path = decodeURIComponent(url.pathname) } catch { return notFound(res) }
  const baseNoSlash = base.replace(/\/$/, '')
  if (base !== '/' && path === baseNoSlash) {
    res.writeHead(301, { location: base + url.search })
    return res.end()
  }
  if (!path.startsWith(base)) return notFound(res)
  const rel = normalize(path.slice(base.length)).replace(/^(\.\.[/\\])+/, '')
  let file = join(root, rel)
  if (!file.startsWith(root)) return notFound(res)
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!path.endsWith('/')) {
      res.writeHead(301, { location: path + '/' + url.search })
      return res.end()
    }
    file = join(file, 'index.html')
  }
  if (!existsSync(file) || !statSync(file).isFile()) return notFound(res)
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' })
  res.end(readFileSync(file))
}).listen(Number(port), () => console.log(`serve-static: http://localhost:${port}${base} ← ${root}`))
