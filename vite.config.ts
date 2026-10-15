import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 本番ビルドにだけ付ける Content Security Policy。
// 学習用に API キーをブラウザで扱うため、通信先を自サイトと Claude API に限定する。
const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'", // KaTeX の数式が style 属性を使う
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.anthropic.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ')

// パスの URL 版(試作。Issue #15): VITE_SITE_MODE=path のときだけ、ベースと出力先を切り替える。
// 通常のビルド(本番のハッシュ版)は、base './'、出力先 dist のまま。
const pathMode = process.env.VITE_SITE_MODE === 'path'

export default defineConfig({
  base: pathMode ? (process.env.SITE_BASE ?? '/dokushu-academia/') : './',
  build: pathMode ? { outDir: process.env.OUT_DIR ?? 'dist-path' } : {},
  plugins: [
    react(),
    {
      name: 'content-security-policy',
      apply: 'build',
      transformIndexHtml: (html) =>
        html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`),
    },
  ],
})
