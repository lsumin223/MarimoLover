// 글 작성/수정 에디터
import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Minus } from 'lucide-react'
import useCharacterStore from '../store/useCharacterStore'
import useWritingStore from '../store/useWritingStore'

const genId = () => 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
const DRAFT_KEY = (id) => `writing-draft-${id || 'new'}`

export default function WritingEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { characters } = useCharacterStore()
  const { writings, addWriting, updateWriting } = useWritingStore()

  const existing = id ? writings.find(w => w.id === id) : null

  const [title, setTitle] = useState(existing?.title || '')
  const [tags, setTags] = useState(existing?.tags || [])
  const [date, setDate] = useState(existing?.date || new Date().toISOString().slice(0, 10))
  const [content, setContent] = useState(existing?.content || '')
  const [draftSavedAt, setDraftSavedAt] = useState(null)
  const textareaRef = useRef(null)
  const autoSaveTimer = useRef(null)

  const individualChars = characters.filter(c => c.type === 'individual')

  const toggleTag = (name) => setTags(prev =>
    prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name]
  )

  // 자동 저장
  const saveDraft = useCallback(() => {
    localStorage.setItem(DRAFT_KEY(id), JSON.stringify({ title, tags, date, content }))
    setDraftSavedAt(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }))
  }, [id, title, tags, date, content])

  useEffect(() => {
    clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(saveDraft, 2000)
    return () => clearTimeout(autoSaveTimer.current)
  }, [title, tags, date, content])

  const insertIndent = () => {
    const el = textareaRef.current; if (!el) return
    const start = el.selectionStart; const end = el.selectionEnd
    const newContent = content.slice(0, start) + '　' + content.slice(end)
    setContent(newContent)
    setTimeout(() => { el.selectionStart = el.selectionEnd = start + 1 }, 0)
  }

  const insertDivider = () => {
    const el = textareaRef.current; if (!el) return
    const start = el.selectionStart; const end = el.selectionEnd
    const divider = '\n---\n'
    setContent(content.slice(0, start) + divider + content.slice(end))
    setTimeout(() => { el.selectionStart = el.selectionEnd = start + divider.length }, 0)
    el.focus()
  }

  const handleSave = () => {
    if (!title.trim()) return
    localStorage.removeItem(DRAFT_KEY(id))
    if (existing) {
      updateWriting(existing.id, { title, tags, date, content })
      navigate(`/writings/${existing.id}`)
    } else {
      const newId = genId()
      addWriting({ id: newId, title, tags, date, content, createdAt: new Date().toISOString() })
      navigate(`/writings/${newId}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <button className="flex items-center gap-1 text-sm btn-ghost" onClick={() => navigate(existing ? `/writings/${existing.id}` : '/writings')}>
          <ChevronLeft size={16} /> {existing ? '뷰어로' : '목록으로'}
        </button>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => navigate(existing ? `/writings/${existing.id}` : '/writings')}>취소</button>
          <button className="btn-accent" onClick={handleSave}>저장</button>
        </div>
      </div>

      <div className="p-4 rounded-xl mb-4 space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <input
          className="w-full bg-transparent text-2xl font-bold outline-none"
          style={{ color: 'var(--tx)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}
          placeholder="제목을 입력하세요"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>날짜</label>
          <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: 160 }} />
        </div>
        {individualChars.length > 0 && (
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--txm)' }}>캐릭터 태그</label>
            <div className="flex flex-wrap gap-2">
              {individualChars.map(c => {
                const active = tags.includes(c.name)
                return (
                  <button key={c.id}
                    className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                    style={active
                      ? { background: 'var(--accent)', color: 'var(--bg)' }
                      : { border: '1px solid var(--border)', color: 'var(--txm)' }}
                    onClick={() => toggleTag(c.name)}>
                    {c.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 px-4 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <button className="px-3 py-1 rounded text-xs font-medium"
            style={{ background: 'var(--elevated)', color: 'var(--txm)' }}
            onClick={insertIndent}>들여쓰기</button>
          <button className="flex items-center gap-1 px-3 py-1 rounded text-xs font-medium"
            style={{ background: 'var(--elevated)', color: 'var(--txm)' }}
            onClick={insertDivider}><Minus size={12} /> 구분선</button>
          <span className="text-xs" style={{ color: 'var(--txs)' }}>{content.length}자</span>
          {draftSavedAt && (
            <span className="text-xs ml-auto" style={{ color: 'var(--txs)' }}>임시저장 {draftSavedAt}</span>
          )}
        </div>
        <textarea
          ref={textareaRef}
          className="w-full p-6 outline-none resize-none"
          style={{ background: 'transparent', color: 'var(--tx)', fontFamily: 'Noto Serif KR, serif', fontSize: '15px', lineHeight: '2', letterSpacing: '0.02em', minHeight: '500px' }}
          placeholder="여기에 글을 작성하세요..."
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={e => { if (e.key === 'Tab') { e.preventDefault(); insertIndent() } }}
        />
      </div>
    </div>
  )
}
