// 글 페이지 — 시리즈 사이드바 + 글 목록 (TRPG 구조와 동일)
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit2, Trash2, FileText, Image as ImageIcon, X } from 'lucide-react'
import useWritingStore from '../store/useWritingStore'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import TagInput from '../components/common/TagInput'
import { saveImage, resizeImage, getImage, deleteImage } from '../lib/imageDB'

const genId = () => 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)

// 시리즈 썸네일
function SeriesThumb({ imageId, name }) {
  const [src, setSrc] = useState(null)
  useEffect(() => { if (imageId) getImage(imageId).then(setSrc) }, [imageId])
  if (src) return <img src={src} alt={name} className="w-full h-full object-cover" />
  return (
    <div className="w-full h-full flex items-center justify-center text-lg font-bold" style={{ color: 'var(--accent)' }}>
      {(name || '?')[0]}
    </div>
  )
}

const emptySeriesForm = { title: '', description: '', mainCharacters: '', thumbnailImageId: null }
const emptyWritingForm = { title: '', chapterNum: '', date: new Date().toISOString().slice(0, 10), content: '', tags: [] }

export default function Writings() {
  const navigate = useNavigate()
  const { series, writings, addSeries, updateSeries, deleteSeries, addWriting, updateWriting, deleteWriting } = useWritingStore()

  // 선택된 시리즈
  const [selectedSeriesId, setSelectedSeriesId] = useState(null)

  // 시리즈 폼
  const [seriesFormOpen, setSeriesFormOpen] = useState(false)
  const [editSeries, setEditSeries] = useState(null)
  const [seriesForm, setSeriesForm] = useState(emptySeriesForm)
  const [seriesThumbSrc, setSeriesThumbSrc] = useState(null)

  // 글 폼
  const [writingFormOpen, setWritingFormOpen] = useState(false)
  const [editWriting, setEditWriting] = useState(null)
  const [writingForm, setWritingForm] = useState(emptyWritingForm)

  // 삭제 확인
  const [deleteSeriesTarget, setDeleteSeriesTarget] = useState(null)
  const [deleteWritingTarget, setDeleteWritingTarget] = useState(null)

  const filteredSeries = [...series].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  // 선택된 시리즈 데이터
  const currentSeries = series.find(s => s.id === selectedSeriesId)

  // 선택된 시리즈의 글 목록
  const currentWritings = writings
    .filter(w => w.seriesId === selectedSeriesId)
    .sort((a, b) => (a.chapterNum || 0) - (b.chapterNum || 0))

  // 시리즈 선택 시 자동으로 첫 시리즈 선택
  useEffect(() => {
    if (!selectedSeriesId && filteredSeries.length > 0) {
      setSelectedSeriesId(filteredSeries[0].id)
    }
  }, [filteredSeries.length])

  // 시리즈 썸네일 로드
  useEffect(() => {
    if (seriesForm.thumbnailImageId) getImage(seriesForm.thumbnailImageId).then(setSeriesThumbSrc)
    else setSeriesThumbSrc(null)
  }, [seriesForm.thumbnailImageId])

  // 시리즈 썸네일 업로드
  const handleSeriesThumb = async (e) => {
    const file = e.target.files[0]; if (!file) return
    const b64 = await resizeImage(file, 600)
    const id = genId()
    await saveImage(id, b64)
    setSeriesForm(f => ({ ...f, thumbnailImageId: id }))
    setSeriesThumbSrc(b64)
  }

  // 시리즈 폼 열기
  const openSeriesCreate = () => {
    setEditSeries(null)
    setSeriesForm({ ...emptySeriesForm })
    setSeriesThumbSrc(null)
    setSeriesFormOpen(true)
  }
  const openSeriesEdit = (s) => {
    setEditSeries(s)
    setSeriesForm({ title: s.title, description: s.description || '', mainCharacters: s.mainCharacters || '', thumbnailImageId: s.thumbnailImageId || null })
    setSeriesThumbSrc(null)
    if (s.thumbnailImageId) getImage(s.thumbnailImageId).then(setSeriesThumbSrc)
    setSeriesFormOpen(true)
  }

  // 시리즈 저장
  const saveSeries = () => {
    if (!seriesForm.title) return
    if (editSeries) updateSeries(editSeries.id, seriesForm)
    else addSeries(seriesForm)
    setSeriesFormOpen(false)
  }

  // 시리즈 삭제
  const handleDeleteSeries = async () => {
    if (deleteSeriesTarget?.thumbnailImageId) await deleteImage(deleteSeriesTarget.thumbnailImageId)
    deleteSeries(deleteSeriesTarget.id)
    if (selectedSeriesId === deleteSeriesTarget.id) setSelectedSeriesId(null)
    setDeleteSeriesTarget(null)
  }

  // 글 폼 열기
  const openWritingCreate = () => {
    if (!selectedSeriesId) return
    setEditWriting(null)
    const nextChap = Math.max(0, ...currentWritings.map(w => w.chapterNum || 0)) + 1
    setWritingForm({ ...emptyWritingForm, chapterNum: nextChap })
    setWritingFormOpen(true)
  }
  const openWritingEdit = (w) => {
    setEditWriting(w)
    setWritingForm({ title: w.title, chapterNum: w.chapterNum || '', date: w.date || '', content: w.content || '' })
    setWritingFormOpen(true)
  }

  // 글 저장
  const saveWriting = () => {
    if (!writingForm.title || !selectedSeriesId) return
    const payload = { ...writingForm, seriesId: selectedSeriesId }
    if (editWriting) updateWriting(editWriting.id, payload)
    else addWriting(payload)
    setWritingFormOpen(false)
  }

  return (
    <div className="flex gap-0 animate-fade-in" style={{ minHeight: 'calc(100vh - 84px)' }}>
      {/* 사이드바: 시리즈 목록 */}
      <div className="w-56 shrink-0 border-r border-border overflow-y-auto" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center justify-between px-3 py-3 border-b border-border">
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--txm)' }}>시리즈</span>
          <button
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}
            onClick={openSeriesCreate}
          ><Plus size={13} /></button>
        </div>
        {filteredSeries.length === 0 ? (
          <div className="px-3 py-6 text-xs text-center" style={{ color: 'var(--txs)' }}>시리즈가 없습니다</div>
        ) : (
          filteredSeries.map(s => (
            <button
              key={s.id}
              className="w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition-colors"
              style={{
                background: selectedSeriesId === s.id ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent',
                borderLeft: selectedSeriesId === s.id ? '2px solid var(--accent)' : '2px solid transparent',
              }}
              onClick={() => setSelectedSeriesId(s.id)}
            >
              <div className="w-8 h-8 rounded-md shrink-0 overflow-hidden" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                <SeriesThumb imageId={s.thumbnailImageId} name={s.title} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold truncate" style={{ color: selectedSeriesId === s.id ? 'var(--accent)' : 'var(--tx)' }}>{s.title}</div>
                <div className="text-xs truncate" style={{ color: 'var(--txs)' }}>{writings.filter(w => w.seriesId === s.id).length}화</div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* 메인: 시리즈 상세 + 글 목록 */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {!currentSeries ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3" style={{ color: 'var(--txs)' }}>
            <FileText size={32} />
            <p className="text-sm">시리즈를 선택하거나 새로 추가해주세요</p>
            <button className="btn-accent text-sm" onClick={openSeriesCreate}>+ 새 시리즈</button>
          </div>
        ) : (
          <>
            {/* 시리즈 헤더 */}
            <div className="flex items-start gap-4 mb-6 p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="w-16 h-16 rounded-lg shrink-0 overflow-hidden" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                <SeriesThumb imageId={currentSeries.thumbnailImageId} name={currentSeries.title} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-lg font-bold mb-1" style={{ color: 'var(--tx)' }}>{currentSeries.title}</div>
                {currentSeries.mainCharacters && <div className="text-xs mb-1" style={{ color: 'var(--accent)' }}>{currentSeries.mainCharacters}</div>}
                {currentSeries.description && <p className="text-xs leading-relaxed" style={{ color: 'var(--txm)' }}>{currentSeries.description}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <button className="w-7 h-7 rounded flex items-center justify-center" style={{ color: 'var(--txm)' }} onClick={() => openSeriesEdit(currentSeries)}><Edit2 size={13} /></button>
                <button className="w-7 h-7 rounded flex items-center justify-center" style={{ color: '#f87171' }} onClick={() => setDeleteSeriesTarget(currentSeries)}><Trash2 size={13} /></button>
              </div>
            </div>

            {/* 글 목록 헤더 */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold" style={{ color: 'var(--tx)' }}>글 목록 <span style={{ color: 'var(--txs)', fontWeight: 400 }}>({currentWritings.length})</span></span>
              <button className="btn-accent flex items-center gap-1 text-xs" onClick={openWritingCreate}><Plus size={12} /> 새 글</button>
            </div>

            {/* 글 목록 */}
            {currentWritings.length === 0 ? (
              <div className="text-center py-16 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--txs)' }}>
                <p className="mb-3 text-sm">등록된 글이 없습니다</p>
                <button className="btn-ghost text-xs" onClick={openWritingCreate}>+ 첫 글 추가</button>
              </div>
            ) : (
              <div className="space-y-2">
                {currentWritings.map(w => (
                  <div
                    key={w.id}
                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    onClick={() => navigate(`/writings/${w.id}`)}
                  >
                    <div className="w-7 h-7 rounded-md shrink-0 flex items-center justify-center text-xs font-bold" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}>
                      {w.chapterNum || '—'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: 'var(--tx)' }}>{w.title}</div>
                      {w.content && <div className="text-xs truncate mt-0.5" style={{ color: 'var(--txm)' }}>{w.content.slice(0, 60)}</div>}
                    </div>
                    <div className="text-xs shrink-0" style={{ color: 'var(--txs)' }}>{w.date}</div>
                    <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <button className="w-6 h-6 rounded flex items-center justify-center" style={{ color: 'var(--txm)' }} onClick={() => openWritingEdit(w)}><Edit2 size={11} /></button>
                      <button className="w-6 h-6 rounded flex items-center justify-center" style={{ color: '#f87171' }} onClick={() => setDeleteWritingTarget(w)}><Trash2 size={11} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* 시리즈 폼 모달 */}
      <Modal isOpen={seriesFormOpen} onClose={() => setSeriesFormOpen(false)} title={editSeries ? '시리즈 수정' : '새 시리즈'} size="sm">
        <div className="space-y-3">
          {/* 썸네일 */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
              {seriesThumbSrc
                ? <img src={seriesThumbSrc} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={18} style={{ color: 'var(--txs)' }} /></div>
              }
            </div>
            <label className="btn-ghost text-xs cursor-pointer">
              썸네일 업로드
              <input type="file" accept="image/*" className="hidden" onChange={handleSeriesThumb} />
            </label>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>제목 *</label>
            <input className="input" value={seriesForm.title} onChange={e => setSeriesForm(f => ({ ...f, title: e.target.value }))} placeholder="시리즈 제목" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>중심 캐릭터</label>
            <input className="input" value={seriesForm.mainCharacters} onChange={e => setSeriesForm(f => ({ ...f, mainCharacters: e.target.value }))} placeholder="예: 리온, 세라핀" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>설명</label>
            <textarea className="textarea" rows={3} value={seriesForm.description} onChange={e => setSeriesForm(f => ({ ...f, description: e.target.value }))} placeholder="시리즈 소개" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn-ghost" onClick={() => setSeriesFormOpen(false)}>취소</button>
          <button className="btn-accent" onClick={saveSeries}>저장</button>
        </div>
      </Modal>

      {/* 글 폼 모달 */}
      <Modal isOpen={writingFormOpen} onClose={() => setWritingFormOpen(false)} title={editWriting ? '글 수정' : '새 글'} size="sm">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>화수</label>
              <input className="input" type="number" min="1" value={writingForm.chapterNum} onChange={e => setWritingForm(f => ({ ...f, chapterNum: Number(e.target.value) }))} placeholder="1" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>날짜</label>
              <input className="input" type="date" value={writingForm.date} onChange={e => setWritingForm(f => ({ ...f, date: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>제목 *</label>
            <input className="input" value={writingForm.title} onChange={e => setWritingForm(f => ({ ...f, title: e.target.value }))} placeholder="글 제목" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>태그 (캐릭터명 등)</label>
            <TagInput tags={writingForm.tags || []} onChange={v => setWritingForm(f => ({ ...f, tags: v }))} placeholder="태그 입력 후 Enter" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>본문</label>
            <textarea className="textarea" rows={8} value={writingForm.content} onChange={e => setWritingForm(f => ({ ...f, content: e.target.value }))} placeholder="내용을 입력하세요" style={{ fontFamily: 'inherit' }} />
          </div>
        </div>
        <div className="flex gap-2 mt-5 justify-end">
          <button className="btn-ghost" onClick={() => setWritingFormOpen(false)}>취소</button>
          <button className="btn-accent" onClick={() => { saveWriting(); navigate(`/writings/`) }}>저장만</button>
          <button className="btn-accent" onClick={() => { if (writingForm.title && selectedSeriesId) { const payload = { ...writingForm, seriesId: selectedSeriesId, workId: currentSeries?.workId || '' }; if (editWriting) updateWriting(editWriting.id, payload); else addWriting(payload); setWritingFormOpen(false); } }}>저장</button>
        </div>
      </Modal>

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        isOpen={!!deleteSeriesTarget}
        message={`"${deleteSeriesTarget?.title}" 시리즈와 모든 글을 삭제하시겠습니까?`}
        confirmText="삭제"
        onConfirm={handleDeleteSeries}
        onCancel={() => setDeleteSeriesTarget(null)}
      />
      <ConfirmDialog
        isOpen={!!deleteWritingTarget}
        message={`"${deleteWritingTarget?.title}"을 삭제하시겠습니까?`}
        onConfirm={() => { deleteWriting(deleteWritingTarget.id); setDeleteWritingTarget(null) }}
        onCancel={() => setDeleteWritingTarget(null)}
      />
    </div>
  )
}
