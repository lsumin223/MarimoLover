// 어바웃 페이지
import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Pin, X, ExternalLink, ChevronDown, ChevronUp, Check } from 'lucide-react'
import useAboutStore from '../store/useAboutStore'
import useSettingsStore from '../store/useSettingsStore'
import useCharacterStore from '../store/useCharacterStore'
import useWorkStore from '../store/useWorkStore'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { getImage, saveImage, resizeImage } from '../lib/imageDB'
import AboutHeader from './about/AboutHeader'
import AboutOtaku from './about/AboutOtaku'
import AboutTrpg from './about/AboutTrpg'

const genId = () => 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function About() {
  const { guestbookPasswordHash, nickname } = useSettingsStore()
  const { otakuProfile, profile, notices, guestbook, updateOtakuProfile, updateProfile, addNotice, updateNotice, deleteNotice, toggleNoticePin, addGuestbookEntry, deleteGuestbookEntry } = useAboutStore()

  return (
    <div className="animate-fade-in">
      <AboutHeader otaku={otakuProfile} updateOtaku={updateOtakuProfile} nickname={nickname} />

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">
        <AboutOtaku otaku={otakuProfile} updateOtaku={updateOtakuProfile} profile={profile} />
        <AboutTrpg otaku={otakuProfile} updateOtaku={updateOtakuProfile} />
        <CharacterGridSection />
        <NoticeSection notices={notices} addNotice={addNotice} updateNotice={updateNotice} deleteNotice={deleteNotice} toggleNoticePin={toggleNoticePin} />
        <GuestbookSection guestbook={guestbook} addEntry={addGuestbookEntry} deleteEntry={deleteGuestbookEntry} passwordHash={guestbookPasswordHash} />
      </div>
    </div>
  )
}

// ===== 커뮤 및 캐릭터 정리 =====
function CharacterGridSection() {
  const { characters } = useCharacterStore()
  const { works } = useWorkStore()
  const [imgMap, setImgMap] = useState({})

  const individuals = characters.filter(c => c.type === 'individual')

  useEffect(() => {
    individuals.forEach(c => {
      if (c.thumbnailImageId) {
        getImage(c.thumbnailImageId).then(src => {
          if (src) setImgMap(m => ({ ...m, [c.id]: src }))
        })
      }
    })
  }, [characters])

  if (individuals.length === 0) return null

  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1.5 h-5 rounded-full" style={{ background: 'var(--accent2)' }} />
        <h2 className="text-base font-bold" style={{ color: 'var(--tx)' }}>커뮤 및 캐릭터 정리</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 12 }}>
        {individuals.map(c => {
          const workTitle = works.find(w => w.id === c.workId)?.title || ''
          return (
            <div key={c.id} className="flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center text-lg font-bold"
                style={{ background: imgMap[c.id] ? 'transparent' : 'var(--elevated)', color: 'var(--accent)', border: '1px solid var(--border)' }}>
                {imgMap[c.id]
                  ? <img src={imgMap[c.id]} alt="" className="w-full h-full object-cover" />
                  : c.name?.[0] || '?'}
              </div>
              <div className="text-center">
                <p className="text-xs font-medium leading-tight" style={{ color: 'var(--tx)' }}>{c.name}</p>
                {workTitle && <p style={{ fontSize: 10, color: 'var(--txs)', lineHeight: 1.3 }}>{workTitle}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ===== 공지사항 =====
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
            <div className="flex items-center gap-3 px-4 py-3 cursor-pointer"
              onClick={() => setExpanded(e => ({ ...e, [notice.id]: !e[notice.id] }))}>
              {notice.pinned && <Pin size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
              <span className="flex-1 text-sm font-medium" style={{ color: 'var(--tx)' }}>{notice.title}</span>
              <span className="text-xs" style={{ color: 'var(--txs)' }}>{notice.createdAt?.slice(0, 10)}</span>
              <div className="flex gap-1 ml-2" onClick={e => e.stopPropagation()}>
                <button className="w-6 h-6 rounded flex items-center justify-center"
                  style={{ color: notice.pinned ? 'var(--accent)' : 'var(--txs)' }}
                  onClick={() => toggleNoticePin(notice.id)}><Pin size={12} /></button>
                <button className="w-6 h-6 rounded flex items-center justify-center"
                  style={{ color: 'var(--txm)' }} onClick={() => openEdit(notice)}><Edit2 size={12} /></button>
                <button className="w-6 h-6 rounded flex items-center justify-center"
                  style={{ color: '#f87171' }} onClick={() => setDeleteTarget(notice)}><Trash2 size={12} /></button>
              </div>
              {expanded[notice.id] ? <ChevronUp size={14} style={{ color: 'var(--txs)', flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: 'var(--txs)', flexShrink: 0 }} />}
            </div>
            {expanded[notice.id] && (
              <div className="px-4 pb-4 pt-3 text-sm" style={{ color: 'var(--txm)', borderTop: '1px solid var(--border)', whiteSpace: 'pre-wrap' }}>
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

      <ConfirmDialog isOpen={!!deleteTarget} message={`"${deleteTarget?.title}"를 삭제하시겠습니까?`}
        onConfirm={() => { deleteNotice(deleteTarget.id); setDeleteTarget(null) }}
        onCancel={() => setDeleteTarget(null)} />
    </section>
  )
}

// ===== 방명록 =====
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
    if (hash === passwordHash) { deleteEntry(targetId); setPwModal(false) }
    else setPwError(true)
  }

  const sorted = [...guestbook].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1.5 h-5 rounded-full" style={{ background: 'var(--accent2)' }} />
        <h2 className="text-base font-bold" style={{ color: 'var(--tx)' }}>방명록</h2>
      </div>

      <div className="p-4 rounded-xl mb-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex gap-2 mb-2">
          <input className="input" style={{ width: 160 }} placeholder="닉네임" value={nickname} onChange={e => setNickname(e.target.value)} maxLength={20} />
        </div>
        <textarea className="textarea mb-3" rows={3} placeholder="메시지를 남겨주세요" value={message} onChange={e => setMessage(e.target.value)} maxLength={300} />
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: 'var(--txs)' }}>{message.length}/300</span>
          <button className="btn-accent text-sm" onClick={submit}>남기기</button>
        </div>
      </div>

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

      <Modal isOpen={pwModal} onClose={() => setPwModal(false)} title="삭제 확인" size="sm">
        <p className="text-sm mb-4" style={{ color: 'var(--txm)' }}>
          {passwordHash ? '방명록을 삭제하려면 비밀번호를 입력해주세요.' : '이 방명록을 삭제하시겠습니까?'}
        </p>
        {passwordHash && (
          <div>
            <input className="input mb-2" type="password" placeholder="비밀번호" value={pwInput}
              onChange={e => { setPwInput(e.target.value); setPwError(false) }}
              onKeyDown={e => e.key === 'Enter' && confirmDelete()} autoFocus />
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
