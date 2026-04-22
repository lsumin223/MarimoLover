// 캐릭터 페이지 — 캐릭터 카드 목록 + 생성/수정/삭제
import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Heart, GitFork } from 'lucide-react'
import useCharacterStore from '../store/useCharacterStore'
import { useIsAdmin } from '../store/useAdminStore'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import RelationGraph from '../components/RelationGraph'
import { getImage, saveImage, resizeImage } from '../lib/imageDB'

const genId = () => 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)

// 캐릭터 썸네일 이미지 컴포넌트 (IndexedDB에서 비동기 로드)
function CharThumb({ imageId, name, size = 40 }) {
  const [src, setSrc] = useState(null)
  useEffect(() => { if (imageId) getImage(imageId).then(setSrc) }, [imageId])
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 font-bold overflow-hidden"
      style={{ width: size, height: size, background: src ? 'transparent' : 'var(--elevated)', color: 'var(--accent)', fontSize: size * 0.4, border: '2px solid var(--border)' }}
    >
      {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (name?.[0] || '?')}
    </div>
  )
}

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
      <span className="text-xs" style={{ color: 'var(--txm)' }}>{label}</span>
      <input type="file" accept="image/*" className="hidden" onChange={onChange} />
    </label>
  )
}

// 캐릭터 폼 초기값
const emptyIndividual = { type: 'individual', name: '', bio: '', personality: '', traits: '', thumbnailImageId: null, fullBodyImageId: null, headImageId: null, profileFields: [], relations: [], timeline: [], colors: [] }
const newMember = () => ({ id: genId(), name: '', role: '', bio: '', imageId: null })
const emptyGroup = { type: 'group', name: '', thumbnailImageId: null, description: '', timeline: [], colors: [], members: [newMember(), newMember()] }

export default function Characters() {
  const isAdmin = useIsAdmin()
  const { characters, addCharacter, updateCharacter, deleteCharacter } = useCharacterStore()

  // 뷰 상태
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'relation'
  // 폼 모달
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [formType, setFormType] = useState('individual')
  const [form, setForm] = useState(emptyIndividual)
  const [thumbPreview, setThumbPreview] = useState(null)
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
    setFormOpen(true)
  }

  // 폼 열기 (수정)
  const openEdit = (char) => {
    setEditTarget(char)
    setFormType(char.type)
    setForm({ ...char })
    setThumbPreview(null)
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

  // 개인 캐릭터 목록 (관계 선택용)
  const individualChars = () => characters.filter(c => c.type === 'individual')

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
        <div className="flex items-center gap-2">
          {/* 뷰 전환 */}
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={viewMode === 'relation'
              ? { background: 'var(--accent)', color: 'var(--bg)' }
              : { border: '1px solid var(--border)', color: 'var(--txm)' }}
            onClick={() => setViewMode(v => v === 'relation' ? 'grid' : 'relation')}
          >
            <GitFork size={13} /> 관계도
          </button>
          {isAdmin && (
            <button className="btn-accent flex items-center gap-1.5" onClick={openCreate}>
              <Plus size={14} /> 새 캐릭터
            </button>
          )}
        </div>
      </div>

      {/* 관계도 뷰 */}
      {viewMode === 'relation' && (
        <RelationGraph characters={characters} />
      )}

      {/* 개인 / 다인 분리 그리드 */}
      {viewMode === 'grid' && (
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
      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editTarget ? '캐릭터 수정' : '새 캐릭터'} size="lg">
        {/* 타입 선택 탭 */}
        {!editTarget && (
          <div className="flex gap-2 mb-4">
            {[['individual', '개인'], ['group', '다인']].map(([t, l]) => (
              <button key={t} className="px-3 py-1 rounded text-sm font-medium transition-all"
                style={formType === t
                  ? { background: 'var(--accent)', color: 'var(--bg)' }
                  : { color: 'var(--txm)', border: '1px solid var(--border)' }
                }
                onClick={() => handleTypeChange(t)}>{l}</button>
            ))}
          </div>
        )}

        <div className="space-y-4">

          {/* 개인 캐릭터 폼 */}
          {formType === 'individual' && (
            <>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>이름 *</label>
                <input className="input" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="캐릭터 이름" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>한줄소개</label>
                <textarea className="textarea" rows={2} value={form.bio || ''} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="캐릭터 소개" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>성격</label>
                <textarea className="textarea" rows={3} value={form.personality || ''} onChange={e => setForm(f => ({ ...f, personality: e.target.value }))} placeholder="성격을 자유롭게 서술해주세요" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>특징</label>
                <textarea className="textarea" rows={3} value={form.traits || ''} onChange={e => setForm(f => ({ ...f, traits: e.target.value }))} placeholder="외형적 특징, 버릇, 능력 등" />
              </div>
              {/* 이미지들 */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--txm)' }}>이미지</label>
                <div className="grid grid-cols-3 gap-3">
                  <CharImageUpload label="썸네일" imageId={form.thumbnailImageId} preview={thumbPreview}
                    onChange={handleThumb} circle />
                  <CharImageUpload label="전신" imageId={form.fullBodyImageId}
                    onChange={async e => {
                      const file = e.target.files[0]; if (!file) return
                      const b64 = await resizeImage(file, 800); const id = genId()
                      await saveImage(id, b64); setForm(f => ({ ...f, fullBodyImageId: id }))
                    }} />
                  <CharImageUpload label="두상/상반신" imageId={form.headImageId}
                    onChange={async e => {
                      const file = e.target.files[0]; if (!file) return
                      const b64 = await resizeImage(file, 600); const id = genId()
                      await saveImage(id, b64); setForm(f => ({ ...f, headImageId: id }))
                    }} />
                </div>
              </div>
              {/* 커스텀 프로필 필드 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium" style={{ color: 'var(--txm)' }}>프로필 항목</span>
                  <button className="text-xs" style={{ color: 'var(--accent)' }}
                    onClick={() => setForm(f => ({ ...f, profileFields: [...(f.profileFields || []), { id: genId(), label: '', value: '' }] }))}>+ 추가</button>
                </div>
                {(form.profileFields || []).map((pf, i) => (
                  <div key={pf.id} className="flex gap-2 mb-2">
                    <input className="input" style={{ width: '35%' }} placeholder="항목명" value={pf.label} onChange={e => setForm(f => { const pfs = [...f.profileFields]; pfs[i] = { ...pfs[i], label: e.target.value }; return { ...f, profileFields: pfs } })} />
                    <input className="input flex-1" placeholder="내용" value={pf.value} onChange={e => setForm(f => { const pfs = [...f.profileFields]; pfs[i] = { ...pfs[i], value: e.target.value }; return { ...f, profileFields: pfs } })} />
                    <button onClick={() => setForm(f => ({ ...f, profileFields: f.profileFields.filter((_, j) => j !== i) }))} style={{ color: 'var(--txs)' }}><X size={14} /></button>
                  </div>
                ))}
              </div>
              {/* 관계 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium" style={{ color: 'var(--txm)' }}>관계</span>
                  <button className="text-xs" style={{ color: 'var(--accent)' }} onClick={() => setForm(f => ({ ...f, relations: [...(f.relations || []), { characterId: '', description: '' }] }))}>+ 추가</button>
                </div>
                {(form.relations || []).map((r, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <select className="input" style={{ width: '40%' }} value={r.characterId} onChange={e => setForm(f => { const relations = [...f.relations]; relations[i] = { ...relations[i], characterId: e.target.value }; return { ...f, relations } })}>
                      <option value="">캐릭터 선택</option>
                      {individualChars().filter(c => c.id !== editTarget?.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input className="input flex-1" placeholder="관계 설명" value={r.description} onChange={e => setForm(f => { const relations = [...f.relations]; relations[i] = { ...relations[i], description: e.target.value }; return { ...f, relations } })} />
                    <button onClick={() => setForm(f => ({ ...f, relations: f.relations.filter((_, j) => j !== i) }))} style={{ color: 'var(--txs)' }}><X size={14} /></button>
                  </div>
                ))}
              </div>
              {/* 타임라인 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium" style={{ color: 'var(--txm)' }}>타임라인</span>
                  <button className="text-xs" style={{ color: 'var(--accent)' }} onClick={() => setForm(f => ({ ...f, timeline: [...(f.timeline || []), { id: genId(), event: '', date: '', description: '' }] }))}>+ 추가</button>
                </div>
                {(form.timeline || []).map((t, i) => (
                  <div key={t.id} className="p-3 rounded-lg mb-2 space-y-2" style={{ background: 'var(--elevated)' }}>
                    <div className="flex gap-2">
                      <input className="input flex-1" placeholder="사건명" value={t.event} onChange={e => setForm(f => { const timeline = [...f.timeline]; timeline[i] = { ...timeline[i], event: e.target.value }; return { ...f, timeline } })} />
                      <input className="input" style={{ width: '120px' }} placeholder="시점" value={t.date} onChange={e => setForm(f => { const timeline = [...f.timeline]; timeline[i] = { ...timeline[i], date: e.target.value }; return { ...f, timeline } })} />
                      <button onClick={() => setForm(f => ({ ...f, timeline: f.timeline.filter((_, j) => j !== i) }))} style={{ color: 'var(--txs)' }}><X size={14} /></button>
                    </div>
                    <textarea className="textarea" rows={2} placeholder="설명" value={t.description} onChange={e => setForm(f => { const timeline = [...f.timeline]; timeline[i] = { ...timeline[i], description: e.target.value }; return { ...f, timeline } })} />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 다인 폼 */}
          {formType === 'group' && (
            <>
              {/* 썸네일 */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--txm)' }}>대표 썸네일</label>
                <div style={{ width: 80 }}>
                  <CharImageUpload label="" imageId={form.thumbnailImageId} preview={thumbPreview} onChange={handleThumb} />
                </div>
              </div>
              {/* 멤버 목록 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium" style={{ color: 'var(--txm)' }}>멤버</span>
                  <button className="text-xs" style={{ color: 'var(--accent)' }}
                    onClick={() => setForm(f => ({ ...f, members: [...(f.members||[]), newMember()] }))}>+ 멤버 추가</button>
                </div>
                {(form.members || []).map((m, i) => (
                  <div key={m.id} className="p-3 rounded-lg mb-2 space-y-2" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium" style={{ color: 'var(--txm)' }}>멤버 {i + 1}</span>
                      {(form.members||[]).length > 2 && (
                        <button onClick={() => setForm(f => ({ ...f, members: f.members.filter((_, j) => j !== i) }))}
                          style={{ color: 'var(--txs)' }}><X size={13} /></button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <div style={{ width: 64, flexShrink: 0 }}>
                        <CharImageUpload label="사진" imageId={m.imageId}
                          onChange={e => handleMemberImage(e, i)} />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <input className="input text-sm" placeholder="이름 *" value={m.name}
                          onChange={e => setForm(f => { const members=[...f.members]; members[i]={...members[i],name:e.target.value}; return {...f,members} })} />
                        <input className="input text-sm" placeholder="역할 (예: 주인공, 라이벌)" value={m.role}
                          onChange={e => setForm(f => { const members=[...f.members]; members[i]={...members[i],role:e.target.value}; return {...f,members} })} />
                        <textarea className="textarea text-sm" rows={2} placeholder="소개"
                          value={m.bio}
                          onChange={e => setForm(f => { const members=[...f.members]; members[i]={...members[i],bio:e.target.value}; return {...f,members} })} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* 관계 이름 */}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>관계 이름 <span style={{ color: 'var(--txs)', fontWeight: 400 }}>(비워두면 캐릭터 이름 A × B 자동 설정)</span></label>
                <input className="input" placeholder="예: 별빛 콤비, 단장×부단장" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              {/* 관계 설명 */}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>관계 설명</label>
                <textarea className="textarea" rows={3} value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="전체 관계 설명" />
              </div>
              {/* 타임라인 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium" style={{ color: 'var(--txm)' }}>타임라인</span>
                  <button className="text-xs" style={{ color: 'var(--accent)' }} onClick={() => setForm(f => ({ ...f, timeline: [...(f.timeline||[]), { id: genId(), event: '', date: '', description: '' }] }))}>+ 추가</button>
                </div>
                {(form.timeline || []).map((t, i) => (
                  <div key={t.id} className="flex gap-2 mb-2">
                    <input className="input flex-1" placeholder="사건명" value={t.event} onChange={e => setForm(f => { const tl=[...f.timeline]; tl[i]={...tl[i],event:e.target.value}; return {...f,timeline:tl} })} />
                    <input className="input" style={{ width: '100px' }} placeholder="시점" value={t.date} onChange={e => setForm(f => { const tl=[...f.timeline]; tl[i]={...tl[i],date:e.target.value}; return {...f,timeline:tl} })} />
                    <button onClick={() => setForm(f => ({ ...f, timeline: f.timeline.filter((_,j)=>j!==i) }))} style={{ color: 'var(--txs)' }}><X size={14} /></button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 공통: 색상 (최대 4개) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: 'var(--txm)' }}>색상 (최대 4개)</span>
              {(form.colors || []).length < 4 && (
                <button className="text-xs" style={{ color: 'var(--accent)' }}
                  onClick={() => setForm(f => ({ ...f, colors: [...(f.colors || []), { label: '', hex: '#888888' }] }))}>
                  + 추가
                </button>
              )}
            </div>
            {(form.colors || []).map((c, i) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                <input type="color" value={c.hex}
                  style={{ width: 34, height: 34, padding: 2, borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', background: 'transparent' }}
                  onChange={e => setForm(f => { const colors = [...(f.colors || [])]; colors[i] = { ...colors[i], hex: e.target.value }; return { ...f, colors } })} />
                <input className="input flex-1" placeholder="HAIR / EYE / 기타" value={c.label}
                  onChange={e => setForm(f => { const colors = [...(f.colors || [])]; colors[i] = { ...colors[i], label: e.target.value }; return { ...f, colors } })} />
                <button onClick={() => setForm(f => ({ ...f, colors: (f.colors || []).filter((_, j) => j !== i) }))}
                  style={{ color: 'var(--txs)' }}><X size={14} /></button>
              </div>
            ))}
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
        message={`"${deleteTarget?.name || deleteTarget?.groupName || '이 캐릭터'}"를 삭제하시겠습니까?`}
        onConfirm={() => { deleteCharacter(deleteTarget.id); setDeleteTarget(null) }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

// 캐릭터 카드 — 이미지 + 하트 + 이름 + 날짜 심플 스타일
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

  return (
    <div
      className="rounded-xl overflow-hidden relative"
      style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 이미지 영역 */}
      <div className="relative" style={{ paddingTop: '80%' }}>
        <div className="absolute inset-0">
          {imgSrc ? (
            <img src={imgSrc} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--elevated)' }}>
              {char.type === 'group' ? (
                <div className="flex flex-wrap gap-1.5 justify-center p-4">
                  {members.slice(0, 6).map((m, i) => (
                    <MemberThumb key={m.id || i} imageId={m.imageId} name={m.name} size={44} />
                  ))}
                </div>
              ) : (
                <span style={{ fontSize: 40, fontWeight: 'bold', color: 'var(--border)' }}>{title?.[0] || '?'}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 이름 + 날짜 */}
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Heart size={11} style={{ color: 'var(--accent)', fill: 'var(--accent)', flexShrink: 0 }} />
          <span className="text-sm font-medium truncate" style={{ color: 'var(--tx)' }}>{title}</span>
        </div>
        {date && <div className="text-xs" style={{ color: 'var(--txs)' }}>{date}</div>}
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

