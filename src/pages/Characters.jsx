// 캐릭터 페이지 — 캐릭터 카드 목록 + 생성/수정/삭제 + 상세 모달
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit2, Trash2, X, ChevronRight, Image as ImageIcon, FileText } from 'lucide-react'
import useSettingsStore from '../store/useSettingsStore'
import useWorkStore from '../store/useWorkStore'
import useCharacterStore from '../store/useCharacterStore'
import useGalleryStore from '../store/useGalleryStore'
import useWritingStore from '../store/useWritingStore'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { getImage, saveImage, resizeImage } from '../lib/imageDB'

const genId = () => 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
const getWorkTitle = (workId, works) => works.find(w => w.id === workId)?.title || '미분류'

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

// 개인 캐릭터 폼 초기값
const emptyIndividual = { type: 'individual', workId: '', name: '', bio: '', thumbnailId: null, profile: { age: '', gender: '', personality: '', custom: [] }, relations: [], timeline: [] }
const emptyPair = { type: 'pair', workId: '', characterA: '', characterB: '', description: '', timeline: [] }
const emptyGroup = { type: 'group', workId: '', groupName: '', members: [], description: '' }

export default function Characters() {
  const navigate = useNavigate()
  const { selectedWorkId } = useSettingsStore()
  const { works } = useWorkStore()
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

  // 필터링
  const filtered = characters.filter(c => {
    if (selectedWorkId && c.workId !== selectedWorkId) return false
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
    setForm(f => ({ ...f, thumbnailId: id }))
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

  // 같은 작품 내 개인 캐릭터 목록
  const sameWorkChars = (workId) => characters.filter(c => c.workId === workId && c.type === 'individual')

  // 해당 캐릭터의 로그 (갤러리+글)
  const getCharLogs = (charId) => ({
    gallery: posts.filter(p => p.characterTags?.includes(charId)),
    writings: writings.filter(w => w.characterTags?.includes(charId)),
  })

  // 페어 로그 (두 캐릭터 모두 포함)
  const getPairLogs = (charA, charB) => ({
    gallery: posts.filter(p => p.characterTags?.includes(charA) && p.characterTags?.includes(charB)),
    writings: writings.filter(w => w.characterTags?.includes(charA) && w.characterTags?.includes(charB)),
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-fade-in">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold" style={{ color: 'var(--tx)' }}>캐릭터</h1>
        <button className="btn-accent flex items-center gap-1.5" onClick={openCreate}>
          <Plus size={14} /> 새 캐릭터
        </button>
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
              works={works}
              characters={characters}
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
          {/* 작품 선택 (공통) */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>작품</label>
            <select className="input" value={form.workId || ''} onChange={e => setForm(f => ({ ...f, workId: e.target.value }))}>
              <option value="">미분류</option>
              {works.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
            </select>
          </div>

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
              {/* 썸네일 */}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>썸네일 이미지</label>
                <div className="flex items-center gap-3">
                  {(thumbPreview || form.thumbnailId) && (
                    <CharThumb imageId={thumbPreview ? null : form.thumbnailId} name={form.name} size={48} />
                  )}
                  {thumbPreview && <img src={thumbPreview} alt="" className="w-12 h-12 rounded-full object-cover" style={{ border: '2px solid var(--border)' }} />}
                  <label className="btn-ghost cursor-pointer text-xs">
                    이미지 선택
                    <input type="file" accept="image/*" className="hidden" onChange={handleThumb} />
                  </label>
                </div>
              </div>
              {/* 프로필 */}
              <div className="grid grid-cols-3 gap-3">
                {[['age', '나이'], ['gender', '성별'], ['personality', '성격']].map(([k, l]) => (
                  <div key={k}>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>{l}</label>
                    <input className="input" value={form.profile?.[k] || ''} onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, [k]: e.target.value } }))} />
                  </div>
                ))}
              </div>
              {/* 커스텀 필드 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium" style={{ color: 'var(--txm)' }}>추가 항목</span>
                  <button className="text-xs" style={{ color: 'var(--accent)' }}
                    onClick={() => setForm(f => ({ ...f, profile: { ...f.profile, custom: [...(f.profile?.custom || []), { label: '', value: '' }] } }))}>+ 추가</button>
                </div>
                {(form.profile?.custom || []).map((c, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input className="input" style={{ width: '35%' }} placeholder="항목명" value={c.label} onChange={e => setForm(f => { const custom = [...f.profile.custom]; custom[i] = { ...custom[i], label: e.target.value }; return { ...f, profile: { ...f.profile, custom } } })} />
                    <input className="input flex-1" placeholder="내용" value={c.value} onChange={e => setForm(f => { const custom = [...f.profile.custom]; custom[i] = { ...custom[i], value: e.target.value }; return { ...f, profile: { ...f.profile, custom } } })} />
                    <button onClick={() => setForm(f => { const custom = f.profile.custom.filter((_, j) => j !== i); return { ...f, profile: { ...f.profile, custom } } })} style={{ color: 'var(--txs)' }}><X size={14} /></button>
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
                      {sameWorkChars(form.workId).filter(c => c.id !== editTarget?.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                    {sameWorkChars(form.workId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                  {sameWorkChars(form.workId).map(c => (
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
          works={works}
          characters={characters}
          posts={posts}
          writings={writings}
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

// 캐릭터 카드 컴포넌트
function CharCard({ char, works, characters, onEdit, onDelete, onClick }) {
  const [hovered, setHovered] = useState(false)
  const getName = (id) => characters.find(c => c.id === id)?.name || '?'
  const getThumb = (id) => characters.find(c => c.id === id)?.thumbnailId || null

  const typeBadge = { individual: '개인', pair: '페어', group: '그룹' }[char.type]
  const typeColor = { individual: 'var(--accent)', pair: 'var(--accent2)', group: 'var(--txm)' }[char.type]

  return (
    <div
      className="card p-4 cursor-pointer relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {/* 호버 시 편집/삭제 버튼 */}
      {hovered && (
        <div className="absolute top-2 right-2 flex gap-1" onClick={e => e.stopPropagation()}>
          <button className="w-7 h-7 rounded flex items-center justify-center transition-colors" style={{ background: 'var(--elevated)', color: 'var(--txm)' }} onClick={onEdit}><Edit2 size={13} /></button>
          <button className="w-7 h-7 rounded flex items-center justify-center transition-colors" style={{ background: 'var(--elevated)', color: '#f87171' }} onClick={onDelete}><Trash2 size={13} /></button>
        </div>
      )}

      {char.type === 'individual' && (
        <div className="flex flex-col items-center text-center gap-2">
          <CharThumb imageId={char.thumbnailId} name={char.name} size={56} />
          <div>
            <div className="font-bold text-sm" style={{ color: 'var(--tx)' }}>{char.name}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--txm)' }}>{getWorkTitle(char.workId, works)}</div>
            {char.bio && <div className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--txs)' }}>{char.bio}</div>}
          </div>
          <span className="tag text-xs" style={{ color: typeColor, background: `color-mix(in srgb, ${typeColor} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${typeColor} 25%, transparent)` }}>{typeBadge}</span>
        </div>
      )}

      {char.type === 'pair' && (
        <div className="flex flex-col items-center text-center gap-2">
          <div className="flex -space-x-3">
            <CharThumb imageId={getThumb(char.characterA)} name={getName(char.characterA)} size={44} />
            <CharThumb imageId={getThumb(char.characterB)} name={getName(char.characterB)} size={44} />
          </div>
          <div>
            <div className="font-bold text-sm" style={{ color: 'var(--tx)' }}>{getName(char.characterA)} × {getName(char.characterB)}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--txm)' }}>{getWorkTitle(char.workId, works)}</div>
            {char.description && <div className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--txs)' }}>{char.description}</div>}
          </div>
          <span className="tag" style={{ color: typeColor, background: `color-mix(in srgb, ${typeColor} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${typeColor} 25%, transparent)` }}>{typeBadge}</span>
        </div>
      )}

      {char.type === 'group' && (
        <div className="flex flex-col items-center text-center gap-2">
          <div className="flex -space-x-2">
            {char.members?.slice(0, 3).map(mid => <CharThumb key={mid} imageId={getThumb(mid)} name={getName(mid)} size={36} />)}
            {(char.members?.length || 0) > 3 && <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--elevated)', color: 'var(--txm)', border: '2px solid var(--border)' }}>+{char.members.length - 3}</div>}
          </div>
          <div>
            <div className="font-bold text-sm" style={{ color: 'var(--tx)' }}>{char.groupName}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--txm)' }}>{getWorkTitle(char.workId, works)} · {char.members?.length || 0}명</div>
          </div>
          <span className="tag" style={{ color: typeColor, background: `color-mix(in srgb, ${typeColor} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${typeColor} 25%, transparent)` }}>{typeBadge}</span>
        </div>
      )}
    </div>
  )
}

// 캐릭터 상세 모달
function CharDetailModal({ char, works, characters, posts, writings, getCharLogs, getPairLogs, activeTab, setActiveTab, onClose, onEdit, onNavigateChar, navigate }) {
  const getName = (id) => characters.find(c => c.id === id)?.name || '?'
  const getThumb = (id) => characters.find(c => c.id === id)?.thumbnailId || null

  const tabs = char.type === 'individual'
    ? [['profile', '프로필'], ['relation', '관계'], ['timeline', '타임라인'], ['log', '로그']]
    : char.type === 'pair'
    ? [['relation', '관계설명'], ['timeline', '타임라인'], ['log', '로그']]
    : [['members', '멤버'], ['relation', '관계설명']]

  const logs = char.type === 'pair'
    ? getPairLogs(char.characterA, char.characterB)
    : getCharLogs(char.id)

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
        <button className="btn-ghost text-xs" onClick={onEdit}><Edit2 size={12} className="inline mr-1" />수정</button>
      </div>

      {/* 개인 — 프로필 */}
      {activeTab === 'profile' && char.type === 'individual' && (
        <div className="flex gap-5">
          <CharThumb imageId={char.thumbnailId} name={char.name} size={80} />
          <div className="flex-1">
            <div className="text-lg font-bold mb-1" style={{ color: 'var(--tx)' }}>{char.name}</div>
            <div className="text-xs mb-2" style={{ color: 'var(--txm)' }}>{getWorkTitle(char.workId, works)}</div>
            {char.bio && <p className="text-sm mb-3" style={{ color: 'var(--tx)' }}>{char.bio}</p>}
            <div className="grid grid-cols-2 gap-2">
              {char.profile?.age && <div className="text-xs"><span style={{ color: 'var(--txm)' }}>나이 </span><span style={{ color: 'var(--tx)' }}>{char.profile.age}</span></div>}
              {char.profile?.gender && <div className="text-xs"><span style={{ color: 'var(--txm)' }}>성별 </span><span style={{ color: 'var(--tx)' }}>{char.profile.gender}</span></div>}
              {char.profile?.personality && <div className="text-xs col-span-2"><span style={{ color: 'var(--txm)' }}>성격 </span><span style={{ color: 'var(--tx)' }}>{char.profile.personality}</span></div>}
              {char.profile?.custom?.map((c, i) => (
                <div key={i} className="text-xs"><span style={{ color: 'var(--txm)' }}>{c.label} </span><span style={{ color: 'var(--tx)' }}>{c.value}</span></div>
              ))}
            </div>
          </div>
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
                <CharThumb imageId={related?.thumbnailId} name={related?.name} size={36} />
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
                <CharThumb imageId={m.thumbnailId} name={m.name} size={48} />
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
