// 공통 모달 오버레이 컴포넌트
// isOpen이 false이면 렌더링하지 않음
// 바깥 클릭 또는 Escape 키로 닫기 가능

import { useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

// 사이즈별 최대 너비 매핑
const SIZE_MAP = {
  sm: '400px',
  md: '560px',
  lg: '720px',
  xl: '900px',
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  // Escape 키 눌렀을 때 모달 닫기
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleKeyDown)
    // 스크롤 잠금
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  // isOpen이 false면 아무것도 렌더링하지 않음
  if (!isOpen) return null

  // 오버레이 클릭 시 닫기 (패널 클릭은 버블링 막음)
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const maxWidth = SIZE_MAP[size] || SIZE_MAP.md

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={handleBackdropClick}
    >
      {/* 모달 패널 */}
      <div
        className="animate-scale-in flex flex-col w-full rounded-xl border border-border"
        style={{
          maxWidth,
          maxHeight: '90vh',
          background: 'var(--surface)',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0"
        >
          <span className="text-sm font-semibold" style={{ color: 'var(--tx)' }}>
            {title}
          </span>
          <button
            className="flex items-center justify-center w-7 h-7 rounded-md transition-colors"
            style={{ color: 'var(--txm)' }}
            onClick={onClose}
            aria-label="닫기"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--elevated)'
              e.currentTarget.style.color = 'var(--tx)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = ''
              e.currentTarget.style.color = 'var(--txm)'
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* 본문 */}
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  )
}
