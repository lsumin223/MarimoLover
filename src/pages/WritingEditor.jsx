// 글 작성/수정 에디터
import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Minus } from 'lucide-react'
import useWorkStore from '../store/useWorkStore'
import useCharacterStore from '../store/useCharacterStore'
import useWritingStore from '../store/useWritingStore'

const genId = () => 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)

export default function WritingEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { works } = useWorkStore()
  const { characters } = useCharacterStore()
  const { writings, addWriting, updateWriting } = useWritingStore()

  // 수정 모드이면 기존 데이터 로드
  const existing = id ? writings.find(w => w.id === id) : null

  const [title, setTitle] = useState(existing?.title || '')
  const [workId, setWorkId] = useState(existing?.workId || '')
  const [characterTags, setCharacterTags] = useState(existing?.characterTags || [])
  const [date, setDate] = useState(existing?.date || new Date().toISOString().slice(0, 10))
  const [content, setContent] = useState(existing?.content || '')
  const textareaRef = useRef(null)

  // 들여쓰기 삽입 (전각 스페이스)
  const insertIndent = () => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const newContent = content.slice(0, start) + '　' + content.slice(end)
    setContent(newContent)
    setTimeout(() => { el.selectionStart = el.selectionEnd = start + 1 }, 0)
  }

  // 구분선 삽입
  const insertDivider = () => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const divider = '\n---\n'
    const newContent = content.slice(0, start) + divider + content.slice(end)
    setContent(newContent)
    setTimeout(() => { el.selectionStart = el.selectionEnd = start + divider.length }, 0)
    el.focus()
  }

  // 저장
  const handleSave = () => {
    if (!title.trim()) return
    if (existing) {
      updateWriting(existing.id, { title, workId, characterTags, date, content })
      navigate(`/writings/${existing.id}`)
    } else {
      const newId = genId()
      addWriting({ id: newId, title, workId, characterTags, date, content, createdAt: new Date().toISOString() })
      navigate(`/writings/${newId}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
      {/* 상단 */}
      <div className="flex items-center justify-between mb-6">
        <button className="flex items-center gap-1 text-sm btn-ghost" onClick={() => navigate(existing ? `/writings/${existing.id}` : '/writings')}>
          <ChevronLeft size={16} /> {existing ? '뷰어로' : '목록으로'}
        </button>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => navigate(existing ? `/writings/${existing.id}` : '/writings')}>취소</button>
          <button className="btn-accent" onClick={handleSave}>저장</button>
        </div>
      </div>

      {/* 메타 정보 */}
      <div className="p-4 rounded-xl mb-4 space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <input
          className="w-full bg-transparent text-2xl font-bold outline-none placeholder:text-txs"
          style={{ color: 'var(--tx)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}
          placeholder="제목을 입력하세요"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>작품</label>
            <select className="input" value={workId} onChange={e => setWorkId(e.target.value)}>
              <option value="">미분류</option>
              {works.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>날짜</label>
            <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--txm)' }}>캐릭터 태그</label>
          <div className="flex flex-wrap gap-3">
            {characters.map(c => (
              <label key={c.id} className="flex items-center gap-1.5 cursor-pointer text-sm">
                <input type="checkbox"
                  checked={characterTags.includes(c.id)}
                  onChange={e => setCharacterTags(prev => e.target.checked ? [...prev, c.id] : prev.filter(i => i !== c.id))}
                />
                <span style={{ color: 'var(--tx)' }}>{c.name || c.groupName || '?'}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 에디터 */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {/* 툴바 */}
        <div className="flex items-center gap-2 px-4 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <button
            className="px-3 py-1 rounded text-xs font-medium transition-colors"
            style={{ background: 'var(--elevated)', color: 'var(--txm)' }}
            onClick={insertIndent}
            title="들여쓰기 (전각 스페이스 삽입)"
          >
            들여쓰기
          </button>
          <button
            className="flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors"
            style={{ background: 'var(--elevated)', color: 'var(--txm)' }}
            onClick={insertDivider}
            title="구분선 삽입 (---)"
          >
            <Minus size={12} /> 구분선
          </button>
          <span className="text-xs ml-auto" style={{ color: 'var(--txs)' }}>
            {content.length}자
          </span>
        </div>

        {/* 텍스트 에어리어 */}
        <textarea
          ref={textareaRef}
          className="w-full p-6 outline-none resize-none"
          style={{
            background: 'transparent',
            color: 'var(--tx)',
            fontFamily: 'Noto Serif KR, serif',
            fontSize: '15px',
            lineHeight: '2',
            letterSpacing: '0.02em',
            minHeight: '500px',
          }}
          placeholder="여기에 글을 작성하세요..."
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={e => {
            // Tab 키로 들여쓰기
            if (e.key === 'Tab') {
              e.preventDefault()
              insertIndent()
            }
          }}
        />
      </div>
    </div>
  )
}
