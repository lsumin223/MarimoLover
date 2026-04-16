// 미니 갤러리 위젯 — 최근 갤러리 포스트 4개를 2×2 그리드로 표시
import { useState, useEffect, useMemo } from 'react'
import { GripVertical, Image } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getImage } from '../../lib/imageDB'
import useGalleryStore from '../../store/useGalleryStore'

function GalleryThumb({ post, onClick }) {
  const [src, setSrc] = useState(null)
  const imageId = post.imageIds?.[0]

  useEffect(() => {
    if (!imageId) { setSrc(null); return }
    getImage(imageId).then(setSrc)
  }, [imageId])

  return (
    <button
      className="relative overflow-hidden rounded-lg transition-all"
      style={{ aspectRatio: '1', background: 'var(--elevated)', border: '1px solid var(--border)', padding: 0, cursor: 'pointer', width: '100%' }}
      onClick={onClick}
      title={post.title}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 1px var(--accent)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      {src ? (
        <img src={src} alt={post.title} className="w-full h-full animate-fade-in" style={{ objectFit: 'cover' }} />
      ) : (
        /* 이미지 없는 포스트: 제목 텍스트 */
        <div className="flex flex-col items-center justify-center w-full h-full gap-1 p-2"
          style={{ border: '1.5px dashed color-mix(in srgb, var(--accent) 35%, transparent)', borderRadius: 8 }}>
          <span className="text-xs font-medium text-center leading-tight line-clamp-2" style={{ color: 'var(--txm)' }}>{post.title}</span>
        </div>
      )}
    </button>
  )
}

export default function MiniGalleryWidget() {
  const { posts } = useGalleryStore()
  const navigate = useNavigate()

  const recentPosts = useMemo(() => {
    return [...posts]
      .sort((a, b) => ((a.date || a.createdAt || '') < (b.date || b.createdAt || '') ? 1 : -1))
      .slice(0, 4)
  }, [posts])

  return (
    <div className="widget animate-fade-in">
      <div className="widget-header">
        <GripVertical size={14} className="drag-handle" style={{ color: 'var(--txs)' }} />
        <span className="widget-header-dot" />
        GALLERY
        <button
          className="ml-auto text-xs transition-colors"
          style={{ color: 'var(--txs)', background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => navigate('/gallery')}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--txs)')}
        >
          전체 보기
        </button>
      </div>

      <div className="widget-body">
        {recentPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-4" style={{ color: 'var(--txs)' }}>
            <Image size={24} strokeWidth={1.5} />
            <span className="text-xs">갤러리가 비어 있습니다</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {recentPosts.map(post => (
              <GalleryThumb key={post.id} post={post} onClick={() => navigate(`/gallery/${post.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
