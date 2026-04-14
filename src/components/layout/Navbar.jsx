// 상단 네비게이션 바 컴포넌트
// 고정 상단(fixed top), 전체 너비, z-50
// 왼쪽: 사이트 닉네임, 중앙: 페이지 링크, 오른쪽: 다크모드 토글 + 설정
// 캐릭터/갤러리/글/TRPG 페이지에서는 두 번째 줄에 WorkSelector 표시

import { NavLink, useLocation, Link } from 'react-router-dom'
import { Sun, Moon, Settings, Search } from 'lucide-react'
import useSettingsStore from '../../store/useSettingsStore'
import WorkSelector from './WorkSelector'

// 네비게이션 링크 목록
const NAV_LINKS = [
  { to: '/', label: '홈', exact: true },
  { to: '/characters', label: '캐릭터' },
  { to: '/gallery', label: '갤러리' },
  { to: '/writings', label: '글' },
  { to: '/trpg', label: 'TRPG' },
  { to: '/about', label: '어바웃' },
]

// WorkSelector를 표시할 경로 패턴
const WORK_SELECTOR_PATHS = ['/characters']

export default function Navbar() {
  const { nickname, darkMode, toggleDarkMode } = useSettingsStore()
  const location = useLocation()

  // 현재 경로가 WorkSelector를 보여줄 페이지인지 확인
  const showWorkSelector = WORK_SELECTOR_PATHS.some(
    (path) => location.pathname === path || location.pathname.startsWith(path + '/')
  )

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b border-border"
      style={{
        background: 'rgba(var(--surface-rgb, 23,23,42), 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        backgroundColor: 'color-mix(in srgb, var(--surface) 85%, transparent)',
      }}
    >
      {/* 메인 네비게이션 행 */}
      <div className="flex items-center justify-between px-4 h-12">
        {/* 왼쪽: 사이트 닉네임 */}
        <Link
          to="/"
          className="text-sm font-bold tracking-wide shrink-0 transition-colors"
          style={{ color: 'var(--accent)', textDecoration: 'none' }}
        >
          {nickname || 'MarimoLover'}
        </Link>

        {/* 중앙: 페이지 링크 */}
        <nav className="flex items-center gap-0.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {NAV_LINKS.map(({ to, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className="relative shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={({ isActive }) => ({
                color: isActive ? 'var(--accent)' : 'var(--txm)',
                textDecoration: 'none',
              })}
            >
              {({ isActive }) => (
                <>
                  {label}
                  {/* 활성 페이지 언더라인 인디케이터 */}
                  {isActive && (
                    <span
                      className="absolute bottom-0.5 left-3 right-3 h-0.5 rounded-full"
                      style={{ background: 'var(--accent)' }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* 오른쪽: 검색 + 다크모드 토글 + 설정 */}
        <div className="flex items-center gap-1 shrink-0">
          {/* 검색 */}
          <Link
            to="/search"
            className="flex items-center justify-center w-8 h-8 rounded-md transition-colors"
            style={{ color: 'var(--txm)', textDecoration: 'none' }}
            aria-label="검색"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--elevated)'
              e.currentTarget.style.color = 'var(--tx)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = ''
              e.currentTarget.style.color = 'var(--txm)'
            }}
          >
            <Search size={15} />
          </Link>
          {/* 다크/라이트 모드 토글 */}
          <button
            className="flex items-center justify-center w-8 h-8 rounded-md transition-colors"
            style={{ color: 'var(--txm)' }}
            onClick={toggleDarkMode}
            aria-label={darkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--elevated)'
              e.currentTarget.style.color = 'var(--tx)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = ''
              e.currentTarget.style.color = 'var(--txm)'
            }}
          >
            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* 설정 페이지 링크 */}
          <Link
            to="/settings"
            className="flex items-center justify-center w-8 h-8 rounded-md transition-colors"
            style={{ color: 'var(--txm)', textDecoration: 'none' }}
            aria-label="설정"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--elevated)'
              e.currentTarget.style.color = 'var(--tx)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = ''
              e.currentTarget.style.color = 'var(--txm)'
            }}
          >
            <Settings size={15} />
          </Link>
        </div>
      </div>

      {/* 두 번째 행: WorkSelector (해당 페이지에서만 표시) */}
      {showWorkSelector && <WorkSelector />}
    </header>
  )
}
