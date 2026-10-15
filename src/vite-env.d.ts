/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'path': パスの URL 版(試作)。未設定: ハッシュ版(本番) */
  readonly VITE_SITE_MODE?: string
  /** 正規 URL のオリジン(パス版) */
  readonly VITE_SITE_ORIGIN?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
