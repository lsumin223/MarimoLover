// 글 작성/수정 에디터 — 뷰어 설정 패널 포함
import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Minus, ChevronDown, ChevronUp } from 'lucide-react'
import useCharacterStore from '../store/useCharacterStore'
import useWritingStore from '../store/useWritingStore'

const genId = () => 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
const DRAFT_KEY = (id) => `writing-draft-${id || 'new'}`

const VIEWER_KEY = 'writing-viewer-settings'
const DEFAULT_VIEWER = {
  fontFamily: 'Noto Serif KR',
  fontSize: 17,
  lineHeight: 1.9,
  letterSpacing: 0.03,
  maxWidth: 640,
}
const FONT_OPTIONS = [
  { value: 'Noto Serif KR', label: '명조 (Noto Serif)' },
  { value: 'Gowun Batang', label: '명조 (고운 바탕)' },
  { value: 'Noto Sans KR', label: '고딕 (Noto Sans)' },
  { value: 'Gowun Dodum', label: '손글씨 (고운 돋움)' },
  { value: 'Nanum Gothic Coding', label: '모노 (나눔고딕코딩)' },
]

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

  // 뷰어 설정 (WritingPost와 같은 localStorage 키 공유)
  const [vs, setVsState] = useState(() => {
    try { return { ...DEFAULT_VIEWER, ...JSON.parse(localStorage.getItem(VIEWER_KEY) || '{}') } }
    catch { return DEFAULT_VIEWER }
  })
  const [showVS, setShowVS] = useState(false)
  const setVS = (key, value) => setVsState(prev => {
    const next = { ...prev, [key]: value }
    localStorage.setItem(VIEWER_KEY, JSON.stringify(next))
    return next
  })

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
    const start = el.selectionStart
    const divider = '\n---\n'
    setContent(content.slice(0, start) + divider + content.slice(el.selectionEnd))
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
      {/* 상단 툴바 */}
      <div className="flex items-center justify-between mb-6">
        <button className="flex items-center gap-1 text-sm btn-ghost"
          onClick={() => navigate(existing ? `/writings/${existing.id}` : '/writings')}>
          <ChevronLeft size={16} /> {existing ? '뷰어로' : '목록으로'}
        </button>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => navigate(existing ? `/writings/${existing.id}` : '/writings')}>취소</button>
          <button className="btn-accent" onClick={handleSave}>저장</button>
        </div>
      </div>

      {/* 메타데이터 카드 */}
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

      {/* 뷰어 설정 패널 */}
      <div className="rounded-xl mb-4 overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <button
          className="w-full flex items-center justify-between px-4 py-2.5 hover:opacity-80 transition-opacity"
          onClick={() => setShowVS(v => !v)}
        >
          <span className="text-xs font-medium" style={{ color: 'var(--txm)' }}>뷰어 설정</span>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--txs)' }}>
              {vs.fontSize}px · 행간 {vs.lineHeight.toFixed(1)} · 자간 {vs.letterSpacing.toFixed(2)}em
            </span>
            {showVS
              ? <ChevronUp size={13} style={{ color: 'var(--txs)' }} />
              : <ChevronDown size={13} style={{ color: 'var(--txs)' }} />}
          </div>
        </button>
        {showVS && (
          <div className="px-4 pb-4 pt-3 border-t border-border space-y-4">
            {/* 글꼴 */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--txm)' }}>글꼴</label>
              <select className="input text-sm" value={vs.fontFamily}
                onChange={e => setVS('fontFamily', e.target.value)}
                style={{ fontFamily: vs.fontFamily }}>
                {FONT_OPTIONS.map(f => (
                  <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
                ))}
              </select>
            </div>
            {/* 슬라이더 2열 그리드 */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--txm)' }}>글자 크기</label>
                  <span className="text-xs" style={{ color: 'var(--accent)' }}>{vs.fontSize}px</span>
                </div>
                <input type="range" min={14} max={24} step={1} value={vs.fontSize}
                  onChange={e => setVS('fontSize', Number(e.target.value))}
                  className="w-full" style={{ accentColor: 'var(--accent)' }} />
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--txm)' }}>행간</label>
                  <span className="text-xs" style={{ color: 'var(--accent)' }}>{vs.lineHeight.toFixed(1)}</span>
                </div>
                <input type="range" min={1.4} max={2.4} step={0.1} value={vs.lineHeight}
                  onChange={e => setVS('lineHeight', Number(e.target.value))}
                  className="w-full" style={{ accentColor: 'var(--accent)' }} />
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--txm)' }}>자간</label>
                  <span className="text-xs" style={{ color: 'var(--accent)' }}>{vs.letterSpacing.toFixed(2)}em</span>
                </div>
                <input type="range" min={-0.05} max={0.20} step={0.01} value={vs.letterSpacing}
                  onChange={e => setVS('letterSpacing', Number(e.target.value))}
                  className="w-full" style={{ accentColor: 'var(--accent)' }} />
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--txm)' }}>본문 너비</label>
                  <span className="text-xs" style={{ color: 'var(--accent)' }}>{vs.maxWidth}px</span>
                </div>
                <input type="range" min={400} max={900} step={20} value={vs.maxWidth}
                  onChange={e => setVS('maxWidth', Number(e.target.value))}
                  className="w-full" style={{ accentColor: 'var(--accent)' }} />
              </div>
            </div>
            <button className="text-xs" style={{ color: 'var(--txs)' }}
              onClick={() => { localStorage.setItem(VIEWER_KEY, JSON.stringify(DEFAULT_VIEWER)); setVsState(DEFAULT_VIEWER) }}>
              기본값으로 초기화
            </button>
          </div>
        )}
      </div>

      {/* 에디터 */}
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
          style={{
            background: 'transparent',
            color: 'var(--tx)',
            fontFamily: `${vs.fontFamily}, serif`,
            fontSize: `${vs.fontSize}px`,
            lineHeight: vs.lineHeight,
            letterSpacing: `${vs.letterSpacing}em`,
            minHeight: '500px',
          }}
          placeholder="여기에 글을 작성하세요..."
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={e => { if (e.key === 'Tab') { e.preventDefault(); insertIndent() } }}
        />
      </div>
    </div>
  )
}
