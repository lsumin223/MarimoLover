// 아카이브 위젯 — 갤러리 + 글 최근 5개를 날짜 내림차순으로 표시
// 각 아이템 클릭 시 해당 상세 페이지로 이동

import { useMemo } from 'react'
import { Image, FileText, GripVertical } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useGalleryStore from '../../store/useGalleryStore'
import useWritingStore from '../../store/useWritingStore'
import useWorkStore from '../../store/useWorkStore'

export default function ArchiveWidget() {
  const { posts } = useGalleryStore()
  const { writings } = useWritingStore()
  const { works } = useWorkStore()
  const navigate = useNavigate()

  // 작품 id -> 제목 매핑
  const workMap = useMemo(() => {
    const map = {}
    works.forEach((w) => {
      map[w.id] = w.title
    })
    return map
  }, [works])

  // 갤러리 + 글을 합쳐 날짜 내림차순으로 정렬 후 상위 5개 추출
  const recentItems = useMemo(() => {
    const galleryItems = posts.map((p) => ({
      id: p.id,
      type: 'gallery',
      title: p.title || '(제목 없음)',
      date: p.date || p.createdAt || '',
      workId: p.workId,
      path: `/gallery/${p.id}`,
    }))

    const writingItems = writings.map((w) => ({
      id: w.id,
      type: 'writing',
      title: w.title || '(제목 없음)',
      date: w.date || w.createdAt || '',
      workId: w.workId,
      path: `/writings/${w.id}`,
    }))

    return [...galleryItems, ...writingItems]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 5)
  }, [posts, writings])

  return (
    <div className="widget animate-fade-in">
      {/* 위젯 헤더 */}
      <div className="widget-header">
        <GripVertical size={14} className="drag-handle" style={{ color: 'var(--txs)' }} />
        <span className="widget-header-dot" />
        RECENT WORKS
      </div>

      {/* 위젯 본문 */}
      <div className="widget-body" style={{ padding: '8px 0' }}>
        {recentItems.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: 'var(--txs)' }}>
            아직 작품이 없습니다
          </p>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {recentItems.map((item) => (
              <li key={`${item.type}-${item.id}`}>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                  onClick={() => navigate(item.path)}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'var(--elevated)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'transparent')
                  }
                >
                  {/* 타입 아이콘 */}
                  <span
                    className="shrink-0 flex items-center justify-center w-6 h-6 rounded"
                    style={{
                      background:
                        item.type === 'gallery'
                          ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
                          : 'color-mix(in srgb, var(--accent2) 12%, transparent)',
                      color:
                        item.type === 'gallery' ? 'var(--accent)' : 'var(--accent2)',
                    }}
                  >
                    {item.type === 'gallery' ? (
                      <Image size={12} />
                    ) : (
                      <FileText size={12} />
                    )}
                  </span>

                  {/* 제목 + 부가 정보 */}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span
                      className="text-xs font-medium truncate"
                      style={{ color: 'var(--tx)' }}
                    >
                      {item.title}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {/* 작품명 */}
                      {item.workId && workMap[item.workId] && (
                        <span
                          className="text-xs truncate"
                          style={{ color: 'var(--txs)', maxWidth: 80 }}
                        >
                          {workMap[item.workId]}
                        </span>
                      )}
                      {item.workId && workMap[item.workId] && item.date && (
                        <span style={{ color: 'var(--txs)', fontSize: 10 }}>·</span>
                      )}
                      {/* 날짜 */}
                      {item.date && (
                        <span
                          className="text-xs tabular-nums shrink-0"
                          style={{ color: 'var(--txs)' }}
                        >
                          {item.date.slice(0, 10)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
