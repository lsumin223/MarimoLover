// 글 갤러리 페이지 — 글 목록 + 필터
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit2, Trash2, FileText } from 'lucide-react'
import useSettingsStore from '../store/useSettingsStore'
import useWorkStore from '../store/useWorkStore'
import useCharacterStore from '../store/useCharacterStore'
import useWritingStore from '../store/useWritingStore'
import ConfirmDialog from '../components/common/ConfirmDialog'
import TagFilter from '../components/common/TagFilter'

const getWorkTitle = (workId, works) => works.find(w => w.id === workId)?.title || '미분류'

export default function Writings() {
  const navigate = useNavigate()
  const { selectedWorkId } = useSettingsStore()
  const { works } = useWorkStore()
  const { characters } = useCharacterStore()
  const { writings, deleteWriting } = useWritingStore()

  const [selectedTags, setSelectedTags] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [hoveredId, setHoveredId] = useState(null)

  // 필터링 + 정렬
  const filtered = writings
    .filter(w => !selectedWorkId || w.workId === selectedWorkId)
    .filter(w => selectedTags.length === 0 || selectedTags.some(t => w.characterTags?.includes(t)))
    .sort((a, b) => b.date.localeCompare(a.date))

  const charTags = characters.map(c => ({ id: c.id, label: c.name || c.groupName || '?' }))

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold" style={{ color: 'var(--tx)' }}>글 갤러리</h1>
        <button className="btn-accent flex items-center gap-1.5" onClick={() => navigate('/writings/new')}>
          <Plus size={14} /> 새 글 작성
        </button>
      </div>

      {/* 캐릭터 태그 필터 */}
      <div className="mb-5">
        <TagFilter tags={charTags} selected={selectedTags} onChange={setSelectedTags} label="캐릭터" />
      </div>

      {/* 글 목록 */}
      {filtered.length === 0 ? (
        <div className="text-center py-20" style={{ color: 'var(--txs)' }}>등록된 글이 없습니다</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(writing => (
            <div
              key={writing.id}
              className="card p-4 cursor-pointer relative"
              onMouseEnter={() => setHoveredId(writing.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => navigate(`/writings/${writing.id}`)}
            >
              {/* 호버 시 편집/삭제 */}
              {hoveredId === writing.id && (
                <div className="absolute top-3 right-3 flex gap-1" onClick={e => e.stopPropagation()}>
                  <button className="w-7 h-7 rounded flex items-center justify-center" style={{ background: 'var(--elevated)', color: 'var(--txm)' }} onClick={() => navigate(`/writings/${writing.id}/edit`)}><Edit2 size={12} /></button>
                  <button className="w-7 h-7 rounded flex items-center justify-center" style={{ background: 'var(--elevated)', color: '#f87171' }} onClick={() => setDeleteTarget(writing)}><Trash2 size={12} /></button>
                </div>
              )}

              {/* 헤더 */}
              <div className="flex items-start gap-3 mb-2 pr-16">
                <FileText size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--accent2)' }} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-base truncate" style={{ color: 'var(--tx)' }}>{writing.title}</div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {writing.workId && <span className="tag text-xs">{getWorkTitle(writing.workId, works)}</span>}
                    {(writing.characterTags || []).map(id => {
                      const c = characters.find(x => x.id === id)
                      return c ? <span key={id} className="tag text-xs" style={{ color: 'var(--accent2)', background: 'color-mix(in srgb, var(--accent2) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--accent2) 25%, transparent)' }}>{c.name || '?'}</span> : null
                    })}
                    <span className="text-xs ml-auto" style={{ color: 'var(--txs)' }}>{writing.date}</span>
                  </div>
                </div>
              </div>

              {/* 내용 미리보기 */}
              {writing.content && (
                <p className="text-sm pl-7 line-clamp-2" style={{ color: 'var(--txm)', whiteSpace: 'pre-wrap', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {writing.content.slice(0, 120)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 삭제 확인 */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        message={`"${deleteTarget?.title}"를 삭제하시겠습니까?`}
        onConfirm={() => { deleteWriting(deleteTarget.id); setDeleteTarget(null) }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
