// 어바웃 페이지 — 공지사항 + 오타쿠 설명서 + 방명록
import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Pin, X, ExternalLink, ChevronDown, ChevronUp, Check } from 'lucide-react'
import useAboutStore from '../store/useAboutStore'
import useSettingsStore from '../store/useSettingsStore'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { getImage, saveImage, resizeImage } from '../lib/imageDB'

const genId = () => 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)

// SHA-256 해시 (Web Crypto API)
async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// 섹션 구분선 컴포넌트
function SectionTitle({ title }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-1.5 h-5 rounded-full" style={{ background: 'var(--accent)' }} />
      <h2 className="text-base font-bold" style={{ color: 'var(--tx)' }}>{title}</h2>
    </div>
  )
}

export default function About() {
  const { guestbookPasswordHash } = useSettingsStore()
  const { profile, notices, guestbook, updateProfile, addNotice, updateNotice, deleteNotice, toggleNoticePin, addGuestbookEntry, deleteGuestbookEntry } = useAboutStore()

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-14 animate-fade-in">
      <NoticeSection notices={notices} addNotice={addNotice} updateNotice={updateNotice} deleteNotice={deleteNotice} toggleNoticePin={toggleNoticePin} />
      <ProfileSection profile={profile} updateProfile={updateProfile} />
      <GuestbookSection guestbook={guestbook} addEntry={addGuestbookEntry} deleteEntry={deleteGuestbookEntry} passwordHash={guestbookPasswordHash} />
    </div>
  )
}

// ==================== 공지사항 ====================
function NoticeSection({ notices, addNotice, updateNotice, deleteNotice, toggleNoticePin }) {
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState({ title: '', content: '', pinned: false })
  const [expanded, setExpanded] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)

  const sorted = [...notices].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return b.createdAt.localeCompare(a.createdAt)
  })

  const openCreate = () => { setEditTarget(null); setForm({ title: '', content: '', pinned: false }); setFormOpen(true) }
  const openEdit = (n) => { setEditTarget(n); setForm({ title: n.title, content: n.content, pinned: n.pinned }); setFormOpen(true) }

  const save = () => {
    if (!form.title) return
    if (editTarget) updateNotice(editTarget.id, form)
    else addNotice({ ...form, id: genId(), createdAt: new Date().toISOString() })
    setFormOpen(false)
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-5 rounded-full" style={{ background: 'var(--accent)' }} />
          <h2 className="text-base font-bold" style={{ color: 'var(--tx)' }}>공지사항</h2>
        </div>
        <button className="btn-accent flex items-center gap-1.5" onClick={openCreate}><Plus size={13} /> 새 공지</button>
      </div>

      {notices.length === 0 && <div className="text-sm text-center py-8" style={{ color: 'var(--txs)' }}>공지사항이 없습니다</div>}

      <div className="space-y-2">
        {sorted.map(notice => (
          <div key={notice.id} className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer"
              onClick={() => setExpanded(e => ({ ...e, [notice.id]: !e[notice.id] }))}
            >
              {notice.pinned && <Pin size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
              <span className="flex-1 text-sm font-medium" style={{ color: 'var(--tx)' }}>{notice.title}</span>
              <span className="text-xs" style={{ color: 'var(--txs)' }}>{notice.createdAt?.slice(0, 10)}</span>
              <div className="flex gap-1 ml-2" onClick={e => e.stopPropagation()}>
                <button className="w-6 h-6 rounded flex items-center justify-center" style={{ color: notice.pinned ? 'var(--accent)' : 'var(--txs)' }} onClick={() => toggleNoticePin(notice.id)} title={notice.pinned ? '핀 해제' : '핀 고정'}><Pin size={12} /></button>
                <button className="w-6 h-6 rounded flex items-center justify-center" style={{ color: 'var(--txm)' }} onClick={() => openEdit(notice)}><Edit2 size={12} /></button>
                <button className="w-6 h-6 rounded flex items-center justify-center" style={{ color: '#f87171' }} onClick={() => setDeleteTarget(notice)}><Trash2 size={12} /></button>
              </div>
              {expanded[notice.id] ? <ChevronUp size={14} style={{ color: 'var(--txs)', flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: 'var(--txs)', flexShrink: 0 }} />}
            </div>
            {expanded[notice.id] && (
              <div className="px-4 pb-4 pt-0 text-sm" style={{ color: 'var(--txm)', borderTop: '1px solid var(--border)', paddingTop: '12px', whiteSpace: 'pre-wrap' }}>
                {notice.content}
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editTarget ? '공지 수정' : '새 공지'} size="md">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>제목</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>내용</label>
            <textarea className="textarea" rows={5} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.pinned} onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))} />
            <span className="text-sm" style={{ color: 'var(--txm)' }}>핀 고정</span>
          </label>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn-ghost" onClick={() => setFormOpen(false)}>취소</button>
          <button className="btn-accent" onClick={save}>저장</button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} message={`"${deleteTarget?.title}"를 삭제하시겠습니까?`} onConfirm={() => { deleteNotice(deleteTarget.id); setDeleteTarget(null) }} onCancel={() => setDeleteTarget(null)} />
    </section>
  )
}

// ==================== 오타쿠 설명서 ====================
function ProfileSection({ profile, updateProfile }) {
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState(profile)
  const [thumbPreview, setThumbPreview] = useState(null)
  const [profileSrc, setProfileSrc] = useState(null)
  const [likeInput, setLikeInput] = useState('')
  const [dislikeInput, setDislikeInput] = useState('')

  useEffect(() => { if (profile.profileImageId) getImage(profile.profileImageId).then(setProfileSrc) }, [profile.profileImageId])

  const startEdit = () => { setForm({ ...profile }); setThumbPreview(null); setEditMode(true) }
  const handleThumb = async (e) => {
    const file = e.target.files[0]; if (!file) return
    const b64 = await resizeImage(file)
    const id = genId(); await saveImage(id, b64)
    setForm(f => ({ ...f, profileImageId: id })); setThumbPreview(b64)
  }
  const save = () => { updateProfile(form); setEditMode(false) }

  const addLike = () => { if (!likeInput.trim()) return; setForm(f => ({ ...f, likes: [...(f.likes || []), likeInput.trim()] })); setLikeInput('') }
  const addDislike = () => { if (!dislikeInput.trim()) return; setForm(f => ({ ...f, dislikes: [...(f.dislikes || []), dislikeInput.trim()] })); setDislikeInput('') }

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-5 rounded-full" style={{ background: 'var(--accent2)' }} />
          <h2 className="text-base font-bold" style={{ color: 'var(--tx)' }}>오타쿠 설명서</h2>
        </div>
        {!editMode && <button className="btn-ghost flex items-center gap-1.5 text-sm" onClick={startEdit}><Edit2 size={13} /> 편집</button>}
        {editMode && (
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => setEditMode(false)}>취소</button>
            <button className="btn-accent" onClick={save}>저장</button>
          </div>
        )}
      </div>

      {!editMode ? (
        // 표시 모드
        <div className="p-5 rounded-xl space-y-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {/* 프로필 헤더 */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 flex items-center justify-center font-bold text-xl" style={{ background: 'var(--elevated)', color: 'var(--accent)', border: '2px solid var(--border)' }}>
              {profileSrc ? <img src={profileSrc} alt="" className="w-full h-full object-cover" /> : profile.nickname?.[0] || '?'}
            </div>
            <div>
              <div className="text-lg font-bold" style={{ color: 'var(--tx)' }}>{profile.nickname}</div>
              {profile.bio && <p className="text-sm mt-0.5" style={{ color: 'var(--txm)' }}>{profile.bio}</p>}
            </div>
          </div>
          {/* 취향 */}
          {profile.likes?.length > 0 && <ProfileRow label="좋아하는 것" items={profile.likes} color="var(--accent)" />}
          {profile.dislikes?.length > 0 && <ProfileRow label="지뢰" items={profile.dislikes} color="var(--accent2)" />}
          {/* 교류 */}
          {(profile.interaction?.notes || profile.interaction?.enabled !== undefined) && (
            <div>
              <span className="text-xs font-medium" style={{ color: 'var(--txm)' }}>교류 </span>
              <span className="text-xs" style={{ color: 'var(--tx)' }}>{profile.interaction?.enabled ? '가능' : '비공개'}</span>
              {profile.interaction?.notes && <p className="text-sm mt-1" style={{ color: 'var(--txm)' }}>{profile.interaction.notes}</p>}
            </div>
          )}
          {/* 창작 주의사항 */}
          {profile.creativeNotes && (
            <div>
              <div className="text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>창작 주의사항</div>
              <p className="text-sm" style={{ color: 'var(--tx)' }}>{profile.creativeNotes}</p>
            </div>
          )}
          {/* 커스텀 섹션 */}
          {profile.customSections?.map(s => (
            <div key={s.id}>
              <div className="text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>{s.title}</div>
              <p className="text-sm" style={{ color: 'var(--tx)' }}>{s.content}</p>
            </div>
          ))}
          {/* 링크 */}
          {profile.links?.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              {profile.links.map(link => (
                <a key={link.id} href={link.url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
                  style={{ background: 'var(--elevated)', color: 'var(--tx)', textDecoration: 'none', border: '1px solid var(--border)' }}>
                  {link.label} <ExternalLink size={12} style={{ color: 'var(--txs)' }} />
                </a>
              ))}
            </div>
          )}
        </div>
      ) : (
        // 편집 모드
        <div className="p-5 rounded-xl space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 flex items-center justify-center font-bold text-xl" style={{ background: 'var(--elevated)', color: 'var(--accent)', border: '2px solid var(--border)' }}>
              {thumbPreview ? <img src={thumbPreview} alt="" className="w-full h-full object-cover" />
                : profileSrc ? <img src={profileSrc} alt="" className="w-full h-full object-cover" />
                : form.nickname?.[0] || '?'}
            </div>
            <label className="btn-ghost cursor-pointer text-xs">
              이미지 변경
              <input type="file" accept="image/*" className="hidden" onChange={handleThumb} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>닉네임</label>
              <input className="input" value={form.nickname || ''} onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>한줄소개</label>
            <textarea className="textarea" rows={2} value={form.bio || ''} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
          </div>
          {/* 좋아하는 것 */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--txm)' }}>좋아하는 것</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.likes?.map((l, i) => (
                <span key={i} className="tag flex items-center gap-1">
                  {l} <button onClick={() => setForm(f => ({ ...f, likes: f.likes.filter((_, j) => j !== i) }))}><X size={10} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="input flex-1 text-sm" placeholder="추가" value={likeInput} onChange={e => setLikeInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addLike()} />
              <button className="btn-ghost text-xs" onClick={addLike}>추가</button>
            </div>
          </div>
          {/* 지뢰 */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--txm)' }}>지뢰</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.dislikes?.map((d, i) => (
                <span key={i} className="tag flex items-center gap-1" style={{ color: 'var(--accent2)', background: 'color-mix(in srgb, var(--accent2) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--accent2) 25%, transparent)' }}>
                  {d} <button onClick={() => setForm(f => ({ ...f, dislikes: f.dislikes.filter((_, j) => j !== i) }))}><X size={10} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="input flex-1 text-sm" placeholder="추가" value={dislikeInput} onChange={e => setDislikeInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addDislike()} />
              <button className="btn-ghost text-xs" onClick={addDislike}>추가</button>
            </div>
          </div>
          {/* 교류 */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--txm)' }}>교류</label>
            <label className="flex items-center gap-2 mb-2 cursor-pointer">
              <input type="checkbox" checked={form.interaction?.enabled !== false} onChange={e => setForm(f => ({ ...f, interaction: { ...f.interaction, enabled: e.target.checked } }))} />
              <span className="text-sm" style={{ color: 'var(--tx)' }}>교류 가능</span>
            </label>
            <textarea className="textarea" rows={2} placeholder="교류 관련 주의사항" value={form.interaction?.notes || ''} onChange={e => setForm(f => ({ ...f, interaction: { ...f.interaction, notes: e.target.value } }))} />
          </div>
          {/* 창작 주의사항 */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>창작 주의사항</label>
            <textarea className="textarea" rows={2} value={form.creativeNotes || ''} onChange={e => setForm(f => ({ ...f, creativeNotes: e.target.value }))} />
          </div>
          {/* 커스텀 섹션 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium" style={{ color: 'var(--txm)' }}>추가 항목</label>
              <button className="text-xs" style={{ color: 'var(--accent)' }} onClick={() => setForm(f => ({ ...f, customSections: [...(f.customSections || []), { id: genId(), title: '', content: '' }] }))}>+ 추가</button>
            </div>
            {form.customSections?.map((s, i) => (
              <div key={s.id} className="flex gap-2 mb-2">
                <input className="input" style={{ width: '30%' }} placeholder="항목명" value={s.title} onChange={e => setForm(f => { const cs = [...f.customSections]; cs[i] = { ...cs[i], title: e.target.value }; return { ...f, customSections: cs } })} />
                <input className="input flex-1" placeholder="내용" value={s.content} onChange={e => setForm(f => { const cs = [...f.customSections]; cs[i] = { ...cs[i], content: e.target.value }; return { ...f, customSections: cs } })} />
                <button onClick={() => setForm(f => ({ ...f, customSections: f.customSections.filter((_, j) => j !== i) }))} style={{ color: 'var(--txs)' }}><X size={14} /></button>
              </div>
            ))}
          </div>
          {/* 링크 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium" style={{ color: 'var(--txm)' }}>SNS / 링크</label>
              <button className="text-xs" style={{ color: 'var(--accent)' }} onClick={() => setForm(f => ({ ...f, links: [...(f.links || []), { id: genId(), label: '', url: '' }] }))}>+ 추가</button>
            </div>
            {form.links?.map((l, i) => (
              <div key={l.id} className="flex gap-2 mb-2">
                <input className="input" style={{ width: '25%' }} placeholder="라벨" value={l.label} onChange={e => setForm(f => { const links = [...f.links]; links[i] = { ...links[i], label: e.target.value }; return { ...f, links } })} />
                <input className="input flex-1" placeholder="URL" value={l.url} onChange={e => setForm(f => { const links = [...f.links]; links[i] = { ...links[i], url: e.target.value }; return { ...f, links } })} />
                <button onClick={() => setForm(f => ({ ...f, links: f.links.filter((_, j) => j !== i) }))} style={{ color: 'var(--txs)' }}><X size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

// 프로필 태그 행 컴포넌트
function ProfileRow({ label, items, color }) {
  return (
    <div>
      <div className="text-xs font-medium mb-2" style={{ color: 'var(--txm)' }}>{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span key={i} className="px-2 py-0.5 rounded text-xs" style={{ color, background: `color-mix(in srgb, ${color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 25%, transparent)` }}>{item}</span>
        ))}
      </div>
    </div>
  )
}

// ==================== 방명록 ====================
function GuestbookSection({ guestbook, addEntry, deleteEntry, passwordHash }) {
  const [nickname, setNickname] = useState('')
  const [message, setMessage] = useState('')
  const [pwModal, setPwModal] = useState(false)
  const [pwInput, setPwInput] = useState('')
  const [pwError, setPwError] = useState(false)
  const [targetId, setTargetId] = useState(null)

  const submit = () => {
    if (!nickname.trim() || !message.trim()) return
    addEntry({ id: genId(), nickname: nickname.trim(), message: message.trim(), createdAt: new Date().toISOString() })
    setNickname(''); setMessage('')
  }

  const openDelete = (id) => { setTargetId(id); setPwInput(''); setPwError(false); setPwModal(true) }

  const confirmDelete = async () => {
    if (!passwordHash) { deleteEntry(targetId); setPwModal(false); return }
    const hash = await sha256(pwInput)
    if (hash === passwordHash) {
      deleteEntry(targetId); setPwModal(false)
    } else {
      setPwError(true)
    }
  }

  const sorted = [...guestbook].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1.5 h-5 rounded-full" style={{ background: 'var(--accent2)' }} />
        <h2 className="text-base font-bold" style={{ color: 'var(--tx)' }}>방명록</h2>
      </div>

      {/* 작성 폼 */}
      <div className="p-4 rounded-xl mb-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex gap-2 mb-2">
          <input className="input" style={{ width: '160px' }} placeholder="닉네임" value={nickname} onChange={e => setNickname(e.target.value)} maxLength={20} />
        </div>
        <textarea className="textarea mb-3" rows={3} placeholder="메시지를 남겨주세요" value={message} onChange={e => setMessage(e.target.value)} maxLength={300} />
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: 'var(--txs)' }}>{message.length}/300</span>
          <button className="btn-accent text-sm" onClick={submit}>남기기</button>
        </div>
      </div>

      {/* 방명록 목록 */}
      {guestbook.length === 0 && <div className="text-sm text-center py-8" style={{ color: 'var(--txs)' }}>아직 방명록이 없습니다</div>}
      <div className="space-y-3">
        {sorted.map(entry => (
          <div key={entry.id} className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{entry.nickname}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--txs)' }}>{entry.createdAt?.slice(0, 10)}</span>
                <button className="w-6 h-6 rounded flex items-center justify-center" style={{ color: '#f87171' }} onClick={() => openDelete(entry.id)}><Trash2 size={11} /></button>
              </div>
            </div>
            <p className="text-sm" style={{ color: 'var(--tx)', whiteSpace: 'pre-wrap' }}>{entry.message}</p>
          </div>
        ))}
      </div>

      {/* 비밀번호 확인 모달 */}
      <Modal isOpen={pwModal} onClose={() => setPwModal(false)} title="삭제 확인" size="sm">
        <p className="text-sm mb-4" style={{ color: 'var(--txm)' }}>
          {passwordHash ? '방명록을 삭제하려면 비밀번호를 입력해주세요.' : '이 방명록을 삭제하시겠습니까?'}
        </p>
        {passwordHash && (
          <div>
            <input
              className="input mb-2"
              type="password"
              placeholder="비밀번호"
              value={pwInput}
              onChange={e => { setPwInput(e.target.value); setPwError(false) }}
              onKeyDown={e => e.key === 'Enter' && confirmDelete()}
              autoFocus
            />
            {pwError && <p className="text-xs mt-1" style={{ color: '#f87171' }}>비밀번호가 올바르지 않습니다.</p>}
          </div>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn-ghost" onClick={() => setPwModal(false)}>취소</button>
          <button className="btn-danger" onClick={confirmDelete}>삭제</button>
        </div>
      </Modal>
    </section>
  )
}
