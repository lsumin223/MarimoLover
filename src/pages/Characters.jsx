// 캐릭터 페이지 — 캐릭터 카드 목록 + 생성/수정/삭제 + 상세 모달
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit2, Trash2, X, ChevronRight, Image as ImageIcon, FileText } from 'lucide-react'
import useCharacterStore from '../store/useCharacterStore'
import useGalleryStore from '../store/useGalleryStore'
import useWritingStore from '../store/useWritingStore'
import { useIsAdmin } from '../store/useAdminStore'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
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
const emptyIndividual = { type: 'individual', workId: '', name: '', bio: '', personality: '', traits: '', thumbnailImageId: null, fullBodyImageId: null, headImageId: null, profileFields: [], relations: [], timeline: [], colors: [] }
const emptyPair = { type: 'pair', workId: '', characterA: '', characterB: '', thumbnailImageId: null, description: '', timeline: [], colors: [] }
const emptyGroup = { type: 'group', workId: '', groupName: '', members: [], thumbnailImageId: null, description: '', colors: [] }

export default function Characters() {
  const isAdmin = useIsAdmin()
  const navigate = useNavigate()
  const { characters, addCharacter, updateCharacter, deleteCharacter } = useCharacterStore()
  const { posts } = useGalleryStore()
  const { writings } = useWritingStore()

  // 필터 상태
  const [typeFilter, setTypeFilter] = useState('all') // 'all' | 'individual' | 'pair'
  // 폼 모달
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [formType, setFormType] = useState('individual')
  const [form, setForm] = useState(emptyIndividual)
  const [thumbPreview, setThumbPreview] = useState(null)
  // 상세 모달
  const [detailChar, setDetailChar] = useState(null)
  const [activeTab, setActiveTab] = useState('profile')
  // 삭제 확인
  const [deleteTarget, setDeleteTarget] = useState(null)

  const filtered = characters.filter(c => {
    if (typeFilter === 'individual') return c.type === 'individual'
    if (typeFilter === 'pair') return c.type === 'pair' || c.type === 'group'
    return true
  })

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
    else if (t === 'pair') setForm(emptyPair)
    else setForm(emptyGroup)
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

  // 상세 모달 열기
  const openDetail = (char) => {
    setDetailChar(char)
    setActiveTab(char.type === 'individual' ? 'profile' : char.type === 'pair' ? 'relation' : 'members')
  }

  // 개인 캐릭터 목록 (관계/페어 선택용)
  const sameWorkChars = () => characters.filter(c => c.type === 'individual')

  // 해당 캐릭터의 로그 — tags 배열에서 캐릭터명으로 매칭
  const getCharLogs = (char) => {
    const name = (char.name || '').toLowerCase()
    return {
      gallery:  posts.filter(p => (p.tags || []).some(t => t.toLowerCase() === name)),
      writings: writings.filter(w => (w.tags || []).some(t => t.toLowerCase() === name)),
    }
  }

  // 페어 로그 (두 캐릭터 이름 모두 포함)
  const getPairLogs = (charIdA, charIdB) => {
    const nameA = (characters.find(c => c.id === charIdA)?.name || '').toLowerCase()
    const nameB = (characters.find(c => c.id === charIdB)?.name || '').toLowerCase()
    return {
      gallery:  posts.filter(p => { const t = (p.tags || []).map(x => x.toLowerCase()); return t.includes(nameA) && t.includes(nameB) }),
      writings: writings.filter(w => { const t = (w.tags || []).map(x => x.toLowerCase()); return t.includes(nameA) && t.includes(nameB) }),
    }
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

      {/* 타입 필터 */}
      <div className="flex gap-2 mb-5">
        {[['all', '전체'], ['individual', '개인'], ['pair', '페어 & 다인관계']].map(([v, l]) => (
          <button
            key={v}
            className="px-3 py-1 rounded-full text-xs font-medium transition-all"
            style={typeFilter === v
              ? { background: 'var(--accent)', color: 'var(--bg)', border: '1px solid var(--accent)' }
              : { background: 'transparent', color: 'var(--txm)', border: '1px solid var(--border)' }
            }
            onClick={() => setTypeFilter(v)}
          >{l}</button>
        ))}
      </div>

      {/* 캐릭터 그리드 */}
      {filtered.length === 0 ? (
        <div className="text-center py-20" style={{ color: 'var(--txs)' }}>
          등록된 캐릭터가 없습니다
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(char => (
            <CharCard
              key={char.id}
              char={char}
              characters={characters}
              isAdmin={isAdmin}
              onEdit={() => openEdit(char)}
              onDelete={() => setDeleteTarget(char)}
              onClick={() => openDetail(char)}
            />
          ))}
        </div>
      )}

      {/* 생성/수정 폼 모달 */}
      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editTarget ? '캐릭터 수정' : '새 캐릭터'} size="lg">
        {/* 타입 선택 탭 */}
        {!editTarget && (
          <div className="flex gap-2 mb-4">
            {[['individual', '개인'], ['pair', '페어'], ['group', '다인관계']].map(([t, l]) => (
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
                      {sameWorkChars().filter(c => c.id !== editTarget?.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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

          {/* 페어 폼 */}
          {formType === 'pair' && (
            <>
              {[['characterA', '캐릭터 A'], ['characterB', '캐릭터 B']].map(([k, l]) => (
                <div key={k}>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>{l}</label>
                  <select className="input" value={form[k] || ''} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}>
                    <option value="">캐릭터 선택</option>
                    {sameWorkChars().map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>관계 설명</label>
                <textarea className="textarea" rows={3} value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="두 캐릭터의 관계를 설명해주세요" />
              </div>
              {/* 페어 타임라인 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium" style={{ color: 'var(--txm)' }}>타임라인</span>
                  <button className="text-xs" style={{ color: 'var(--accent)' }} onClick={() => setForm(f => ({ ...f, timeline: [...(f.timeline || []), { id: genId(), event: '', date: '', description: '' }] }))}>+ 추가</button>
                </div>
                {(form.timeline || []).map((t, i) => (
                  <div key={t.id} className="flex gap-2 mb-2">
                    <input className="input flex-1" placeholder="사건명" value={t.event} onChange={e => setForm(f => { const timeline = [...f.timeline]; timeline[i] = { ...timeline[i], event: e.target.value }; return { ...f, timeline } })} />
                    <input className="input" style={{ width: '100px' }} placeholder="시점" value={t.date} onChange={e => setForm(f => { const timeline = [...f.timeline]; timeline[i] = { ...timeline[i], date: e.target.value }; return { ...f, timeline } })} />
                    <button onClick={() => setForm(f => ({ ...f, timeline: f.timeline.filter((_, j) => j !== i) }))} style={{ color: 'var(--txs)' }}><X size={14} /></button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 다인관계 폼 */}
          {formType === 'group' && (
            <>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>그룹명</label>
                <input className="input" value={form.groupName || ''} onChange={e => setForm(f => ({ ...f, groupName: e.target.value }))} placeholder="그룹 이름" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--txm)' }}>멤버</label>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {sameWorkChars().map(c => (
                    <label key={c.id} className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-elevated">
                      <input type="checkbox" checked={(form.members || []).includes(c.id)} onChange={e => setForm(f => ({ ...f, members: e.target.checked ? [...(f.members || []), c.id] : (f.members || []).filter(id => id !== c.id) }))} />
                      <span className="text-sm" style={{ color: 'var(--tx)' }}>{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>설명</label>
                <textarea className="textarea" rows={3} value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button className="btn-ghost" onClick={() => setFormOpen(false)}>취소</button>
          <button className="btn-accent" onClick={handleSubmit}>저장</button>
        </div>
      </Modal>

      {/* 상세 모달 */}
      {detailChar && (
        <CharDetailModal
          char={detailChar}
          characters={characters}
          posts={posts}
          writings={writings}
          isAdmin={isAdmin}
          getCharLogs={getCharLogs}
          getPairLogs={getPairLogs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onClose={() => setDetailChar(null)}
          onEdit={() => { setDetailChar(null); openEdit(detailChar) }}
          onNavigateChar={(id) => { const c = characters.find(x => x.id === id); if (c) { setDetailChar(c); setActiveTab('profile') } }}
          navigate={navigate}
        />
      )}

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

// 캐릭터 카드 컴포넌트 — 포트레이트 카드 스타일
function CharCard({ char, characters, isAdmin, onEdit, onDelete, onClick }) {
  const [imgSrc, setImgSrc] = useState(null)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    if (char.thumbnailImageId) getImage(char.thumbnailImageId).then(setImgSrc)
    else setImgSrc(null)
  }, [char.thumbnailImageId])

  const getName = (id) => characters.find(c => c.id === id)?.name || '?'
  const getCharById = (id) => characters.find(c => c.id === id)

  const title = char.type === 'individual' ? char.name
    : char.type === 'pair' ? `${getName(char.characterA)} × ${getName(char.characterB)}`
    : char.groupName
  const desc = char.type === 'individual' ? char.bio : char.description
  const colors = char.colors || []
  const typeColor = { individual: 'var(--accent)', pair: 'var(--accent2)', group: 'var(--txm)' }[char.type]
  const typeBadge = { individual: '개인', pair: '페어', group: '그룹' }[char.type]

  return (
    <div
      className="rounded-xl overflow-hidden cursor-pointer relative"
      style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {/* 헤더: 타입 배지 + 이름 + 색상 스와치 */}
      <div className="px-3 pt-2.5 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-xs font-medium block mb-0.5" style={{ color: typeColor }}>{typeBadge}</span>
            <span className="text-sm font-bold block truncate" style={{ color: 'var(--tx)' }}>{title}</span>
          </div>
          {colors.length > 0 && (
            <div className="flex gap-1 shrink-0 pt-1">
              {colors.slice(0, 4).map((c, i) => (
                <div key={i} title={c.label} className="w-3 h-3 rounded-full"
                  style={{ background: c.hex, boxShadow: '0 0 0 1.5px rgba(0,0,0,0.12)' }} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 이미지 영역 (세로 3:4 비율) */}
      <div className="relative" style={{ paddingTop: '130%' }}>
        <div className="absolute inset-0">
          {imgSrc ? (
            <img src={imgSrc} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--elevated)' }}>
              {char.type === 'pair' ? (
                <div className="flex items-end" style={{ gap: 0 }}>
                  <div style={{ marginRight: -14, zIndex: 1 }}>
                    <CharThumb imageId={getCharById(char.characterA)?.thumbnailImageId} name={getName(char.characterA)} size={56} />
                  </div>
                  <CharThumb imageId={getCharById(char.characterB)?.thumbnailImageId} name={getName(char.characterB)} size={56} />
                </div>
              ) : char.type === 'group' ? (
                <div className="flex flex-wrap gap-1.5 justify-center p-4">
                  {(char.members || []).slice(0, 6).map(mid => {
                    const m = getCharById(mid)
                    return <CharThumb key={mid} imageId={m?.thumbnailImageId} name={m?.name} size={40} />
                  })}
                </div>
              ) : (
                <span style={{ fontSize: 40, fontWeight: 'bold', color: 'var(--border)' }}>{title?.[0] || '?'}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 푸터: 설명 */}
      <div className="px-3 py-2.5" style={{ borderTop: '1px solid var(--border)', minHeight: 38 }}>
        {desc
          ? <p className="text-xs line-clamp-2" style={{ color: 'var(--txm)' }}>{desc}</p>
          : <span className="text-xs" style={{ color: 'var(--txs)' }}>—</span>}
      </div>

      {/* 관리자 편집/삭제 (호버) */}
      {isAdmin && hovered && (
        <div className="absolute top-9 right-2 flex gap-1 z-10" onClick={e => e.stopPropagation()}>
          <button className="w-7 h-7 rounded flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }} onClick={onEdit}><Edit2 size={13} /></button>
          <button className="w-7 h-7 rounded flex items-center justify-center"
            style={{ background: 'rgba(220,38,38,0.8)', color: 'white' }} onClick={onDelete}><Trash2 size={13} /></button>
        </div>
      )}
    </div>
  )
}

// 전신/두상 이미지 표시 컴포넌트
function CharDetailImages({ fullBodyId, headId }) {
  const [fullSrc, setFullSrc] = useState(null)
  const [headSrc, setHeadSrc] = useState(null)
  const [zoom, setZoom] = useState(null) // src string

  useEffect(() => { if (fullBodyId) getImage(fullBodyId).then(setFullSrc) }, [fullBodyId])
  useEffect(() => { if (headId) getImage(headId).then(setHeadSrc) }, [headId])

  return (
    <>
      <div className="flex gap-2">
        {fullSrc && (
          <div className="cursor-pointer rounded-lg overflow-hidden" style={{ width: 120, flexShrink: 0, border: '1px solid var(--border)' }} onClick={() => setZoom(fullSrc)}>
            <img src={fullSrc} alt="전신" className="w-full object-cover" style={{ maxHeight: 200, objectPosition: 'top' }} />
            <div className="text-center text-xs py-0.5" style={{ color: 'var(--txs)', background: 'var(--elevated)' }}>전신</div>
          </div>
        )}
        {headSrc && (
          <div className="cursor-pointer rounded-lg overflow-hidden" style={{ width: 120, flexShrink: 0, border: '1px solid var(--border)' }} onClick={() => setZoom(headSrc)}>
            <img src={headSrc} alt="두상" className="w-full object-cover" style={{ maxHeight: 200, objectPosition: 'top' }} />
            <div className="text-center text-xs py-0.5" style={{ color: 'var(--txs)', background: 'var(--elevated)' }}>두상</div>
          </div>
        )}
      </div>
      {zoom && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.88)' }} onClick={() => setZoom(null)}>
          <img src={zoom} alt="" className="max-w-full max-h-full object-contain rounded-lg" style={{ maxHeight: '90vh' }} />
        </div>
      )}
    </>
  )
}

// 캐릭터 상세 모달
function CharDetailModal({ char, characters, posts, writings, isAdmin, getCharLogs, getPairLogs, activeTab, setActiveTab, onClose, onEdit, onNavigateChar, navigate }) {
  const getName = (id) => characters.find(c => c.id === id)?.name || '?'
  const getThumb = (id) => characters.find(c => c.id === id)?.thumbnailImageId || null

  const tabs = char.type === 'individual'
    ? [['profile', '프로필'], ['relation', '관계'], ['timeline', '타임라인'], ['log', '로그']]
    : char.type === 'pair'
    ? [['relation', '관계설명'], ['timeline', '타임라인'], ['log', '로그']]
    : [['members', '멤버'], ['relation', '관계설명']]

  const logs = char.type === 'pair'
    ? getPairLogs(char.characterA, char.characterB)
    : getCharLogs(char)

  return (
    <Modal isOpen={true} onClose={onClose} title={char.name || char.groupName || `${getName(char.characterA)} × ${getName(char.characterB)}`} size="lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 flex-wrap">
          {tabs.map(([t, l]) => (
            <button key={t} className="px-3 py-1 rounded text-sm font-medium transition-all"
              style={activeTab === t
                ? { background: 'var(--accent)', color: 'var(--bg)' }
                : { color: 'var(--txm)', border: '1px solid var(--border)' }
              }
              onClick={() => setActiveTab(t)}>{l}</button>
          ))}
        </div>
        {isAdmin && <button className="btn-ghost text-xs" onClick={onEdit}><Edit2 size={12} className="inline mr-1" />수정</button>}
      </div>

      {/* 개인 — 프로필 */}
      {activeTab === 'profile' && char.type === 'individual' && (
        <div className="space-y-4">
          {/* 상단: 썸네일 + 이름 + 기본 정보 */}
          <div className="flex gap-4">
            <CharThumb imageId={char.thumbnailImageId} name={char.name} size={72} />
            <div className="flex-1">
              <div className="text-lg font-bold mb-0.5" style={{ color: 'var(--tx)' }}>{char.name}</div>
              {char.bio && <p className="text-sm mb-2" style={{ color: 'var(--txm)' }}>{char.bio}</p>}
              {(char.profileFields || []).length > 0 && (
                <div className="grid grid-cols-2 gap-1.5">
                  {char.profileFields.map((pf) => (
                    <div key={pf.id} className="text-xs">
                      <span style={{ color: 'var(--txs)' }}>{pf.label} </span>
                      <span style={{ color: 'var(--tx)' }}>{pf.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* 전신/두상 이미지 */}
          {(char.fullBodyImageId || char.headImageId) && (
            <CharDetailImages fullBodyId={char.fullBodyImageId} headId={char.headImageId} />
          )}
          {/* 성격 */}
          {char.personality && (
            <div>
              <div className="text-xs font-medium mb-1" style={{ color: 'var(--txm)', borderLeft: '2px solid var(--accent)', paddingLeft: 6 }}>성격</div>
              <p className="text-sm" style={{ color: 'var(--tx)', whiteSpace: 'pre-wrap' }}>{char.personality}</p>
            </div>
          )}
          {/* 특징 */}
          {char.traits && (
            <div>
              <div className="text-xs font-medium mb-1" style={{ color: 'var(--txm)', borderLeft: '2px solid var(--accent2)', paddingLeft: 6 }}>특징</div>
              <p className="text-sm" style={{ color: 'var(--tx)', whiteSpace: 'pre-wrap' }}>{char.traits}</p>
            </div>
          )}
        </div>
      )}

      {/* 관계 탭 */}
      {activeTab === 'relation' && char.type === 'individual' && (
        <div className="space-y-3">
          {(!char.relations || char.relations.length === 0) ? (
            <div style={{ color: 'var(--txs)' }} className="text-sm">등록된 관계가 없습니다</div>
          ) : char.relations.map((r, i) => {
            const related = characters.find(c => c.id === r.characterId)
            return (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'var(--elevated)' }}>
                <CharThumb imageId={related?.thumbnailImageId} name={related?.name} size={36} />
                <div>
                  <button className="text-sm font-medium hover:underline" style={{ color: 'var(--accent)' }} onClick={() => onNavigateChar(r.characterId)}>{related?.name || '?'}</button>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--txm)' }}>{r.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 페어 관계설명 */}
      {activeTab === 'relation' && char.type === 'pair' && (
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <CharThumb imageId={getThumb(char.characterA)} name={getName(char.characterA)} size={48} />
              <span className="font-bold" style={{ color: 'var(--tx)' }}>{getName(char.characterA)}</span>
            </div>
            <span style={{ color: 'var(--txm)' }}>×</span>
            <div className="flex items-center gap-2">
              <CharThumb imageId={getThumb(char.characterB)} name={getName(char.characterB)} size={48} />
              <span className="font-bold" style={{ color: 'var(--tx)' }}>{getName(char.characterB)}</span>
            </div>
          </div>
          <p className="text-sm" style={{ color: 'var(--tx)' }}>{char.description}</p>
        </div>
      )}

      {/* 그룹 관계설명 */}
      {activeTab === 'relation' && char.type === 'group' && (
        <p className="text-sm" style={{ color: 'var(--tx)' }}>{char.description}</p>
      )}

      {/* 그룹 멤버 */}
      {activeTab === 'members' && (
        <div className="flex flex-wrap gap-3">
          {char.members?.map(mid => {
            const m = characters.find(c => c.id === mid)
            return m ? (
              <div key={mid} className="flex flex-col items-center gap-1">
                <CharThumb imageId={m.thumbnailImageId} name={m.name} size={48} />
                <span className="text-xs" style={{ color: 'var(--tx)' }}>{m.name}</span>
              </div>
            ) : null
          })}
        </div>
      )}

      {/* 타임라인 */}
      {activeTab === 'timeline' && (
        <div className="space-y-3">
          {(!char.timeline || char.timeline.length === 0) ? (
            <div style={{ color: 'var(--txs)' }} className="text-sm">등록된 타임라인이 없습니다</div>
          ) : char.timeline.map((t, i) => (
            <div key={t.id || i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--accent)' }} />
                {i < char.timeline.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: 'var(--border)' }} />}
              </div>
              <div className="pb-4">
                <div className="text-xs mb-0.5" style={{ color: 'var(--txm)' }}>{t.date}</div>
                <div className="text-sm font-medium" style={{ color: 'var(--tx)' }}>{t.event}</div>
                {t.description && <div className="text-xs mt-0.5" style={{ color: 'var(--txs)' }}>{t.description}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 로그 */}
      {activeTab === 'log' && (
        <div className="space-y-4">
          {logs.gallery.length > 0 && (
            <div>
              <div className="text-xs font-medium mb-2" style={{ color: 'var(--txm)' }}>그림</div>
              <div className="space-y-2">
                {logs.gallery.map(p => (
                  <div key={p.id} className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-elevated" onClick={() => { onClose(); navigate(`/gallery/${p.id}`) }}>
                    <ImageIcon size={14} style={{ color: 'var(--accent)' }} />
                    <span className="text-sm flex-1" style={{ color: 'var(--tx)' }}>{p.title}</span>
                    <span className="text-xs" style={{ color: 'var(--txs)' }}>{p.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {logs.writings.length > 0 && (
            <div>
              <div className="text-xs font-medium mb-2" style={{ color: 'var(--txm)' }}>글</div>
              <div className="space-y-2">
                {logs.writings.map(w => (
                  <div key={w.id} className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-elevated" onClick={() => { onClose(); navigate(`/writings/${w.id}`) }}>
                    <FileText size={14} style={{ color: 'var(--accent2)' }} />
                    <span className="text-sm flex-1" style={{ color: 'var(--tx)' }}>{w.title}</span>
                    <span className="text-xs" style={{ color: 'var(--txs)' }}>{w.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {logs.gallery.length === 0 && logs.writings.length === 0 && (
            <div className="text-sm" style={{ color: 'var(--txs)' }}>연결된 그림/글이 없습니다</div>
          )}
        </div>
      )}
    </Modal>
  )
}
