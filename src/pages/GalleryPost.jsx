// 갤러리 게시글 상세 페이지
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Edit2, Trash2, X, Image as ImageIcon } from 'lucide-react'
import useGalleryStore from '../store/useGalleryStore'
import useCharacterStore from '../store/useCharacterStore'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import ImageSlider from '../components/common/ImageSlider'
import { deleteImage, saveImage, resizeImage, getImage } from '../lib/imageDB'

const genId = () => 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)

export default function GalleryPost() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { posts, updatePost, deletePost } = useGalleryStore()
  const { characters } = useCharacterStore()
  const individualChars = characters.filter(c => c.type === 'individual')

  const post = posts.find(p => p.id === id)

  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState(null)
  const [previews, setPreviews] = useState([])
  const [deleteOpen, setDeleteOpen] = useState(false)

  // 게시글 없을 때
  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 text-center" style={{ color: 'var(--txs)' }}>
        <p>게시글을 찾을 수 없습니다.</p>
        <button className="btn-ghost mt-4" onClick={() => navigate('/gallery')}>← 갤러리로 돌아가기</button>
      </div>
    )
  }


  // 편집 모달 열기
  const openEdit = async () => {
    setForm({ ...post })
    const loaded = await Promise.all((post.imageIds || []).map(async id => ({ id, src: await getImage(id) })))
    setPreviews(loaded.filter(p => p.src))
    setEditOpen(true)
  }

  // 이미지 추가
  const handleImages = async (e) => {
    const files = Array.from(e.target.files)
    for (const file of files) {
      const base64 = await resizeImage(file)
      const newId = genId()
      await saveImage(newId, base64)
      setForm(f => ({ ...f, imageIds: [...(f.imageIds || []), newId] }))
      setPreviews(ps => [...ps, { id: newId, src: base64 }])
    }
  }

  // 이미지 제거
  const removeImage = async (imgId) => {
    await deleteImage(imgId)
    setForm(f => ({ ...f, imageIds: (f.imageIds || []).filter(i => i !== imgId) }))
    setPreviews(ps => ps.filter(p => p.id !== imgId))
  }

  // 저장
  const handleSave = () => {
    if (!form?.title) return
    updatePost(post.id, form)
    setEditOpen(false)
  }

  // 삭제
  const handleDelete = async () => {
    for (const imgId of (post.imageIds || [])) {
      await deleteImage(imgId)
    }
    deletePost(post.id)
    navigate('/gallery')
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 animate-fade-in">
      {/* 상단 버튼 */}
      <div className="flex items-center justify-between mb-6">
        <button className="flex items-center gap-1 text-sm btn-ghost" onClick={() => navigate('/gallery')}>
          <ChevronLeft size={16} /> 갤러리
        </button>
        <div className="flex gap-2">
          <button className="btn-ghost flex items-center gap-1.5" onClick={openEdit}><Edit2 size={13} /> 수정</button>
          <button className="btn-danger flex items-center gap-1.5" onClick={() => setDeleteOpen(true)}><Trash2 size={13} /> 삭제</button>
        </div>
      </div>

      {/* 이미지 슬라이더 */}
      <div className="rounded-xl overflow-hidden mb-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)', minHeight: '300px' }}>
        {post.imageIds && post.imageIds.length > 0
          ? <ImageSlider imageIds={post.imageIds} className="w-full" />
          : <div className="flex items-center justify-center h-64"><ImageIcon size={40} style={{ color: 'var(--txs)' }} /></div>
        }
      </div>

      {/* 게시글 정보 */}
      <div className="p-5 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--tx)' }}>{post.title}</h1>
        <div className="flex flex-wrap gap-2 items-center">
          {(post.tags || []).map((name, i) => <span key={i} className="tag" style={{ color: 'var(--accent2)', background: 'color-mix(in srgb, var(--accent2) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--accent2) 25%, transparent)' }}>{name}</span>)}
          <span className="text-xs ml-auto" style={{ color: 'var(--txs)' }}>{post.date}</span>
        </div>
      </div>

      {/* 수정 모달 */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="게시글 수정" size="md">
        {form && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>제목</label>
              <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>날짜</label>
              <input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            {individualChars.length > 0 && (
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--txm)' }}>캐릭터 태그</label>
                <div className="flex flex-wrap gap-2">
                  {individualChars.map(c => {
                    const active = (form.tags || []).includes(c.name)
                    return (
                      <button key={c.id}
                        className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                        style={active
                          ? { background: 'var(--accent)', color: 'var(--bg)' }
                          : { border: '1px solid var(--border)', color: 'var(--txm)' }}
                        onClick={() => setForm(f => ({
                          ...f,
                          tags: active ? (f.tags || []).filter(t => t !== c.name) : [...(f.tags || []), c.name]
                        }))}>
                        {c.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--txm)' }}>이미지</label>
              <div className="flex gap-2 flex-wrap mb-2">
                {previews.map(p => (
                  <div key={p.id} className="relative w-16 h-16">
                    <img src={p.src} alt="" className="w-full h-full object-cover rounded" />
                    <button className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#ef4444', color: 'white' }} onClick={() => removeImage(p.id)}><X size={10} /></button>
                  </div>
                ))}
              </div>
              <label className="btn-ghost cursor-pointer inline-flex items-center gap-1.5 text-xs">
                <ImageIcon size={13} /> 이미지 추가
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
              </label>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2 mt-6">
          <button className="btn-ghost" onClick={() => setEditOpen(false)}>취소</button>
          <button className="btn-accent" onClick={handleSave}>저장</button>
        </div>
      </Modal>

      {/* 삭제 확인 */}
      <ConfirmDialog
        isOpen={deleteOpen}
        message={`"${post.title}"를 삭제하시겠습니까? 이미지도 함께 삭제됩니다.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  )
}
