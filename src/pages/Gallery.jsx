// 그림 갤러리 페이지 — 썸네일 그리드 + 라이트박스 + 비밀글 잠금
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Lock, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react'
import useGalleryStore from '../store/useGalleryStore'
import useCharacterStore from '../store/useCharacterStore'
import { useIsAdmin } from '../store/useAdminStore'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import TagInput from '../components/common/TagInput'
import { getImage, saveImage, deleteImage, resizeImage } from '../lib/imageDB'

const genId = () => 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// 개별 썸네일 이미지
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

// 이미지 없는 텍스트 카드
function TextCard({ post }) {
  return (
    <div
      className="w-full aspect-square rounded-lg flex flex-col items-center justify-center gap-2 p-3 text-center"
      style={{
        background: 'var(--elevated)',
        border: '1.5px dashed color-mix(in srgb, var(--accent) 40%, transparent)',
      }}
    >
      <span className="text-xs font-bold leading-tight line-clamp-3" style={{ color: 'var(--tx)' }}>
        {post.title}
      </span>
      <span className="text-xs" style={{ color: 'var(--txs)' }}>{post.date}</span>
      {(post.tags || []).length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center">
          {post.tags.slice(0, 2).map(t => (
            <span key={t} className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}>{t}</span>
          ))}
        </div>
      )}
    </div>
  )
}

// 라이트박스
function Lightbox({ post, initialIdx, onClose }) {
  const [idx, setIdx] = useState(initialIdx)
  const [srcs, setSrcs] = useState([])
  const ids = post.imageIds || []

  useEffect(() => {
    if (ids.length > 0) Promise.all(ids.map(id => getImage(id))).then(setSrcs)
  }, [ids.join(',')])

  const goNext = useCallback(() => setIdx(i => (i + 1) % ids.length), [ids.length])
  const goPrev = useCallback(() => setIdx(i => (i - 1 + ids.length) % ids.length), [ids.length])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, goNext, goPrev])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)' }}
      onClick={onClose}
    >
      {/* 닫기 */}
      <button className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }} onClick={onClose}><X size={18} /></button>

      {/* 이미지 or 텍스트 카드 */}
      <div className="relative flex items-center justify-center w-full h-full px-16" onClick={e => e.stopPropagation()}>
        {ids.length === 0 ? (
          <div className="p-8 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.06)', maxWidth: 360 }}>
            <ImageIcon size={32} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <div className="text-white font-bold text-lg mb-1">{post.title}</div>
            <div className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>{post.date}</div>
            {(post.tags || []).length > 0 && (
              <div className="flex flex-wrap gap-1 justify-center mt-3">
                {post.tags.map(t => <span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}>{t}</span>)}
              </div>
            )}
          </div>
        ) : srcs[idx] ? (
          <img src={srcs[idx]} alt="" className="max-w-full max-h-full object-contain rounded-lg select-none" style={{ maxHeight: '90vh' }} />
        ) : null}
      </div>

      {/* 이전/다음 */}
      {ids.length > 1 && (
        <>
          <button
            className="absolute left-4 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
            onClick={e => { e.stopPropagation(); goPrev() }}
          ><ChevronLeft size={20} /></button>
          <button
            className="absolute right-4 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
            onClick={e => { e.stopPropagation(); goNext() }}
          ><ChevronRight size={20} /></button>
        </>
      )}

      {/* 인덱스 표시 */}
      {ids.length > 1 && (
        <div className="absolute bottom-6 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{idx + 1} / {ids.length}</div>
      )}

      {/* 제목 */}
      <div className="absolute top-4 left-0 right-0 text-center text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>{post.title}</div>
    </div>
  )
}

// 비밀번호 확인 모달
function PasswordModal({ onConfirm, onCancel, correctHash }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)
  const [show, setShow] = useState(false)

  const check = async () => {
    const hash = await sha256(pw)
    if (hash === correctHash) { onConfirm() }
    else { setError(true); setPw('') }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onCancel}>
      <div className="rounded-xl p-6 w-72 animate-slide-up" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-4">
          <Lock size={16} style={{ color: 'var(--accent)' }} />
          <span className="text-sm font-bold" style={{ color: 'var(--tx)' }}>비밀번호 입력</span>
        </div>
        <div className="relative mb-3">
          <input
            className="input pr-9"
            type={show ? 'text' : 'password'}
            value={pw}
            onChange={e => { setPw(e.target.value); setError(false) }}
            placeholder="비밀번호"
            onKeyDown={e => e.key === 'Enter' && check()}
            autoFocus
          />
          <button className="absolute right-2.5 top-2" style={{ color: 'var(--txm)' }} onClick={() => setShow(s => !s)}>
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        {error && <p className="text-xs mb-2" style={{ color: '#f87171' }}>비밀번호가 맞지 않습니다.</p>}
        <div className="flex gap-2 justify-end">
          <button className="btn-ghost text-sm" onClick={onCancel}>취소</button>
          <button className="btn-accent text-sm" onClick={check}>확인</button>
        </div>
      </div>
    </div>
  )
}

const emptyForm = { title: '', imageIds: [], date: new Date().toISOString().slice(0, 10), passwordHash: null, tags: [] }

export default function Gallery() {
  const isAdmin = useIsAdmin()
  const { posts, addPost, updatePost, deletePost } = useGalleryStore()
  const { characters } = useCharacterStore()
  const individualChars = characters.filter(c => c.type === 'individual' && c.name)

  // 폼 상태
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [previews, setPreviews] = useState([])
  const [pwInput, setPwInput] = useState('')
  const [showPwInput, setShowPwInput] = useState(false)

  // 삭제
  const [deleteTarget, setDeleteTarget] = useState(null)
  // 호버
  const [hoveredId, setHoveredId] = useState(null)
  // 라이트박스
  const [lightbox, setLightbox] = useState(null) // {post, imgIdx}
  // 비밀번호 확인
  const [pwModal, setPwModal] = useState(null) // {post}
  const [unlockedIds, setUnlockedIds] = useState(new Set())

  // 정렬
  const [sortBy, setSortBy] = useState('newest')
  const filtered = [...posts].sort((a, b) => {
    if (sortBy === 'newest') return b.date.localeCompare(a.date)
    if (sortBy === 'oldest') return a.date.localeCompare(b.date)
    if (sortBy === 'title')  return (a.title || '').localeCompare(b.title || '', 'ko')
    return 0
  })

  // 카드 클릭 — 비밀글이면 비번 모달, 아니면 라이트박스
  const handleCardClick = (post) => {
    if (post.passwordHash && !unlockedIds.has(post.id)) {
      setPwModal({ post })
    } else {
      setLightbox({ post, imgIdx: 0 })
    }
  }

  // 폼 열기
  const openCreate = () => {
    setEditTarget(null)
    setForm({ ...emptyForm })
    setPreviews([])
    setPwInput('')
    setShowPwInput(false)
    setFormOpen(true)
  }
  const openEdit = (post) => {
    setEditTarget(post)
    setForm({ ...post })
    setShowPwInput(!!post.passwordHash)
    setPwInput('')
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
  const removeImage = async (id) => {
    await deleteImage(id)
    setForm(f => ({ ...f, imageIds: (f.imageIds || []).filter(i => i !== id) }))
    setPreviews(ps => ps.filter(p => p.id !== id))
  }

  // 저장
  const handleSubmit = async () => {
    if (!form.title) return
    let passwordHash = form.passwordHash
    if (showPwInput && pwInput.trim()) {
      passwordHash = await sha256(pwInput.trim())
    } else if (!showPwInput) {
      passwordHash = null
    }
    const data = { ...form, passwordHash }
    if (editTarget) updatePost(editTarget.id, data)
    else addPost(data)
    setFormOpen(false)
  }

  const handleDelete = async () => {
    for (const id of (deleteTarget.imageIds || [])) await deleteImage(id)
    deletePost(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-fade-in">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold" style={{ color: 'var(--tx)' }}>그림 갤러리</h1>
        <div className="flex items-center gap-2">
          <select
            className="input text-xs"
            style={{ width: 110, padding: '4px 8px' }}
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="newest">최신순</option>
            <option value="oldest">오래된순</option>
            <option value="title">제목순</option>
          </select>
          {isAdmin && <button className="btn-accent flex items-center gap-1.5" onClick={openCreate}><Plus size={14} /> 새 게시글</button>}
        </div>
      </div>

      {/* 그리드 */}
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
              onClick={() => handleCardClick(post)}
            >
              {(post.imageIds?.length || 0) > 0
                ? <GalleryThumb imageId={post.imageIds[0]} />
                : <TextCard post={post} />
              }

              {/* 잠금 오버레이 */}
              {post.passwordHash && !unlockedIds.has(post.id) && (
                <div className="absolute inset-0 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.55)' }}>
                  <Lock size={20} style={{ color: 'rgba(255,255,255,0.8)' }} />
                </div>
              )}

              {/* 호버 정보 오버레이 — 이미지 있는 카드만 */}
              {(post.imageIds?.length || 0) > 0 && (
                <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }}>
                  <div className="text-xs font-medium text-white truncate">{post.title}</div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{post.date}</div>
                </div>
              )}

              {/* 편집/삭제 버튼 — 관리자만 */}
              {isAdmin && hoveredId === post.id && (
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

      {/* 폼 모달 */}
      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editTarget ? '게시글 수정' : '새 게시글'} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>제목 *</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="제목" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>날짜</label>
            <input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          {/* 캐릭터 태그 선택 */}
          {individualChars.length > 0 && (
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--txm)' }}>캐릭터 태그</label>
              <div className="flex flex-wrap gap-1">
                {individualChars.map(c => {
                  const active = (form.tags || []).some(t => t.toLowerCase() === c.name.toLowerCase())
                  return (
                    <button key={c.id}
                      className="px-2 py-0.5 rounded-full text-xs transition-all"
                      style={active
                        ? { background: 'var(--accent)', color: 'var(--bg)' }
                        : { border: '1px solid var(--border)', color: 'var(--txm)' }}
                      onClick={() => {
                        const name = c.name
                        if (active) setForm(f => ({ ...f, tags: (f.tags||[]).filter(t => t.toLowerCase() !== name.toLowerCase()) }))
                        else setForm(f => ({ ...f, tags: [...(f.tags||[]), name] }))
                      }}
                    >{c.name}</button>
                  )
                })}
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>태그 (자유 입력)</label>
            <TagInput tags={form.tags || []} onChange={v => setForm(f => ({ ...f, tags: v }))} placeholder="태그 입력 후 Enter" />
          </div>

          {/* 비밀글 설정 */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input type="checkbox" checked={showPwInput} onChange={e => { setShowPwInput(e.target.checked); if (!e.target.checked) setPwInput('') }} />
              <span className="text-sm flex items-center gap-1" style={{ color: 'var(--txm)' }}><Lock size={12} /> 비밀글 설정</span>
            </label>
            {showPwInput && (
              <input className="input" type="password" placeholder={editTarget?.passwordHash ? '새 비밀번호 (빈칸이면 유지)' : '비밀번호 입력'} value={pwInput} onChange={e => setPwInput(e.target.value)} />
            )}
          </div>

          {/* 이미지 */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--txm)' }}>이미지</label>
            {previews.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3">
                {previews.map(p => (
                  <div key={p.id} className="relative w-16 h-16">
                    <img src={p.src} alt="" className="w-full h-full object-cover rounded" />
                    <button className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#ef4444', color: 'white' }} onClick={() => removeImage(p.id)}><X size={10} /></button>
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
        message={`"${deleteTarget?.title}"를 삭제하시겠습니까?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* 비밀번호 모달 */}
      {pwModal && (
        <PasswordModal
          correctHash={pwModal.post.passwordHash}
          onConfirm={() => {
            const post = pwModal.post
            setUnlockedIds(s => new Set([...s, post.id]))
            setPwModal(null)
            setLightbox({ post, imgIdx: 0 })
          }}
          onCancel={() => setPwModal(null)}
        />
      )}

      {/* 라이트박스 */}
      {lightbox && (
        <Lightbox
          post={lightbox.post}
          initialIdx={lightbox.imgIdx}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}
