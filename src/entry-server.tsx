// パスの URL 版(試作)の、サーバー側の入口。scripts/prerender.mjs が、ビルド時に呼ぶ。
// 引き継ぎ用の描画(renderToString)を使う。索引用の renderToStaticMarkup は、出力を引き継げないので、使わない。
import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { lessonIdFromRoute, preloadLesson } from './lessons/preload'
import { ROUTER_BASENAME } from './site'

/** アプリ内のパス(例: `/lesson/pm-1`)を、サーバーで描画して、HTML の文字列を返す。 */
export async function renderRoute(route: string) {
  const lesson = lessonIdFromRoute(route)
  if (lesson) await preloadLesson(lesson) // ブラウザと同じ最初の描画にするため、本文を先に読み込む
  return renderToString(
    <StrictMode>
      <MemoryRouter basename={ROUTER_BASENAME} initialEntries={[ROUTER_BASENAME + route]}>
        <App />
      </MemoryRouter>
    </StrictMode>,
  )
}
