import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import useSettingsStore from './store/useSettingsStore'
import Navbar from './components/layout/Navbar'

// 페이지 임포트
import Home from './pages/Home'
import Characters from './pages/Characters'
import Gallery from './pages/Gallery'
import GalleryPost from './pages/GalleryPost'
import Writings from './pages/Writings'
import WritingPost from './pages/WritingPost'
import WritingEditor from './pages/WritingEditor'
import Trpg from './pages/Trpg'
import TrpgSession from './pages/TrpgSession'
import About from './pages/About'
import Settings from './pages/Settings'
import Search from './pages/Search'

// WorkSelector가 표시되는 경로
const WORK_SELECTOR_PATHS = ['/characters', '/gallery', '/writings']

// HashRouter 내부에서 동작하는 레이아웃 컴포넌트
function Layout() {
  const location = useLocation()
  // WorkSelector가 보이는 페이지 여부에 따라 padding-top 조정
  const hasWorkSelector = WORK_SELECTOR_PATHS.some(
    (p) => location.pathname === p || location.pathname.startsWith(p + '/')
  )

  return (
    <>
      <Navbar />
      {/* Navbar (48px) + WorkSelector (34px) 높이만큼 상단 여백 */}
      <main
        className="min-h-screen"
        style={{
          paddingTop: hasWorkSelector ? '84px' : '48px',
          background: 'var(--bg)',
        }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/characters" element={<Characters />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/gallery/:id" element={<GalleryPost />} />
          <Route path="/writings" element={<Writings />} />
          <Route path="/writings/new" element={<WritingEditor />} />
          <Route path="/writings/:id" element={<WritingPost />} />
          <Route path="/writings/:id/edit" element={<WritingEditor />} />
          <Route path="/trpg" element={<Trpg />} />
          <Route path="/trpg/:sessionId" element={<TrpgSession />} />
          <Route path="/about" element={<About />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/search" element={<Search />} />
        </Routes>
      </main>
    </>
  )
}

function App() {
  const { darkMode, accentColor, accent2Color } = useSettingsStore()

  // 테마 CSS 변수 동기화 (스토어 applyTheme와 함께 이중 보장)
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    root.style.setProperty('--accent', accentColor)
    root.style.setProperty('--accent2', accent2Color)
  }, [darkMode, accentColor, accent2Color])

  return (
    // HashRouter: GitHub Pages 새로고침 404 방지
    <HashRouter>
      <Layout />
    </HashRouter>
  )
}

export default App
