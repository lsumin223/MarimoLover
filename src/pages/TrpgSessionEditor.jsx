// TRPG 세션 작성/수정 에디터 — 세션 기록 + 로그 파싱 + 비밀번호 잠금
import { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, Check, X, ChevronDown, ChevronUp, Lock, Eye, EyeOff, Upload } from 'lucide-react'
import useTrpgStore from '../store/useTrpgStore'
import useCharacterStore from '../store/useCharacterStore'

const genId = () => 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function parseCcfoliaHtml(html) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const paragraphs = doc.querySelectorAll('p')
  const entries = []
  paragraphs.forEach((p, idx) => {
    const spans = p.querySelectorAll('span')
    if (spans.length >= 3) {
      const color = p.style.color || '#888888'
      const channel = spans[0]?.textContent?.trim().replace(/[\[\]]/g, '') || ''
      const character = spans[1]?.textContent?.trim() || ''
      const content = spans[2]?.textContent?.trim() || ''
      if (character && content) entries.push({ id: 'log-' + idx, color, channel, character, content })
    }
  })
  return entries
}

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

  // 로그 파싱
  const [log, setLog] = useState(existing?.log || [])
  const [showLogSection, setShowLogSection] = useState(false)
  const [rawHtml, setRawHtml] = useState('')
  const [parsedPreview, setParsedPreview] = useState(null)

  // 비밀번호 잠금
  const [pwInput, setPwInput] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [showPwFields, setShowPwFields] = useState(false)
  const [showPwText, setShowPwText] = useState(false)

  const togglePl = (charName) => setPlChars(prev =>
    prev.some(p => p.name === charName)
      ? prev.filter(p => p.name !== charName)
      : [...prev, { id: genId(), name: charName, player: '' }]
  )

  const handleParse = () => {
    if (!rawHtml.trim()) return
    const parsed = parseCcfoliaHtml(rawHtml)
    setParsedPreview(parsed)
  }

  const applyLog = () => {
    if (!parsedPreview) return
    setLog(parsedPreview)
    setParsedPreview(null)
    setRawHtml('')
  }

  const clearLog = () => {
    setLog([])
    setParsedPreview(null)
    setRawHtml('')
  }

  const handleJsonImport = (e) => {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (data.log) setLog(data.log)
      } catch { alert('JSON 파일을 읽을 수 없습니다.') }
    }
    reader.readAsText(file)
  }

  const handleSave = async () => {
    if (!title.trim()) return
    let passwordHash = existing?.passwordHash || null
    if (pwInput.trim()) {
      if (pwInput !== pwConfirm) { alert('비밀번호가 일치하지 않습니다.'); return }
      passwordHash = await sha256(pwInput)
    }
    const payload = { title, date, summary, plCharacters: plChars, log, passwordHash }
    if (existing) {
      updateSession(existing.id, payload)
      navigate(`/trpg/${existing.id}`)
    } else {
      const newId = genId()
      addSession({
        id: newId,
        campaignId: existing?.campaignId || campaignId,
        ...payload,
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

      {/* 세션 기록 텍스트 */}
      <div className="rounded-xl mb-4 overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
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
            minHeight: '300px',
          }}
          placeholder="이번 세션의 내용이나 메모를 기록하세요..."
          value={summary}
          onChange={e => setSummary(e.target.value)}
        />
      </div>

      {/* CCFOLIA 로그 파싱 섹션 */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <button
          className="w-full flex items-center justify-between px-4 py-3 hover:opacity-80 transition-opacity"
          onClick={() => setShowLogSection(v => !v)}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: 'var(--tx)' }}>CCFOLIA 로그</span>
            {log.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}>
                {log.length}줄
              </span>
            )}
          </div>
          {showLogSection
            ? <ChevronUp size={14} style={{ color: 'var(--txs)' }} />
            : <ChevronDown size={14} style={{ color: 'var(--txs)' }} />}
        </button>

        {showLogSection && (
          <div className="px-4 pb-4 pt-1 border-t border-border space-y-3">
            <p className="text-xs" style={{ color: 'var(--txs)' }}>
              코코포리아 채팅 로그 백업 HTML 파일의 내용을 전체 복사해서 붙여넣어 주세요.
            </p>

            <textarea
              className="textarea"
              rows={6}
              value={rawHtml}
              onChange={e => { setRawHtml(e.target.value); setParsedPreview(null) }}
              placeholder="<html>...</html>"
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
            />

            <div className="flex items-center gap-2 flex-wrap">
              <button className="btn-accent text-sm" onClick={handleParse}
                disabled={!rawHtml.trim()}>
                파싱 미리보기
              </button>
              {parsedPreview && (
                <button className="btn-ghost text-sm flex items-center gap-1"
                  style={{ color: 'var(--accent)', border: '1px solid var(--accent)' }}
                  onClick={applyLog}>
                  <Check size={13} /> {parsedPreview.length}줄 적용
                </button>
              )}
              {log.length > 0 && (
                <button className="btn-ghost text-xs" style={{ color: '#f87171' }} onClick={clearLog}>
                  로그 초기화
                </button>
              )}
              {log.length > 0 && !parsedPreview && (
                <span className="text-xs ml-auto" style={{ color: 'var(--txs)' }}>
                  현재 {log.length}줄 저장됨
                </span>
              )}
              {/* JSON 가져오기 */}
              <label className="btn-ghost flex items-center gap-1.5 text-xs cursor-pointer">
                <Upload size={13} /> JSON 가져오기
                <input type="file" accept=".json" className="hidden" onChange={handleJsonImport} />
              </label>
            </div>

            {/* 파싱 미리보기 */}
            {parsedPreview && (
              <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <div className="px-3 py-2 text-xs font-medium flex items-center justify-between"
                  style={{ background: 'var(--elevated)', borderBottom: '1px solid var(--border)', color: 'var(--txm)' }}>
                  <span>미리보기 — {parsedPreview.length}줄</span>
                  <button onClick={() => setParsedPreview(null)} style={{ color: 'var(--txs)' }}>
                    <X size={13} />
                  </button>
                </div>
                <div className="overflow-y-auto" style={{ maxHeight: 300 }}>
                  {parsedPreview.slice(0, 30).map(entry => (
                    <div key={entry.id} className="trpg-log-entry">
                      {entry.channel && (
                        <span className="trpg-channel-badge shrink-0">[{entry.channel}]</span>
                      )}
                      <span className="font-semibold shrink-0 text-sm" style={{ color: entry.color, minWidth: '5em' }}>
                        {entry.character}
                      </span>
                      <span className="text-sm flex-1" style={{ color: 'var(--tx)', lineHeight: 1.6 }}>
                        {entry.content}
                      </span>
                    </div>
                  ))}
                  {parsedPreview.length > 30 && (
                    <div className="px-4 py-2 text-xs text-center" style={{ color: 'var(--txs)' }}>
                      ... 외 {parsedPreview.length - 30}줄
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 비밀번호 잠금 */}
      <div className="rounded-xl overflow-hidden mt-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <button className="w-full flex items-center justify-between px-4 py-3" onClick={() => setShowPwFields(v => !v)}>
          <span className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--tx)' }}>
            <Lock size={14} style={{ color: existing?.passwordHash ? 'var(--accent)' : 'var(--txm)' }} />
            세션 잠금
            {existing?.passwordHash && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}>설정됨</span>}
          </span>
          <span className="text-xs" style={{ color: 'var(--txs)' }}>{showPwFields ? '닫기' : '설정'}</span>
        </button>
        {showPwFields && (
          <div className="px-4 pb-4 pt-1 border-t border-border space-y-2">
            <p className="text-xs" style={{ color: 'var(--txs)' }}>{existing?.passwordHash ? '새 비밀번호 입력 시 변경됩니다.' : '설정하면 비밀번호 없이 열람 불가합니다.'}</p>
            <div className="flex gap-2">
              <input type={showPwText ? 'text' : 'password'} className="input flex-1" placeholder="비밀번호" value={pwInput} onChange={e => setPwInput(e.target.value)} />
              <input type={showPwText ? 'text' : 'password'} className="input flex-1" placeholder="비밀번호 확인" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} />
              <button className="btn-ghost" onClick={() => setShowPwText(v => !v)}>{showPwText ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
