// パスの URL 版(試作。Issue #15、docs/seo/plan.md)のビルド。本番のハッシュ版(`npm run build` → dist/)とは別の出力に出す。
//   npm run build:path        → dist-path/        (ベース /dokushu-academia/。GitHub Pages のプロジェクト配下の形)
//   npm run build:path:root   → dist-path-root/   (ベース /。独自ドメインの、ルート配下の形)
// 環境変数: SITE_BASE(ベース。既定 /dokushu-academia/)、SITE_ORIGIN(正規 URL のオリジン。既定 https://shn4pt.github.io)、OUT_DIR(出力先。既定 dist-path)
import { spawnSync } from 'node:child_process'

const base = process.env.SITE_BASE ?? '/dokushu-academia/'
if (!base.startsWith('/') || !base.endsWith('/')) {
  console.error(`SITE_BASE は、/ で始まり、/ で終わる形にしてください(例: /dokushu-academia/ か /)。受け取った値: ${base}`)
  process.exit(1)
}
const env = {
  ...process.env,
  VITE_SITE_MODE: 'path',
  SITE_BASE: base,
  VITE_SITE_ORIGIN: process.env.SITE_ORIGIN ?? process.env.VITE_SITE_ORIGIN ?? 'https://shn4pt.github.io',
  OUT_DIR: process.env.OUT_DIR ?? 'dist-path',
}
if (env.OUT_DIR === 'dist') {
  console.error('本番のハッシュ版の出力先(dist)には、出せません。OUT_DIR を変えてください。')
  process.exit(1)
}
const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { stdio: 'inherit', env })
  if (r.status !== 0) process.exit(r.status ?? 1)
}
// 索引・クイズ・学習時間のデータ(通常のビルドと同じもの。ハッシュ版の設定で生成する)
const dataEnv = { ...process.env }
delete dataEnv.VITE_SITE_MODE
const idx = spawnSync('node', ['scripts/build-search-index.mjs'], { stdio: 'inherit', env: dataEnv })
if (idx.status !== 0) process.exit(idx.status ?? 1)
run('npx', ['vite', 'build'])
run('node', ['scripts/prerender.mjs'])
console.log(`パスの URL 版を ${env.OUT_DIR}/ に出力しました(ベース ${base}、オリジン ${env.VITE_SITE_ORIGIN})`)
