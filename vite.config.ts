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

export default defineConfig({
  base: './',
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
