// 그림 갤러리 페이지 — 썸네일 그리드 + 작성/수정/삭제
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit2, Trash2, X, Image as ImageIcon } from 'lucide-react'
import useSettingsStore from '../store/useSettingsStore'
import useWorkStore from '../store/useWorkStore'
import useCharacterStore from '../store/useCharacterStore'
import useGalleryStore from '../store/useGalleryStore'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import TagFilter from '../components/common/TagFilter'
import { getImage, saveImage, deleteImage, resizeImage } from '../lib/imageDB'

const genId = () => 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
const getWorkTitle = (workId, works) => works.find(w => w.id === workId)?.title || '미분류'

// 개별 썸네일 이미지 컴포넌트
function GalleryThumb({ imageId }) {
  const [src, setSrc] = useState(null)
  useEffect(() => { if (imageId) getImage(imageId).then(setSrc) }, [imageId])
  return (
    <div className="w-full aspect-square rounded-lg overflow-hidden" style={{ background: 'var(--elevated)' }}>
      {src
        ? <img src={src} alt="" className="w-full h-full object-cover" />
        : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={24} style={{ color: 'var(--txs)' }} /></div>
      }
    </div>
  )
}

const emptyForm = { title: '', workId: '', characterTags: [], imageIds: [], date: new Date().toISOString().slice(0, 10) }

export default function Gallery() {
  const navigate = useNavigate()
  const { selectedWorkId } = useSettingsStore()
  const { works } = useWorkStore()
  const { characters } = useCharacterStore()
  const { posts, addPost, updatePost, deletePost } = useGalleryStore()

  // 태그 필터
  const [selectedTags, setSelectedTags] = useState([])
  // 폼 모달
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)
  // 업로드 프리뷰 상태 [{id, src}]
  const [previews, setPreviews] = useState([])
  // 삭제 확인
  const [deleteTarget, setDeleteTarget] = useState(null)
  // 카드 호버
  const [hoveredId, setHoveredId] = useState(null)

  // 필터링
  const filtered = posts
    .filter(p => !selectedWorkId || p.workId === selectedWorkId)
    .filter(p => selectedTags.length === 0 || selectedTags.some(t => p.characterTags?.includes(t)))
    .sort((a, b) => b.date.localeCompare(a.date))

  // 캐릭터 태그 목록
  const charTags = characters.map(c => ({ id: c.id, label: c.name || c.groupName || '?' }))

  // 폼 열기 (신규)
  const openCreate = () => {
    setEditTarget(null)
    setForm(emptyForm)
    setPreviews([])
    setFormOpen(true)
  }

  // 폼 열기 (수정)
  const openEdit = (post) => {
    setEditTarget(post)
    setForm({ ...post })
    // 기존 이미지 프리뷰 로드
    Promise.all((post.imageIds || []).map(async id => ({ id, src: await getImage(id) }))).then(setPreviews)
    setFormOpen(true)
  }

  // 이미지 업로드
  const handleImages = async (e) => {
    const files = Array.from(e.target.files)
    for (const file of files) {
      const base64 = await resizeImage(file)
      const id = genId()
      await saveImage(id, base64)
      setForm(f => ({ ...f, imageIds: [...(f.imageIds || []), id] }))
      setPreviews(ps => [...ps, { id, src: base64 }])
    }
  }

  // 이미지 제거
  const removeImage = async (id) => {
    await deleteImage(id)
    setForm(f => ({ ...f, imageIds: (f.imageIds || []).filter(i => i !== id) }))
    setPreviews(ps => ps.filter(p => p.id !== id))
  }

  // 저장
  const handleSubmit = () => {
    if (!form.title) return
    if (editTarget) {
      updatePost(editTarget.id, { ...form })
    } else {
      addPost({ ...form, id: genId(), createdAt: new Date().toISOString() })
    }
    setFormOpen(false)
  }

  // 삭제
  const handleDelete = async () => {
    for (const id of (deleteTarget.imageIds || [])) {
      await deleteImage(id)
    }
    deletePost(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-fade-in">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold" style={{ color: 'var(--tx)' }}>그림 갤러리</h1>
        <button className="btn-accent flex items-center gap-1.5" onClick={openCreate}>
          <Plus size={14} /> 새 게시글
        </button>
      </div>

      {/* 캐릭터 태그 필터 */}
      <div className="mb-5">
        <TagFilter tags={charTags} selected={selectedTags} onChange={setSelectedTags} label="캐릭터" />
      </div>

      {/* 갤러리 그리드 */}
      {filtered.length === 0 ? (
        <div className="text-center py-20" style={{ color: 'var(--txs)' }}>등록된 그림이 없습니다</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map(post => (
            <div
              key={post.id}
              className="group relative cursor-pointer"
              onMouseEnter={() => setHoveredId(post.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => navigate(`/gallery/${post.id}`)}
            >
              <GalleryThumb imageId={post.imageIds?.[0]} />
              {/* 호버 오버레이 */}
              <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }}>
                <div className="text-xs font-medium text-white truncate">{post.title}</div>
                <div className="text-xs text-white/60">{post.date}</div>
              </div>
              {/* 편집/삭제 버튼 */}
              {hoveredId === post.id && (
                <div className="absolute top-2 right-2 flex gap-1" onClick={e => e.stopPropagation()}>
                  <button className="w-6 h-6 rounded flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }} onClick={() => openEdit(post)}><Edit2 size={11} /></button>
                  <button className="w-6 h-6 rounded flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', color: '#f87171' }} onClick={() => setDeleteTarget(post)}><Trash2 size={11} /></button>
                </div>
              )}
              {/* 이미지 개수 뱃지 */}
              {(post.imageIds?.length || 0) > 1 && (
                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-xs font-bold text-white" style={{ background: 'rgba(0,0,0,0.5)' }}>
                  {post.imageIds.length}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 게시글 폼 모달 */}
      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editTarget ? '게시글 수정' : '새 게시글'} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>제목 *</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="제목을 입력하세요" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>작품</label>
              <select className="input" value={form.workId || ''} onChange={e => setForm(f => ({ ...f, workId: e.target.value }))}>
                <option value="">미분류</option>
                {works.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>날짜</label>
              <input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--txm)' }}>캐릭터 태그</label>
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
              {characters.map(c => (
                <label key={c.id} className="flex items-center gap-1.5 cursor-pointer text-sm">
                  <input type="checkbox"
                    checked={(form.characterTags || []).includes(c.id)}
                    onChange={e => setForm(f => ({ ...f, characterTags: e.target.checked ? [...(f.characterTags || []), c.id] : (f.characterTags || []).filter(id => id !== c.id) }))}
                  />
                  <span style={{ color: 'var(--tx)' }}>{c.name || c.groupName || '?'}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--txm)' }}>이미지</label>
            {/* 프리뷰 */}
            {previews.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3">
                {previews.map(p => (
                  <div key={p.id} className="relative w-16 h-16">
                    <img src={p.src} alt="" className="w-full h-full object-cover rounded" />
                    <button
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: '#ef4444', color: 'white' }}
                      onClick={() => removeImage(p.id)}
                    ><X size={10} /></button>
                  </div>
                ))}
              </div>
            )}
            <label className="btn-ghost cursor-pointer inline-flex items-center gap-1.5 text-xs">
              <ImageIcon size={13} /> 이미지 추가
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button className="btn-ghost" onClick={() => setFormOpen(false)}>취소</button>
          <button className="btn-accent" onClick={handleSubmit}>저장</button>
        </div>
      </Modal>

      {/* 삭제 확인 */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        message={`"${deleteTarget?.title}"를 삭제하시겠습니까? 이미지도 함께 삭제됩니다.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
