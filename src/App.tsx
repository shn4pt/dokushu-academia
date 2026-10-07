import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Roadmap from './pages/Roadmap'
import StagePage from './pages/StagePage'
import LessonPage from './pages/LessonPage'
import Glossary from './pages/Glossary'
import ProgressPage from './pages/ProgressPage'
import { overallStats } from './data/stats'
import { useProgress } from './progress'

export default function App() {
  const p = useProgress()
  const { percent } = overallStats(p)
  return (
    <>
      <header className="site-header">
        <NavLink to="/" className="brand">LLMのしくみ</NavLink>
        <nav>
          <NavLink to="/roadmap">ロードマップ</NavLink>
          <NavLink to="/glossary">用語集</NavLink>
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
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  )
}
