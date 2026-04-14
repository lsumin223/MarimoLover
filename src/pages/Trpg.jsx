// TRPG 페이지 — 캠페인/세션 목록 관리
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit2, Trash2, ChevronRight, Gamepad2, Image as ImageIcon, Lock } from 'lucide-react'
import useTrpgStore from '../store/useTrpgStore'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { getImage, saveImage, resizeImage } from '../lib/imageDB'

const genId = () => 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)

// 캠페인 커버 이미지
function CoverThumb({ imageId, title }) {
  const [src, setSrc] = useState(null)
  useEffect(() => { if (imageId) getImage(imageId).then(setSrc) }, [imageId])
  if (src) return <img src={src} alt={title} className="w-full h-full object-cover" />
  return <div className="w-full h-full flex items-center justify-center"><Gamepad2 size={14} style={{ color: 'var(--txm)' }} /></div>
}

export default function Trpg() {
  const navigate = useNavigate()
  const { campaigns, sessions, addCampaign, updateCampaign, deleteCampaign, addSession, updateSession, deleteSession } = useTrpgStore()

  const [selectedCampaignId, setSelectedCampaignId] = useState(campaigns[0]?.id || null)

  // 캠페인 폼
  const [campaignFormOpen, setCampaignFormOpen] = useState(false)
  const [campaignEdit, setCampaignEdit] = useState(null)
  const [campaignForm, setCampaignForm] = useState({ title: '', system: '', description: '', coverImageId: null })
  const [coverPreview, setCoverPreview] = useState(null)

  // 커버 이미지 업로드
  const handleCoverUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return
    const b64 = await resizeImage(file, 800)
    const id = genId()
    await saveImage(id, b64)
    setCampaignForm(f => ({ ...f, coverImageId: id }))
    setCoverPreview(b64)
  }

  // 세션 폼
  const [sessionFormOpen, setSessionFormOpen] = useState(false)
  const [sessionEdit, setSessionEdit] = useState(null)
  const [sessionForm, setSessionForm] = useState({ title: '', date: new Date().toISOString().slice(0, 10), summary: '' })

  // 삭제 확인
  const [deleteCampaignTarget, setDeleteCampaignTarget] = useState(null)
  const [deleteSessionTarget, setDeleteSessionTarget] = useState(null)

  const currentCampaign = campaigns.find(c => c.id === selectedCampaignId)
  const currentSessions = sessions.filter(s => s.campaignId === selectedCampaignId).sort((a, b) => a.date.localeCompare(b.date))

  // 캠페인 저장
  const saveCampaign = () => {
    if (!campaignForm.title) return
    if (campaignEdit) {
      updateCampaign(campaignEdit.id, campaignForm)
    } else {
      const id = genId()
      addCampaign({ ...campaignForm, id, createdAt: new Date().toISOString() })
      setSelectedCampaignId(id)
    }
    setCampaignFormOpen(false)
  }

  // 세션 저장
  const saveSession = () => {
    if (!sessionForm.title || !selectedCampaignId) return
    if (sessionEdit) {
      updateSession(sessionEdit.id, sessionForm)
    } else {
      addSession({ ...sessionForm, id: genId(), campaignId: selectedCampaignId, log: [], createdAt: new Date().toISOString() })
    }
    setSessionFormOpen(false)
  }

  const openCampaignCreate = () => {
    setCampaignEdit(null)
    setCampaignForm({ title: '', system: '', description: '', coverImageId: null })
    setCoverPreview(null)
    setCampaignFormOpen(true)
  }

  return (
    <div className="animate-fade-in" style={{ minHeight: 'calc(100vh - 56px)' }}>
      {/* 모바일: 캠페인 드롭다운 */}
      <div className="lg:hidden flex items-center gap-2 px-4 py-2 border-b border-border" style={{ background: 'var(--surface)' }}>
        <select
          className="input flex-1 text-sm"
          value={selectedCampaignId || ''}
          onChange={e => setSelectedCampaignId(e.target.value || null)}
        >
          <option value="">캠페인 선택</option>
          {campaigns.map(c => (
            <option key={c.id} value={c.id}>{c.title}{c.system ? ` (${c.system})` : ''}</option>
          ))}
        </select>
        <button className="btn-accent flex items-center gap-1 text-xs shrink-0" onClick={openCampaignCreate}>
          <Plus size={12} /> 새 캠페인
        </button>
      </div>

      <div className="flex" style={{ minHeight: 'calc(100vh - 100px)' }}>
        {/* 데스크톱 캠페인 사이드바 */}
        <div className="hidden lg:block w-64 shrink-0 border-r border-border overflow-y-auto p-4" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: 'var(--txm)' }}>캠페인</span>
            <button
              className="w-6 h-6 rounded flex items-center justify-center transition-colors"
              style={{ color: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}
              onClick={openCampaignCreate}
            ><Plus size={14} /></button>
          </div>
          <div className="space-y-1">
            {campaigns.length === 0 && <div className="text-xs py-4 text-center" style={{ color: 'var(--txs)' }}>캠페인이 없습니다</div>}
            {campaigns.map(c => (
              <div
                key={c.id}
                className="group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
                style={{
                  background: selectedCampaignId === c.id ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent',
                  border: selectedCampaignId === c.id ? '1px solid color-mix(in srgb, var(--accent) 25%, transparent)' : '1px solid transparent',
                }}
                onClick={() => setSelectedCampaignId(c.id)}
              >
                <div className="w-7 h-7 rounded overflow-hidden shrink-0" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                  <CoverThumb imageId={c.coverImageId} title={c.title} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: selectedCampaignId === c.id ? 'var(--accent)' : 'var(--tx)' }}>{c.title}</div>
                  {c.system && <div className="text-xs truncate" style={{ color: 'var(--txs)' }}>{c.system}</div>}
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  <button className="w-5 h-5 rounded flex items-center justify-center" style={{ color: 'var(--txm)' }} onClick={() => { setCampaignEdit(c); setCampaignForm({ title: c.title, system: c.system || '', description: c.description || '', coverImageId: c.coverImageId || null }); setCoverPreview(null); setCampaignFormOpen(true) }}><Edit2 size={11} /></button>
                  <button className="w-5 h-5 rounded flex items-center justify-center" style={{ color: '#f87171' }} onClick={() => setDeleteCampaignTarget(c)}><Trash2 size={11} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 세션 목록 */}
        <div className="flex-1 max-w-4xl mx-auto px-4 lg:px-6 py-4 lg:py-6 overflow-y-auto">
          {!currentCampaign ? (
            <div className="flex items-center justify-center h-full" style={{ color: 'var(--txs)' }}>
              캠페인을 선택하거나 새로 만들어주세요
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-5">
                <div className="flex gap-4">
                  {currentCampaign.coverImageId && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0" style={{ border: '1px solid var(--border)' }}>
                      <CoverThumb imageId={currentCampaign.coverImageId} title={currentCampaign.title} />
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: 'var(--tx)' }}>{currentCampaign.title}</h2>
                    {currentCampaign.system && <div className="text-xs mt-0.5" style={{ color: 'var(--txm)' }}>{currentCampaign.system}</div>}
                    {currentCampaign.description && <p className="text-sm mt-2" style={{ color: 'var(--txm)' }}>{currentCampaign.description}</p>}
                  </div>
                </div>
                <button
                  className="btn-accent flex items-center gap-1.5 shrink-0 ml-4"
                  onClick={() => { setSessionEdit(null); setSessionForm({ title: '', date: new Date().toISOString().slice(0, 10), summary: '' }); setSessionFormOpen(true) }}
                >
                  <Plus size={14} /> 새 세션
                </button>
              </div>

              {currentSessions.length === 0 ? (
                <div className="text-center py-16" style={{ color: 'var(--txs)' }}>
                  세션이 없습니다. 새 세션을 추가해보세요.
                </div>
              ) : (
                <div className="space-y-2">
                  {currentSessions.map((session, idx) => (
                    <div
                      key={session.id}
                      className="group flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-colors"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      onClick={() => navigate(`/trpg/${session.id}`)}
                    >
                      {/* 세션 번호 */}
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                        style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm" style={{ color: 'var(--tx)' }}>{session.title}</div>
                        {session.summary && <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--txm)' }}>{session.summary}</div>}
                      </div>
                      <div className="text-xs shrink-0" style={{ color: 'var(--txs)' }}>{session.date}</div>
                      {session.passwordHash && <Lock size={13} style={{ color: 'var(--txm)', flexShrink: 0 }} />}
                      {session.log?.length > 0 && <div className="text-xs shrink-0 px-2 py-0.5 rounded" style={{ background: 'var(--elevated)', color: 'var(--txm)' }}>{session.log.length}줄</div>}
                      <ChevronRight size={16} style={{ color: 'var(--txs)', flexShrink: 0 }} />
                      {/* 편집/삭제 */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <button className="w-7 h-7 rounded flex items-center justify-center" style={{ background: 'var(--elevated)', color: 'var(--txm)' }} onClick={() => { setSessionEdit(session); setSessionForm({ title: session.title, date: session.date, summary: session.summary }); setSessionFormOpen(true) }}><Edit2 size={12} /></button>
                        <button className="w-7 h-7 rounded flex items-center justify-center" style={{ background: 'var(--elevated)', color: '#f87171' }} onClick={() => setDeleteSessionTarget(session)}><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 캠페인 폼 모달 */}
      <Modal isOpen={campaignFormOpen} onClose={() => setCampaignFormOpen(false)} title={campaignEdit ? '캠페인 수정' : '새 캠페인'} size="sm">
        <div className="space-y-3">
          {/* 커버 이미지 */}
          <div className="flex items-center gap-3">
            <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
              {coverPreview
                ? <img src={coverPreview} alt="" className="w-full h-full object-cover" />
                : <CoverThumb imageId={campaignForm.coverImageId} title={campaignForm.title} />
              }
            </div>
            <label className="btn-ghost text-xs cursor-pointer">
              커버 이미지 업로드
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            </label>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>캠페인명 *</label>
            <input className="input" value={campaignForm.title} onChange={e => setCampaignForm(f => ({ ...f, title: e.target.value }))} placeholder="캠페인 이름" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>시스템</label>
            <input className="input" value={campaignForm.system} onChange={e => setCampaignForm(f => ({ ...f, system: e.target.value }))} placeholder="TRPG 시스템 (예: CoC 7판)" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>설명</label>
            <textarea className="textarea" rows={3} value={campaignForm.description} onChange={e => setCampaignForm(f => ({ ...f, description: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn-ghost" onClick={() => setCampaignFormOpen(false)}>취소</button>
          <button className="btn-accent" onClick={saveCampaign}>저장</button>
        </div>
      </Modal>

      {/* 세션 폼 모달 */}
      <Modal isOpen={sessionFormOpen} onClose={() => setSessionFormOpen(false)} title={sessionEdit ? '세션 수정' : '새 세션'} size="sm">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>세션 제목 *</label>
            <input className="input" value={sessionForm.title} onChange={e => setSessionForm(f => ({ ...f, title: e.target.value }))} placeholder="세션 제목" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>날짜</label>
            <input className="input" type="date" value={sessionForm.date} onChange={e => setSessionForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>세션 요약</label>
            <textarea className="textarea" rows={3} value={sessionForm.summary} onChange={e => setSessionForm(f => ({ ...f, summary: e.target.value }))} placeholder="이번 세션의 간단한 요약" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn-ghost" onClick={() => setSessionFormOpen(false)}>취소</button>
          <button className="btn-accent" onClick={saveSession}>저장</button>
        </div>
      </Modal>

      {/* 캠페인 삭제 확인 */}
      <ConfirmDialog
        isOpen={!!deleteCampaignTarget}
        message={`"${deleteCampaignTarget?.title}" 캠페인을 삭제하시겠습니까? 하위 세션도 모두 삭제됩니다.`}
        onConfirm={() => { deleteCampaign(deleteCampaignTarget.id); if (selectedCampaignId === deleteCampaignTarget.id) setSelectedCampaignId(campaigns[0]?.id || null); setDeleteCampaignTarget(null) }}
        onCancel={() => setDeleteCampaignTarget(null)}
      />

      {/* 세션 삭제 확인 */}
      <ConfirmDialog
        isOpen={!!deleteSessionTarget}
        message={`"${deleteSessionTarget?.title}" 세션을 삭제하시겠습니까?`}
        onConfirm={() => { deleteSession(deleteSessionTarget.id); setDeleteSessionTarget(null) }}
        onCancel={() => setDeleteSessionTarget(null)}
      />
    </div>
  )
}
