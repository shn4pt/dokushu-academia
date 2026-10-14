import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import App from './App'
import { lessonIdFromRoute, preloadLesson } from './lessons/preload'
import { PATH_MODE, ROUTER_BASENAME } from './site'
import './styles.css'

const root = document.getElementById('root')!

if (!PATH_MODE) {
  // 通常のビルド(本番のハッシュ版)。変更なし
  createRoot(root).render(
    <StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </StrictMode>,
  )
} else {
  // パスの URL 版(試作)。生成した HTML(data-ssr)があるページは引き継ぎ、殻(404、進捗など)や、生成していないページは、ブラウザで描画する。
  const tree = (
    <StrictMode>
      <BrowserRouter basename={ROUTER_BASENAME}>
        <App />
      </BrowserRouter>
    </StrictMode>
  )
  const route = location.pathname.slice(ROUTER_BASENAME.length) || '/'
  const lesson = lessonIdFromRoute(route)
  // 引き継ぐには、最初の描画で、サーバーと同じ本文が必要。描画の前に、本文を読み込んでおく
  void (lesson ? preloadLesson(lesson) : Promise.resolve()).then(() => {
    if (root.dataset.ssr === '1') {
      hydrateRoot(root, tree, {
        // 引き継ぎの不一致(回復可能なエラー)を、記録する。テストは、この記録が空であることを確かめる
        onRecoverableError: (error) => {
          const w = window as unknown as { __recoverableErrors?: string[] }
          ;(w.__recoverableErrors ??= []).push(String((error as Error)?.message ?? error))
          console.error('ハイドレーションの回復可能なエラー', error)
        },
      })
    } else {
      createRoot(root).render(tree)
    }
  })
}
