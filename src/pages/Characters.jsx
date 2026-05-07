// 캐릭터 페이지 — 캐릭터 카드 목록 + 생성/수정/삭제
import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X, Image as ImageIcon } from 'lucide-react'
import useCharacterStore from '../store/useCharacterStore'
import { useIsAdmin } from '../store/useAdminStore'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { getImage, saveImage, resizeImage } from '../lib/imageDB'

const genId = () => 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)

// 이미지 업로드 헬퍼
function CharImageUpload({ label, imageId, preview, onChange, circle = false }) {
  const [src, setSrc] = useState(null)
  useEffect(() => {
    if (imageId && !preview) getImage(imageId).then(setSrc)
    else setSrc(null)
  }, [imageId, preview])
  const imgSrc = preview || src
  const cls = circle ? 'rounded-full' : 'rounded-lg'
  return (
    <label className="flex flex-col items-center gap-1 cursor-pointer">
      <div className={`w-full aspect-square overflow-hidden ${cls} flex items-center justify-center`}
        style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
        {imgSrc
          ? <img src={imgSrc} alt={label} className={`w-full h-full object-cover ${cls}`} />
          : <ImageIcon size={18} style={{ color: 'var(--txs)' }} />}
      </div>
      {label && <span className="text-xs" style={{ color: 'var(--txm)' }}>{label}</span>}
      <input type="file" accept="image/*" className="hidden" onChange={onChange} />
    </label>
  )
}

// 캐릭터 폼 초기값
const DEFAULT_MAIN = '#b48ef0'
const DEFAULT_SUB  = '#f093b0'
const emptyIndividual = { type: 'individual', name: '', keywords: [], thumbnailImageId: null, mainColor: DEFAULT_MAIN, subColor: DEFAULT_SUB }
const newMember = () => ({ id: genId(), name: '', role: '', bio: '', imageId: null })
const emptyGroup = { type: 'group', name: '', keywords: [], thumbnailImageId: null, mainColor: DEFAULT_MAIN, subColor: DEFAULT_SUB, members: [newMember(), newMember()] }

export default function Characters() {
  const isAdmin = useIsAdmin()
  const { characters, addCharacter, updateCharacter, deleteCharacter } = useCharacterStore()

  // 폼 모달
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [formType, setFormType] = useState('individual')
  const [form, setForm] = useState(emptyIndividual)
  const [thumbPreview, setThumbPreview] = useState(null)
  const [kwInput, setKwInput] = useState('')
  // 삭제 확인
  const [deleteTarget, setDeleteTarget] = useState(null)

  const individuals = characters.filter(c => c.type === 'individual')
  const groups = characters.filter(c => c.type === 'group')

  // 폼 열기 (신규)
  const openCreate = () => {
    setEditTarget(null)
    setFormType('individual')
    setForm(emptyIndividual)
    setThumbPreview(null)
    setKwInput('')
    setFormOpen(true)
  }

  // 폼 열기 (수정)
  const openEdit = (char) => {
    setEditTarget(char)
    setFormType(char.type)
    setForm({
      mainColor: DEFAULT_MAIN,
      subColor: DEFAULT_SUB,
      keywords: [],
      ...char,
    })
    setThumbPreview(null)
    setKwInput('')
    setFormOpen(true)
  }

  // 타입 변경 시 폼 초기화
  const handleTypeChange = (t) => {
    setFormType(t)
    if (t === 'individual') setForm(emptyIndividual)
    else setForm({ ...emptyGroup, members: [newMember(), newMember()] })
  }

  // 썸네일 업로드
  const handleThumb = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const base64 = await resizeImage(file)
    const id = genId()
    await saveImage(id, base64)
    setForm(f => ({ ...f, thumbnailImageId: id }))
    setThumbPreview(base64)
  }

  // 저장
  const handleSubmit = () => {
    if (!form.name && formType === 'individual') return
    if (editTarget) {
      updateCharacter(editTarget.id, form)
    } else {
      addCharacter({ ...form, id: genId(), createdAt: new Date().toISOString() })
    }
    setFormOpen(false)
  }

  // 다인 멤버 이미지 업로드
  const handleMemberImage = async (e, idx) => {
    const file = e.target.files[0]; if (!file) return
    const b64 = await resizeImage(file, 400); const id = genId()
    await saveImage(id, b64)
    setForm(f => { const members = [...(f.members||[])]; members[idx] = { ...members[idx], imageId: id }; return { ...f, members } })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-fade-in">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold" style={{ color: 'var(--tx)' }}>캐릭터</h1>
        {isAdmin && (
          <button className="btn-accent flex items-center gap-1.5" onClick={openCreate}>
            <Plus size={14} /> 새 캐릭터
          </button>
        )}
      </div>

      {/* 개인 / 다인 분리 그리드 */}
      {(
        individuals.length === 0 && groups.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'var(--txs)' }}>
            등록된 캐릭터가 없습니다
          </div>
        ) : (
          <div className="space-y-10">
            {/* 개인 */}
            {individuals.length > 0 && (
              <section>
                <h2 className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: 'var(--txm)' }}>
                  개인 <span style={{ color: 'var(--txs)', fontWeight: 400 }}>({individuals.length})</span>
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {individuals.map(char => (
                    <CharCard
                      key={char.id}
                      char={char}
                      isAdmin={isAdmin}
                      onEdit={() => openEdit(char)}
                      onDelete={() => setDeleteTarget(char)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 다인 */}
            {groups.length > 0 && (
              <section>
                <h2 className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: 'var(--txm)' }}>
                  다인 <span style={{ color: 'var(--txs)', fontWeight: 400 }}>({groups.length})</span>
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {groups.map(char => (
                    <CharCard
                      key={char.id}
                      char={char}
                      isAdmin={isAdmin}
                      onEdit={() => openEdit(char)}
                      onDelete={() => setDeleteTarget(char)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )
      )}

      {/* 생성/수정 폼 모달 */}
      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editTarget ? '캐릭터 수정' : '새 캐릭터'} size="sm">
        {/* 타입 선택 (신규만) */}
        {!editTarget && (
          <div className="flex gap-2 mb-4">
            {[['individual', '개인'], ['group', '다인']].map(([t, l]) => (
              <button key={t} className="px-3 py-1 rounded text-sm font-medium transition-all"
                style={formType === t ? { background: 'var(--accent)', color: 'var(--bg)' } : { color: 'var(--txm)', border: '1px solid var(--border)' }}
                onClick={() => handleTypeChange(t)}>{l}</button>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {/* 썸네일 + 이름 */}
          <div className="flex gap-4 items-start">
            <div style={{ width: 72, flexShrink: 0 }}>
              <CharImageUpload imageId={form.thumbnailImageId} preview={thumbPreview} onChange={handleThumb} circle />
            </div>
            <div className="flex-1 space-y-2">
              {formType === 'individual' ? (
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>이름 *</label>
                  <input className="input" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="캐릭터 이름" />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>관계 이름 <span style={{ color: 'var(--txs)', fontWeight: 400 }}>(비워두면 이름 A × B 자동)</span></label>
                  <input className="input" placeholder="예: 별빛 콤비" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
              )}
            </div>
          </div>

          {/* 다인: 멤버 목록 */}
          {formType === 'group' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium" style={{ color: 'var(--txm)' }}>멤버</span>
                <button className="text-xs" style={{ color: 'var(--accent)' }}
                  onClick={() => setForm(f => ({ ...f, members: [...(f.members||[]), newMember()] }))}>+ 멤버 추가</button>
              </div>
              {(form.members || []).map((m, i) => (
                <div key={m.id} className="flex gap-2 mb-2 p-2.5 rounded-lg" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                  <div style={{ width: 52, flexShrink: 0 }}>
                    <CharImageUpload imageId={m.imageId} onChange={e => handleMemberImage(e, i)} />
                  </div>
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <input className="input text-sm" placeholder="이름 *" value={m.name}
                      onChange={e => setForm(f => { const ms=[...f.members]; ms[i]={...ms[i],name:e.target.value}; return {...f,members:ms} })} />
                    <input className="input text-sm" placeholder="역할" value={m.role}
                      onChange={e => setForm(f => { const ms=[...f.members]; ms[i]={...ms[i],role:e.target.value}; return {...f,members:ms} })} />
                  </div>
                  {(form.members||[]).length > 2 && (
                    <button onClick={() => setForm(f => ({ ...f, members: f.members.filter((_,j)=>j!==i) }))} style={{ color: 'var(--txs)', alignSelf: 'flex-start', marginTop: 2 }}><X size={13} /></button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 키워드 */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--txm)' }}>
              키워드 <span style={{ color: 'var(--txs)', fontWeight: 400 }}>({(form.keywords||[]).length}/4)</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(form.keywords || []).map((kw, i) => (
                <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
                  style={{ background: `${form.mainColor}22`, color: form.mainColor, border: `1px solid ${form.mainColor}44` }}>
                  {kw}
                  <button onClick={() => setForm(f => ({ ...f, keywords: f.keywords.filter((_,j)=>j!==i) }))} style={{ opacity: 0.7 }}><X size={10} /></button>
                </span>
              ))}
            </div>
            {(form.keywords||[]).length < 4 && (
              <div className="flex gap-2">
                <input className="input flex-1 text-sm" placeholder="키워드 입력" value={kwInput} onChange={e => setKwInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && kwInput.trim()) { setForm(f => ({ ...f, keywords: [...(f.keywords||[]), kwInput.trim()] })); setKwInput('') } }} />
                <button className="btn-ghost text-xs px-3" onClick={() => { if (kwInput.trim()) { setForm(f => ({ ...f, keywords: [...(f.keywords||[]), kwInput.trim()] })); setKwInput('') } }}>추가</button>
              </div>
            )}
          </div>

          {/* 테마 색상 */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--txm)' }}>테마 색상</label>
            <div className="flex gap-4">
              {[['mainColor', '메인'], ['subColor', '서브']].map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <input type="color" value={form[key] || DEFAULT_MAIN}
                    style={{ width: 32, height: 32, padding: 2, borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', background: 'transparent' }}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                  <span className="text-xs" style={{ color: 'var(--txm)' }}>{label}</span>
                  <span className="text-xs font-mono" style={{ color: 'var(--txs)' }}>{form[key]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button className="btn-ghost" onClick={() => setFormOpen(false)}>취소</button>
          <button className="btn-accent" onClick={handleSubmit}>저장</button>
        </div>
      </Modal>

      {/* 삭제 확인 */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        message={`"${deleteTarget?.name || deleteTarget?.groupName || '이 캐릭터'}"를 삭제하시겠습니까?`}
        onConfirm={() => { deleteCharacter(deleteTarget.id); setDeleteTarget(null) }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

// 캐릭터 카드 — 이미지 + 이름 + 날짜 + 키워드 심플 스타일
function CharCard({ char, isAdmin, onEdit, onDelete }) {
  const [imgSrc, setImgSrc] = useState(null)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    if (char.thumbnailImageId) getImage(char.thumbnailImageId).then(setImgSrc)
    else setImgSrc(null)
  }, [char.thumbnailImageId])

  const members = char.members || []
  const autoTitle = members.length <= 2
    ? members.map(m => m.name || '?').join(' × ')
    : members.map(m => m.name || '?').join(' · ')
  const title = char.type === 'individual' ? char.name : (char.name?.trim() || autoTitle)
  const date = (char.createdAt || '').slice(0, 10).replace(/-/g, '.')
  const mainColor = char.mainColor || DEFAULT_MAIN
  const keywords = char.keywords || []

  return (
    <div
      className="rounded-xl overflow-hidden relative"
      style={{ border: `1px solid ${mainColor}55`, background: 'var(--surface)' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 이미지 영역 */}
      <div className="relative" style={{ paddingTop: '80%' }}>
        <div className="absolute inset-0">
          {imgSrc ? (
            <img src={imgSrc} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: `${mainColor}18` }}>
              {char.type === 'group' ? (
                <div className="flex flex-wrap gap-1.5 justify-center p-4">
                  {members.slice(0, 6).map((m, i) => (
                    <MemberThumb key={m.id || i} imageId={m.imageId} name={m.name} size={44} />
                  ))}
                </div>
              ) : (
                <span style={{ fontSize: 40, fontWeight: 'bold', color: mainColor, opacity: 0.4 }}>{title?.[0] || '?'}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 이름 + 날짜 + 키워드 */}
      <div className="px-3 py-2.5">
        <span className="text-sm font-medium truncate block" style={{ color: 'var(--tx)' }}>{title}</span>
        {date && <div className="text-xs mb-1.5" style={{ color: 'var(--txs)' }}>{date}</div>}
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {keywords.map((kw, i) => (
              <span key={i} className="px-2 py-0.5 rounded-full text-xs"
                style={{ background: `${mainColor}22`, color: mainColor, border: `1px solid ${mainColor}44` }}>
                {kw}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 관리자 편집/삭제 (호버) */}
      {isAdmin && hovered && (
        <div className="absolute top-2 right-2 flex gap-1 z-10" onClick={e => e.stopPropagation()}>
          <button className="w-7 h-7 rounded flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }} onClick={onEdit}><Edit2 size={13} /></button>
          <button className="w-7 h-7 rounded flex items-center justify-center"
            style={{ background: 'rgba(220,38,38,0.8)', color: 'white' }} onClick={onDelete}><Trash2 size={13} /></button>
        </div>
      )}
    </div>
  )
}

// 멤버 이미지 (imageId 없으면 이니셜)
function MemberThumb({ imageId, name, size = 48 }) {
  const [src, setSrc] = useState(null)
  useEffect(() => { if (imageId) getImage(imageId).then(setSrc) }, [imageId])
  return (
    <div className="rounded-full flex items-center justify-center shrink-0 font-bold overflow-hidden"
      style={{ width: size, height: size, background: src ? 'transparent' : 'var(--border)', color: 'var(--tx)', fontSize: size * 0.38, border: '2px solid var(--border)' }}>
      {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (name?.[0] || '?')}
    </div>
  )
}

