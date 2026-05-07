// 글 작성/수정 에디터 — 화자별 서식 + 비밀글
import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, Minus, ChevronDown, ChevronUp, Lock, AlignLeft, AlignCenter, AlignJustify } from 'lucide-react'
import useCharacterStore from '../store/useCharacterStore'
import useWritingStore from '../store/useWritingStore'

const genId = () => 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
const DRAFT_KEY = (id) => `writing-draft-${id || 'new'}`

const FONT_OPTIONS = [
  { value: 'Noto Serif KR', label: '명조 (Noto Serif KR)' },
  { value: 'Gowun Batang', label: '명조 (고운 바탕)' },
  { value: 'Noto Sans KR', label: '고딕 (Noto Sans KR)' },
  { value: 'Gowun Dodum', label: '고운 돋움' },
]

export default function WritingEditor() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { characters } = useCharacterStore()
  const { writings, addWriting, updateWriting } = useWritingStore()

  const existing = id ? writings.find(w => w.id === id) : null
  const seriesId = existing?.seriesId || searchParams.get('seriesId') || null

  // 화수 자동 계산
  const calcNextChapter = () => {
    if (existing?.chapterNum) return existing.chapterNum
    if (!seriesId) return ''
    const sibs = writings.filter(w => w.seriesId === seriesId && w.id !== existing?.id)
    const max = Math.max(0, ...sibs.map(w => Number(w.chapterNum) || 0))
    return max + 1
  }

  const [title, setTitle] = useState(existing?.title || '')
  const [chapterNum, setChapterNum] = useState(calcNextChapter)
  const [tags, setTags] = useState(existing?.tags || [])
  const [date, setDate] = useState(existing?.date || new Date().toISOString().slice(0, 10))
  const [content, setContent] = useState(existing?.content || '')
  const [isPrivate, setIsPrivate] = useState(existing?.isPrivate || false)
  const [draftSavedAt, setDraftSavedAt] = useState(null)

  // 서식 (포스트별 저장)
  const [fontFamily, setFontFamily] = useState(existing?.fontFamily || 'Noto Serif KR')
  const [fontSize, setFontSize] = useState(existing?.fontSize || 17)
  const [lineHeight, setLineHeight] = useState(existing?.lineHeight || 1.9)
  const [letterSpacing, setLetterSpacing] = useState(existing?.letterSpacing || 0.03)
  const [textAlign, setTextAlign] = useState(existing?.textAlign || 'left')
  const [showTypo, setShowTypo] = useState(false)

  const textareaRef = useRef(null)
  const autoSaveTimer = useRef(null)
  const individualChars = characters.filter(c => c.type === 'individual')

  const toggleTag = (name) => setTags(prev =>
    prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name]
  )

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
    const payload = {
      title, tags, date, content, isPrivate, seriesId,
      chapterNum: chapterNum !== '' ? Number(chapterNum) : null,
      fontFamily, fontSize, lineHeight, letterSpacing, textAlign,
    }
    if (existing) {
      updateWriting(existing.id, payload)
      navigate(`/writings/${existing.id}`)
    } else {
      const newId = genId()
      addWriting({ id: newId, ...payload, createdAt: new Date().toISOString() })
      navigate(`/writings/${newId}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
      {/* 상단 */}
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

      {/* 메타데이터 */}
      <div className="p-4 rounded-xl mb-4 space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <input
          className="w-full bg-transparent text-2xl font-bold outline-none"
          style={{ color: 'var(--tx)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}
          placeholder="제목을 입력하세요"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>날짜</label>
            <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          {seriesId && (
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>화수</label>
              <input className="input" type="number" min="1" value={chapterNum}
                onChange={e => setChapterNum(e.target.value)} placeholder="자동" />
            </div>
          )}
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
        {/* 비밀글 */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} />
          <span className="text-xs flex items-center gap-1.5" style={{ color: 'var(--txm)' }}>
            <Lock size={12} /> 비밀글 (관리자만 열람)
          </span>
        </label>
      </div>

      {/* 서식 설정 */}
      <div className="rounded-xl mb-4 overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <button
          className="w-full flex items-center justify-between px-4 py-2.5 hover:opacity-80 transition-opacity"
          onClick={() => setShowTypo(v => !v)}
        >
          <span className="text-xs font-medium" style={{ color: 'var(--txm)' }}>서식 설정</span>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--txs)' }}>
              {fontFamily.split(' ')[0]} · {fontSize}px · 행간 {lineHeight.toFixed(1)}
            </span>
            {showTypo ? <ChevronUp size={13} style={{ color: 'var(--txs)' }} /> : <ChevronDown size={13} style={{ color: 'var(--txs)' }} />}
          </div>
        </button>
        {showTypo && (
          <div className="px-4 pb-4 pt-3 border-t border-border space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--txm)' }}>글꼴</label>
              <select className="input text-sm" value={fontFamily} onChange={e => setFontFamily(e.target.value)}
                style={{ fontFamily }}>
                {FONT_OPTIONS.map(f => (
                  <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <div className="flex justify-between mb-1"><label className="text-xs font-medium" style={{ color: 'var(--txm)' }}>글자 크기</label><span className="text-xs" style={{ color: 'var(--accent)' }}>{fontSize}px</span></div>
                <input type="range" min={14} max={24} step={1} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-full" style={{ accentColor: 'var(--accent)' }} />
              </div>
              <div>
                <div className="flex justify-between mb-1"><label className="text-xs font-medium" style={{ color: 'var(--txm)' }}>행간</label><span className="text-xs" style={{ color: 'var(--accent)' }}>{lineHeight.toFixed(1)}</span></div>
                <input type="range" min={1.4} max={2.6} step={0.1} value={lineHeight} onChange={e => setLineHeight(Number(e.target.value))} className="w-full" style={{ accentColor: 'var(--accent)' }} />
              </div>
              <div>
                <div className="flex justify-between mb-1"><label className="text-xs font-medium" style={{ color: 'var(--txm)' }}>자간</label><span className="text-xs" style={{ color: 'var(--accent)' }}>{letterSpacing.toFixed(2)}em</span></div>
                <input type="range" min={-0.05} max={0.20} step={0.01} value={letterSpacing} onChange={e => setLetterSpacing(Number(e.target.value))} className="w-full" style={{ accentColor: 'var(--accent)' }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--txm)' }}>정렬</label>
                <div className="flex gap-1">
                  {[['left', <AlignLeft size={14} />], ['center', <AlignCenter size={14} />], ['justify', <AlignJustify size={14} />]].map(([val, icon]) => (
                    <button key={val}
                      className="flex-1 py-1.5 rounded flex items-center justify-center transition-all"
                      style={textAlign === val
                        ? { background: 'var(--accent)', color: 'var(--bg)' }
                        : { border: '1px solid var(--border)', color: 'var(--txm)' }}
                      onClick={() => setTextAlign(val)}>{icon}</button>
                  ))}
                </div>
              </div>
            </div>
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
          {draftSavedAt && <span className="text-xs ml-auto" style={{ color: 'var(--txs)' }}>임시저장 {draftSavedAt}</span>}
        </div>
        <textarea
          ref={textareaRef}
          className="w-full p-6 outline-none resize-none"
          style={{
            background: 'transparent',
            color: 'var(--tx)',
            fontFamily: `${fontFamily}, serif`,
            fontSize: `${fontSize}px`,
            lineHeight,
            letterSpacing: `${letterSpacing}em`,
            textAlign,
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
