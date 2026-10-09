import { Suspense, lazy } from 'react'
import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Roadmap from './pages/Roadmap'
import StagePage from './pages/StagePage'
import LessonPage from './pages/LessonPage'
import Glossary from './pages/Glossary'
import ProgressPage from './pages/ProgressPage'
import SourcesPage from './pages/SourcesPage'
import SearchPage from './pages/SearchPage'
import ReviewPage from './pages/ReviewPage'
import { useDueKeys } from './review'
import { overallStats } from './data/stats'
import { useProgress } from './progress'

// API の SDK を含むため、開いたときにだけ読み込む
const ApiKeyPage = lazy(() => import('./pages/ApiKeyPage'))

export default function App() {
  const p = useProgress()
  const { percent } = overallStats(p)
  const due = useDueKeys().length
  return (
    <>
      <header className="site-header">
        <NavLink to="/" className="brand">LLMのしくみ</NavLink>
        <nav>
          <NavLink to="/roadmap">ロードマップ</NavLink>
          <NavLink to="/glossary">用語集</NavLink>
          <NavLink to="/search">検索</NavLink>
          <NavLink to="/review">復習{due > 0 && <span className="count-badge" aria-label={`${due}問`}>{due}</span>}</NavLink>
          <NavLink to="/progress">進捗 {percent}%</NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/stage/:id" element={<StagePage />} />
          <Route path="/lesson/:id" element={<LessonPage />} />
          <Route path="/glossary" element={<Glossary />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/api-key" element={<Suspense fallback={<p className="muted">読み込み中…</p>}><ApiKeyPage /></Suspense>} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/sources" element={<SourcesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="site-footer">
        このアプリは AI(Claude Code)が執筆しています。<Link to="/sources">出典と確認の状況</Link>
      </footer>
    </>
  )
}
