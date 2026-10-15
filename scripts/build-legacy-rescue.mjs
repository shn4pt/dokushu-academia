// 旧サイト向けの、移行の案内と進捗の書き出し(ローカル専用の試作。Issue #23)のビルド。出力は dist-legacy-rescue/(本番の dist/ とは別)。
//   npm run build:legacy-rescue
// 環境変数: NEW_ORIGIN(新サイトの仮の URL。既定 http://localhost:4175)。この試作では、localhost / 127.0.0.1 だけを許可する。
//           AUTO_FORWARD(既定 on。`off` なら、運営者の設定として、自動転送を一括で無効にし、手動のリンクだけにする)。
// 本番の deploy.yml・dist・進捗の保存方式は変更しない。通常のルートから、この成果物への導線はない。
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'

const origin = (process.env.NEW_ORIGIN ?? 'http://localhost:4175').replace(/\/+$/, '')
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
  console.error(`NEW_ORIGIN は、この試作では、http://localhost:<ポート> か http://127.0.0.1:<ポート> に限ります。受け取った値: ${origin}`)
  process.exit(1)
}
const autoForward = (process.env.AUTO_FORWARD ?? 'on') !== 'off'
const OUT = process.env.OUT_DIR ?? 'dist-legacy-rescue'
const rel = relative(resolve('dist'), resolve(OUT))
if (rel === '' || (rel !== '..' && !rel.startsWith('..' + sep) && !isAbsolute(rel))) {
  console.error('本番のハッシュ版の出力先(dist)には、出せません。OUT_DIR を変えてください。')
  process.exit(1)
}
rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })
cpSync('legacy-rescue', OUT, { recursive: true })
const js = readFileSync(`${OUT}/rescue.js`, 'utf8')
if (!js.includes('__NEW_ORIGIN__') || !js.includes('__AUTO_FORWARD__')) throw new Error('rescue.js に、__NEW_ORIGIN__ / __AUTO_FORWARD__ の置き換え先がありません')
writeFileSync(`${OUT}/rescue.js`, js.replace('__NEW_ORIGIN__', origin).replace('__AUTO_FORWARD__', String(autoForward)))
const html = readFileSync(`${OUT}/index.html`, 'utf8').replaceAll('http://localhost:4175', origin)
writeFileSync(`${OUT}/index.html`, html)
console.log(`旧サイト向けの案内(ローカル専用の試作)を ${OUT}/ に出力しました(新サイトの仮 URL: ${origin}/、自動転送: ${autoForward ? 'on' : 'off'})`)
