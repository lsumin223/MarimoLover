// TRPG 세션 작성/수정 에디터 — 세션 추가가 곧 글 작성
import { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, Check } from 'lucide-react'
import useTrpgStore from '../store/useTrpgStore'
import useCharacterStore from '../store/useCharacterStore'

const genId = () => 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)

export default function TrpgSessionEditor() {
  const { sessionId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { campaigns, sessions, addSession, updateSession } = useTrpgStore()
  const { characters } = useCharacterStore()
  const individualChars = characters.filter(c => c.type === 'individual' && c.name)

  const campaignId = searchParams.get('campaignId')
  const existing = sessionId ? sessions.find(s => s.id === sessionId) : null
  const campaign = campaigns.find(c => c.id === (existing?.campaignId || campaignId))

  const [title, setTitle] = useState(existing?.title || '')
  const [date, setDate] = useState(existing?.date || new Date().toISOString().slice(0, 10))
  const [summary, setSummary] = useState(existing?.summary || '')
  const [plChars, setPlChars] = useState(existing?.plCharacters || [])

  const togglePl = (charName) => setPlChars(prev =>
    prev.some(p => p.name === charName)
      ? prev.filter(p => p.name !== charName)
      : [...prev, { id: genId(), name: charName, player: '' }]
  )

  const handleSave = () => {
    if (!title.trim()) return
    if (existing) {
      updateSession(existing.id, { title, date, summary, plCharacters: plChars })
      navigate(`/trpg/${existing.id}`)
    } else {
      const newId = genId()
      addSession({
        id: newId,
        campaignId: existing?.campaignId || campaignId,
        title,
        date,
        summary,
        plCharacters: plChars,
        log: [],
        createdAt: new Date().toISOString(),
      })
      navigate(`/trpg/${newId}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
      {/* 상단 툴바 */}
      <div className="flex items-center justify-between mb-6">
        <button className="flex items-center gap-1 text-sm btn-ghost"
          onClick={() => navigate(existing ? `/trpg/${existing.id}` : '/trpg')}>
          <ChevronLeft size={16} /> {existing ? '세션으로' : 'TRPG'}
        </button>
        <div className="flex gap-2">
          <button className="btn-ghost"
            onClick={() => navigate(existing ? `/trpg/${existing.id}` : '/trpg')}>취소</button>
          <button className="btn-accent" onClick={handleSave}>저장</button>
        </div>
      </div>

      {campaign && (
        <div className="text-xs mb-3 font-medium" style={{ color: 'var(--accent)' }}>
          {campaign.title}{campaign.system ? ` · ${campaign.system}` : ''}
        </div>
      )}

      {/* 메타데이터 */}
      <div className="p-4 rounded-xl mb-4 space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <input
          className="w-full bg-transparent text-2xl font-bold outline-none"
          style={{ color: 'var(--tx)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}
          placeholder="세션 제목을 입력하세요"
          value={title}
          onChange={e => setTitle(e.target.value)}
          autoFocus
        />
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>날짜</label>
          <input className="input" type="date" value={date}
            onChange={e => setDate(e.target.value)} style={{ width: 160 }} />
        </div>
        {/* PL 캐릭터 선택 */}
        {individualChars.length > 0 && (
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--txm)' }}>PL 캐릭터</label>
            <div className="flex flex-wrap gap-2">
              {individualChars.map(c => {
                const active = plChars.some(p => p.name === c.name)
                return (
                  <button key={c.id}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                    style={active
                      ? { background: 'var(--accent)', color: 'var(--bg)' }
                      : { border: '1px solid var(--border)', color: 'var(--txm)' }}
                    onClick={() => togglePl(c.name)}>
                    {active && <Check size={10} />}
                    {c.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* 세션 기록 — 메인 텍스트 영역 */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="px-4 py-2 text-xs font-medium" style={{ borderBottom: '1px solid var(--border)', color: 'var(--txm)' }}>
          세션 기록 / 요약
        </div>
        <textarea
          className="w-full p-6 outline-none resize-none"
          style={{
            background: 'transparent',
            color: 'var(--tx)',
            fontFamily: 'Noto Serif KR, serif',
            fontSize: '15px',
            lineHeight: '2',
            letterSpacing: '0.02em',
            minHeight: '400px',
          }}
          placeholder="이번 세션의 내용이나 메모를 기록하세요..."
          value={summary}
          onChange={e => setSummary(e.target.value)}
        />
      </div>
    </div>
  )
}
