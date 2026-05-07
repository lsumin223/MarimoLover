// 글 뷰어
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Edit2, Trash2 } from 'lucide-react'
import useWritingStore from '../store/useWritingStore'
import { useIsAdmin } from '../store/useAdminStore'
import ConfirmDialog from '../components/common/ConfirmDialog'

export default function WritingPost() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isAdmin = useIsAdmin()
  const { writings, series, deleteWriting } = useWritingStore()

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [readProgress, setReadProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement
      const scrolled = el.scrollTop
      const total = el.scrollHeight - el.clientHeight
      setReadProgress(total > 0 ? Math.min(100, (scrolled / total) * 100) : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const writing = writings.find(w => w.id === id)
  if (!writing) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 text-center" style={{ color: 'var(--txs)' }}>
        <p>글을 찾을 수 없습니다.</p>
        <button className="btn-ghost mt-4" onClick={() => navigate('/writings')}>← 목록으로</button>
      </div>
    )
  }

  const siblingsInSeries = [...writings]
    .filter(w => w.seriesId === writing.seriesId)
    .sort((a, b) => (a.chapterNum || 0) - (b.chapterNum || 0))
  const idx = siblingsInSeries.findIndex(w => w.id === id)
  const prev = siblingsInSeries[idx - 1]
  const next = siblingsInSeries[idx + 1]

  const currentSeries = series?.find(s => s.id === writing.seriesId)

  const renderContent = (text) => {
    return text.split('\n').map((line, i) => {
      if (line.trim() === '---') return <hr key={i} style={{ width: '40%', margin: '2em auto', borderColor: 'var(--border)' }} />
      return <span key={i}>{line}{'\n'}</span>
    })
  }

  return (
    <div className="relative min-h-screen animate-fade-in" style={{ background: 'var(--bg)' }}>
      {/* 읽기 진행률 바 */}
      <div className="fixed top-12 left-0 right-0 z-20" style={{ height: 2, background: 'var(--border)' }}>
        <div style={{ height: '100%', width: `${readProgress}%`, background: 'var(--accent)', transition: 'width 0.1s linear' }} />
      </div>

      {/* 상단 툴바 */}
      <div className="sticky top-12 z-10 flex items-center justify-between px-4 py-2"
        style={{ background: 'color-mix(in srgb, var(--surface) 90%, transparent)', backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--border)' }}>
        <button className="flex items-center gap-1 text-sm btn-ghost" onClick={() => navigate('/writings')}>
          <ChevronLeft size={16} /> 목록
        </button>
        {isAdmin && (
          <div className="flex gap-2">
            <button className="btn-ghost flex items-center gap-1.5" onClick={() => navigate(`/writings/${id}/edit`)}>
              <Edit2 size={13} /> 수정
            </button>
            <button className="btn-danger flex items-center gap-1.5" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={13} /> 삭제
            </button>
          </div>
        )}
      </div>

      {/* 본문 영역 */}
      <div className="mx-auto px-4 py-12" style={{ maxWidth: 680 }}>
        {/* 제목/메타 */}
        <div className="mb-8">
          {currentSeries && (
            <div className="text-xs mb-2 cursor-pointer" style={{ color: 'var(--accent)' }} onClick={() => navigate('/writings')}>
              {currentSeries.title}{writing.chapterNum ? ` · ${writing.chapterNum}화` : ''}
            </div>
          )}
          <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--tx)', fontFamily: 'Noto Serif KR, serif' }}>
            {writing.title}
          </h1>
          <div className="text-xs" style={{ color: 'var(--txs)' }}>{writing.date}</div>
        </div>

        {/* 본문 */}
        <div
          className="writing-viewer-content"
          style={{
            fontFamily: 'Noto Serif KR, serif',
            fontSize: '17px',
            lineHeight: '1.9',
            letterSpacing: '0.03em',
            color: 'var(--tx)',
          }}
        >
          {renderContent(writing.content || '')}
        </div>

        {/* 이전/다음 내비게이션 */}
        <div className="flex justify-between mt-16 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
          {prev ? (
            <button className="flex items-center gap-2 text-sm" style={{ color: 'var(--txm)' }} onClick={() => navigate(`/writings/${prev.id}`)}>
              <ChevronLeft size={16} />
              <span className="truncate max-w-40">{prev.chapterNum ? `${prev.chapterNum}화 ` : ''}{prev.title}</span>
            </button>
          ) : <div />}
          {next ? (
            <button className="flex items-center gap-2 text-sm" style={{ color: 'var(--txm)' }} onClick={() => navigate(`/writings/${next.id}`)}>
              <span className="truncate max-w-40">{next.chapterNum ? `${next.chapterNum}화 ` : ''}{next.title}</span>
              <ChevronRight size={16} />
            </button>
          ) : <div />}
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteOpen}
        message={`"${writing.title}"를 삭제하시겠습니까?`}
        onConfirm={() => { deleteWriting(writing.id); navigate('/writings') }}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  )
}
