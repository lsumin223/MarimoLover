// 미니 갤러리 위젯 — 최근 갤러리 포스트 5개의 첫 번째 이미지를 썸네일로 표시
// 수평 스크롤 행으로 구성, 클릭 시 해당 갤러리 포스트로 이동

import { useState, useEffect, useMemo } from 'react'
import { GripVertical, Image } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getImage } from '../../lib/imageDB'
import useGalleryStore from '../../store/useGalleryStore'

// 단일 갤러리 썸네일 컴포넌트 — IndexedDB에서 이미지 로드
function GalleryThumb({ imageId, title, onClick }) {
  const [src, setSrc] = useState(null)

  useEffect(() => {
    if (!imageId) {
      setSrc(null)
      return
    }
    getImage(imageId).then(setSrc)
  }, [imageId])

  return (
    <button
      className="shrink-0 relative overflow-hidden rounded-lg transition-all"
      style={{
        width: 72,
        height: 72,
        background: 'var(--elevated)',
        border: '1px solid var(--border)',
        padding: 0,
        cursor: 'pointer',
      }}
      onClick={onClick}
      title={title}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent)'
        e.currentTarget.style.boxShadow = '0 0 0 1px var(--accent)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {src ? (
        <img
          src={src}
          alt={title}
          className="w-full h-full animate-fade-in"
          style={{ objectFit: 'cover' }}
        />
      ) : (
        // 이미지 없음 또는 로딩 중 플레이스홀더
        <div
          className="flex items-center justify-center w-full h-full"
          style={{ color: 'var(--txs)' }}
        >
          <Image size={20} strokeWidth={1.5} />
        </div>
      )}
    </button>
  )
}

export default function MiniGalleryWidget() {
  const { posts } = useGalleryStore()
  const navigate = useNavigate()

  // 최근 5개 포스트 (날짜 내림차순)
  const recentPosts = useMemo(() => {
    return [...posts]
      .sort((a, b) => {
        const da = a.date || a.createdAt || ''
        const db = b.date || b.createdAt || ''
        return da < db ? 1 : -1
      })
      .slice(0, 5)
  }, [posts])

  return (
    <div className="widget animate-fade-in">
      {/* 위젯 헤더 */}
      <div className="widget-header">
        <GripVertical size={14} className="drag-handle" style={{ color: 'var(--txs)' }} />
        <span className="widget-header-dot" />
        GALLERY
        {/* 갤러리 페이지로 이동 버튼 */}
        <button
          className="ml-auto text-xs transition-colors"
          style={{ color: 'var(--txs)', background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => navigate('/gallery')}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--txs)')}
        >
          전체 보기
        </button>
      </div>

      {/* 위젯 본문 */}
      <div className="widget-body">
        {recentPosts.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-2 py-4"
            style={{ color: 'var(--txs)' }}
          >
            <Image size={24} strokeWidth={1.5} />
            <span className="text-xs">갤러리가 비어 있습니다</span>
          </div>
        ) : (
          /* 수평 스크롤 썸네일 열 */
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: 'none' }}
          >
            {recentPosts.map((post) => {
              // 첫 번째 이미지 ID 사용
              const firstImageId =
                post.imageIds && post.imageIds.length > 0
                  ? post.imageIds[0]
                  : null

              return (
                <GalleryThumb
                  key={post.id}
                  imageId={firstImageId}
                  title={post.title || '(제목 없음)'}
                  onClick={() => navigate(`/gallery/${post.id}`)}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
