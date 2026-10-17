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

/** 公開文書(パスの URL 版。vite.config.ts の publicDocs プラグインが、元ファイルから、ビルド時に作る) */
declare module 'virtual:public-docs' {
  type Doc = { path: string; sha256: string; html: string }
  export const docs: { license: Doc; materials: Doc; code: { path: string; sha256: string; text: string } }
}
