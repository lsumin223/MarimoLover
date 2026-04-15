// 상단 네비게이션 바 컴포넌트
import { NavLink, Link } from 'react-router-dom'
import { Sun, Moon, Settings, Search, Lock, LockOpen } from 'lucide-react'
import useSettingsStore from '../../store/useSettingsStore'
import useAdminStore from '../../store/useAdminStore'

const NAV_LINKS = [
  { to: '/', label: '홈', exact: true },
  { to: '/characters', label: '캐릭터' },
  { to: '/gallery', label: '갤러리' },
  { to: '/writings', label: '글' },
  { to: '/trpg', label: 'TRPG' },
  { to: '/about', label: '어바웃' },
]

const navBtn = {
  base: 'flex items-center justify-center w-8 h-8 rounded-md transition-colors',
  style: { color: 'var(--txm)', textDecoration: 'none' },
}

export default function Navbar() {
  const { nickname, darkMode, toggleDarkMode, adminPasswordHash } = useSettingsStore()
  const { isAdmin, openLoginModal, logout } = useAdminStore()

  // 비밀번호가 설정된 경우에만 잠금 아이콘 표시
  const showLock = !!adminPasswordHash

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b border-border"
      style={{
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        backgroundColor: 'color-mix(in srgb, var(--surface) 88%, transparent)',
      }}
    >
      <div className="flex items-center justify-between px-4 h-12">
        {/* 왼쪽: 닉네임 */}
        <Link to="/" className="text-sm font-bold tracking-wide shrink-0"
          style={{ color: 'var(--accent)', textDecoration: 'none' }}>
          {nickname || 'MarimoLover'}
        </Link>

        {/* 중앙: 페이지 링크 */}
        <nav className="flex items-center gap-0.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {NAV_LINKS.map(({ to, label, exact }) => (
            <NavLink key={to} to={to} end={exact}
              className="relative shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={({ isActive }) => ({ color: isActive ? 'var(--accent)' : 'var(--txm)', textDecoration: 'none' })}>
              {({ isActive }) => (
                <>
                  {label}
                  {isActive && <span className="absolute bottom-0.5 left-3 right-3 h-0.5 rounded-full" style={{ background: 'var(--accent)' }} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* 오른쪽: 아이콘들 */}
        <div className="flex items-center gap-1 shrink-0">
          {/* 검색 */}
          <Link to="/search" className={navBtn.base} style={navBtn.style} aria-label="검색"
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--elevated)'; e.currentTarget.style.color = 'var(--tx)' }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--txm)' }}>
            <Search size={15} />
          </Link>

          {/* 다크모드 토글 */}
          <button className={navBtn.base} style={navBtn.style} onClick={toggleDarkMode}
            aria-label={darkMode ? '라이트 모드' : '다크 모드'}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--elevated)'; e.currentTarget.style.color = 'var(--tx)' }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--txm)' }}>
            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* 관리자 잠금/해제 — 비밀번호 설정 시에만 표시 */}
          {showLock && (
            isAdmin ? (
              <button
                className={navBtn.base}
                title="관리자 로그아웃"
                onClick={logout}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--elevated)'; e.currentTarget.style.color = 'var(--tx)' }}
                onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--txm)' }}
                style={{ color: 'var(--accent)' }}
              >
                <LockOpen size={15} />
              </button>
            ) : (
              <button
                className={navBtn.base}
                title="관리자 로그인"
                onClick={openLoginModal}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--elevated)'; e.currentTarget.style.color = 'var(--tx)' }}
                onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--txm)' }}
                style={{ color: 'var(--txm)' }}
              >
                <Lock size={15} />
              </button>
            )
          )}

          {/* 설정 */}
          <Link to="/settings" className={navBtn.base} style={navBtn.style} aria-label="설정"
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--elevated)'; e.currentTarget.style.color = 'var(--tx)' }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--txm)' }}>
            <Settings size={15} />
          </Link>
        </div>
      </div>
    </header>
  )
}
