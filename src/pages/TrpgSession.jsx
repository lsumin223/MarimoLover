// TRPG 세션 상세 — 로그 파싱/뷰어/내보내기 + PL 캐릭터 + 비밀번호 잠금
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Download, Upload, X, Plus, Trash2, Lock, Eye, EyeOff, Users, Check } from 'lucide-react'
import useTrpgStore from '../store/useTrpgStore'
import useCharacterStore from '../store/useCharacterStore'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { useIsAdmin } from '../store/useAdminStore'

const genId = () => 'pl-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// CCFOLIA 백업 HTML 파싱 함수
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
      if (character && content) {
        entries.push({ id: 'log-' + idx, color, channel, character, content })
      }
    }
  })
  return entries
}

export default function TrpgSession() {
  const isAdmin = useIsAdmin()
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { campaigns, sessions, updateSession } = useTrpgStore()
  const { characters } = useCharacterStore()
  const individualChars = characters.filter(c => c.type === 'individual' && c.name)

  const session = sessions.find(s => s.id === sessionId)
  const campaign = session ? campaigns.find(c => c.id === session.campaignId) : null

  const [rawHtml, setRawHtml] = useState('')
  const [parseMode, setParseMode] = useState(false)
  const [charFilter, setCharFilter] = useState(null) // null = 전체
  const [clearLogConfirm, setClearLogConfirm] = useState(false)

  // PL 캐릭터 관리
  const [plCharInput, setPlCharInput] = useState({ name: '', player: '' })
  const [showPlForm, setShowPlForm] = useState(false)

  // 비밀번호 잠금
  const [pwInput, setPwInput] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)

  // 세션 잠금 해제
  const [unlocked, setUnlocked] = useState(() => !session?.passwordHash)
  const [unlockInput, setUnlockInput] = useState('')
  const [unlockError, setUnlockError] = useState(false)

  // 비밀번호 저장
  const savePw = async () => {
    if (!pwInput.trim()) return
    if (pwInput !== pwConfirm) { alert('비밀번호가 일치하지 않습니다.'); return }
    const hash = await sha256(pwInput)
    updateSession(session.id, { passwordHash: hash })
    setPwInput(''); setPwConfirm('')
    setPwSuccess(true); setTimeout(() => setPwSuccess(false), 2000)
  }
  const removePw = () => { updateSession(session.id, { passwordHash: null }); setPwSuccess(false); setUnlocked(true) }

  const handleUnlock = async () => {
    const hash = await sha256(unlockInput)
    if (hash === session.passwordHash) { setUnlocked(true); setUnlockInput('') }
    else { setUnlockError(true); setTimeout(() => setUnlockError(false), 2000) }
  }

  // PL 캐릭터 추가
  const addPlChar = () => {
    if (!plCharInput.name) return
    const pl = [...(session.plCharacters || []), { id: genId(), ...plCharInput }]
    updateSession(session.id, { plCharacters: pl })
    setPlCharInput({ name: '', player: '' })
    setShowPlForm(false)
  }
  const removePlChar = (id) => {
    updateSession(session.id, { plCharacters: (session.plCharacters || []).filter(p => p.id !== id) })
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 text-center" style={{ color: 'var(--txs)' }}>
        <p>세션을 찾을 수 없습니다.</p>
        <button className="btn-ghost mt-4" onClick={() => navigate('/trpg')}>← TRPG 목록으로</button>
      </div>
    )
  }

  // 비밀번호 잠금 게이트
  if (session.passwordHash && !unlocked) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}>
            <Lock size={28} style={{ color: 'var(--accent)' }} />
          </div>
          <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--tx)' }}>비밀번호 보호</h2>
          <p className="text-sm" style={{ color: 'var(--txs)' }}>{session.title}</p>
        </div>
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type={showPw ? 'text' : 'password'}
              className="input flex-1"
              placeholder="비밀번호 입력"
              value={unlockInput}
              onChange={e => setUnlockInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUnlock()}
              style={unlockError ? { borderColor: '#e74c3c' } : {}}
              autoFocus
            />
            <button className="btn-ghost" onClick={() => setShowPw(v => !v)}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {unlockError && <p className="text-xs" style={{ color: '#e74c3c' }}>비밀번호가 틀렸습니다.</p>}
          <div className="flex gap-2 pt-1">
            <button className="btn-accent flex-1" onClick={handleUnlock}>확인</button>
            <button className="btn-ghost" onClick={() => navigate('/trpg')}>돌아가기</button>
          </div>
        </div>
      </div>
    )
  }

  // 로그에 등장하는 고유 캐릭터 목록
  const uniqueChars = [...new Set((session.log || []).map(e => e.character))].filter(Boolean)

  // 파싱 실행
  const handleParse = () => {
    if (!rawHtml.trim()) return
    const parsed = parseCcfoliaHtml(rawHtml)
    updateSession(session.id, { log: parsed })
    setRawHtml('')
    setParseMode(false)
  }

  // JSON 내보내기
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${session.title.replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // JSON 가져오기
  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (data.log) updateSession(session.id, { log: data.log })
      } catch { alert('JSON 파일을 읽을 수 없습니다.') }
    }
    reader.readAsText(file)
  }

  const filteredLog = charFilter
    ? (session.log || []).filter(e => e.character === charFilter)
    : (session.log || [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 animate-fade-in">
      {/* 상단 */}
      <div className="flex items-center justify-between mb-5">
        <button className="flex items-center gap-1 text-sm btn-ghost" onClick={() => navigate('/trpg')}>
          <ChevronLeft size={16} /> TRPG
        </button>
        {isAdmin && (
          <div className="flex gap-2">
            {/* JSON 내보내기 */}
            <button className="btn-ghost flex items-center gap-1.5 text-xs" onClick={handleExport}>
              <Download size={13} /> 내보내기
            </button>
            {/* JSON 가져오기 */}
            <label className="btn-ghost flex items-center gap-1.5 text-xs cursor-pointer">
              <Upload size={13} /> 가져오기
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
            {/* 로그 붙여넣기 토글 */}
            <button
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={parseMode
                ? { background: 'var(--accent)', color: 'var(--bg)' }
                : { border: '1px solid var(--border)', color: 'var(--txm)' }}
              onClick={() => setParseMode(v => !v)}
            >
              로그 붙여넣기
            </button>
          </div>
        )}
      </div>

      {/* 세션 정보 */}
      <div className="mb-5">
        <div className="text-xs mb-1" style={{ color: 'var(--txm)' }}>{campaign?.title || '캠페인'} · {campaign?.system || ''}</div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--tx)' }}>{session.title}</h1>
        <div className="text-xs mt-1" style={{ color: 'var(--txs)' }}>{session.date}</div>
        {session.summary && <p className="text-sm mt-2" style={{ color: 'var(--txm)' }}>{session.summary}</p>}
      </div>

      {/* PL 캐릭터 */}
      <div className="mb-5 p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users size={15} style={{ color: 'var(--accent)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--tx)' }}>PL 캐릭터</span>
          </div>
          {isAdmin && (
            <button className="btn-ghost flex items-center gap-1 text-xs" onClick={() => setShowPlForm(v => !v)}>
              <Plus size={13} /> {showPlForm ? '닫기' : '추가'}
            </button>
          )}
        </div>

        {/* 관리자 편집 UI */}
        {isAdmin && showPlForm && (
          <div className="mb-3 space-y-2 animate-slide-up">
            {/* 캐릭터 스토어에서 빠른 선택 */}
            {individualChars.length > 0 && (
              <div>
                <p className="text-xs mb-1.5" style={{ color: 'var(--txm)' }}>캐릭터에서 선택</p>
                <div className="flex flex-wrap gap-1.5">
                  {individualChars.map(c => {
                    const already = (session.plCharacters || []).some(p => p.name === c.name)
                    return (
                      <button
                        key={c.id}
                        className="px-2.5 py-1 rounded-full text-xs transition-all"
                        style={already
                          ? { background: 'var(--accent)', color: 'var(--bg)' }
                          : { border: '1px solid var(--border)', color: 'var(--txm)' }}
                        onClick={() => {
                          if (already) {
                            updateSession(session.id, { plCharacters: (session.plCharacters || []).filter(p => p.name !== c.name) })
                          } else {
                            updateSession(session.id, { plCharacters: [...(session.plCharacters || []), { id: genId(), name: c.name, player: '' }] })
                          }
                        }}
                      >
                        {already ? <Check size={11} className="inline mr-1" /> : null}{c.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            {/* 직접 입력 */}
            <div>
              <p className="text-xs mb-1.5" style={{ color: 'var(--txm)' }}>직접 입력</p>
              <div className="flex gap-2">
                <input className="input flex-1" placeholder="캐릭터명" value={plCharInput.name}
                  onChange={e => setPlCharInput(v => ({ ...v, name: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addPlChar()} />
                <input className="input flex-1" placeholder="플레이어명 (선택)" value={plCharInput.player}
                  onChange={e => setPlCharInput(v => ({ ...v, player: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addPlChar()} />
                <button className="btn-accent px-3 text-sm" onClick={addPlChar}>추가</button>
              </div>
            </div>
          </div>
        )}

        {/* 등록된 PL 캐릭터 목록 */}
        {(session.plCharacters || []).length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--txs)' }}>등록된 PL 캐릭터가 없습니다.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(session.plCharacters || []).map(p => (
              <div key={p.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <span className="font-medium" style={{ color: 'var(--tx)' }}>{p.name}</span>
                {p.player && <span style={{ color: 'var(--txs)' }}>/ {p.player}</span>}
                {isAdmin && <button className="ml-1" style={{ color: 'var(--txs)' }} onClick={() => removePlChar(p.id)}><X size={12} /></button>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 비밀번호 잠금 설정 — 관리자만 */}
      {isAdmin && (
        <div className="mb-5 p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Lock size={15} style={{ color: session.passwordHash ? 'var(--accent)' : 'var(--txm)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--tx)' }}>세션 잠금</span>
              {session.passwordHash && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}>설정됨</span>
              )}
            </div>
            {session.passwordHash && (
              <button className="btn-ghost flex items-center gap-1 text-xs" onClick={removePw}><X size={12} /> 잠금 해제</button>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type={showPw ? 'text' : 'password'}
              className="input flex-1"
              placeholder={session.passwordHash ? '새 비밀번호로 변경' : '비밀번호 설정'}
              value={pwInput}
              onChange={e => setPwInput(e.target.value)}
            />
            <input
              type={showPw ? 'text' : 'password'}
              className="input flex-1"
              placeholder="비밀번호 확인"
              value={pwConfirm}
              onChange={e => setPwConfirm(e.target.value)}
            />
            <button className="btn-ghost" onClick={() => setShowPw(v => !v)}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button className="btn-accent flex items-center gap-1 text-xs px-3" onClick={savePw}>
              {pwSuccess ? <Check size={14} /> : <Lock size={14} />}
              {pwSuccess ? '저장됨' : '저장'}
            </button>
          </div>
        </div>
      )}

      {/* CCFOLIA 로그 붙여넣기 영역 */}
      {parseMode && (
        <div className="p-4 rounded-xl mb-5 animate-slide-up" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium" style={{ color: 'var(--tx)' }}>CCFOLIA 백업 HTML 붙여넣기</span>
            <button onClick={() => setParseMode(false)} style={{ color: 'var(--txm)' }}><X size={16} /></button>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--txs)' }}>코코포리아 채팅 로그 백업 HTML 파일의 내용을 전체 복사해서 붙여넣어 주세요.</p>
          <textarea
            className="textarea mb-3"
            rows={8}
            value={rawHtml}
            onChange={e => setRawHtml(e.target.value)}
            placeholder="<html>...</html>"
            style={{ fontFamily: 'monospace', fontSize: '12px' }}
          />
          <div className="flex gap-2">
            <button className="btn-accent" onClick={handleParse}>파싱하기</button>
            {(session.log?.length > 0) && (
              <button className="btn-danger" onClick={() => setClearLogConfirm(true)}>로그 초기화</button>
            )}
          </div>
        </div>
      )}

      {/* 캐릭터 필터 */}
      {uniqueChars.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
            style={!charFilter
              ? { background: 'var(--accent)', color: 'var(--bg)' }
              : { border: '1px solid var(--border)', color: 'var(--txm)' }}
            onClick={() => setCharFilter(null)}
          >전체</button>
          {uniqueChars.map(name => (
            <button
              key={name}
              className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
              style={charFilter === name
                ? { background: 'var(--accent)', color: 'var(--bg)' }
                : { border: '1px solid var(--border)', color: 'var(--txm)' }}
              onClick={() => setCharFilter(name)}
            >{name}</button>
          ))}
        </div>
      )}

      {/* 로그 뷰어 */}
      {(session.log?.length || 0) === 0 ? (
        <div className="text-center py-20 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--txs)' }}>
          <p className="mb-3">저장된 로그가 없습니다.</p>
          <button className="btn-ghost text-sm" onClick={() => setParseMode(true)}>+ 로그 붙여넣기</button>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="px-4 py-2.5 text-xs font-medium flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)', color: 'var(--txm)' }}>
            <span>총 {filteredLog.length}줄{charFilter ? ` (${charFilter})` : ''}</span>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: '70vh' }}>
            {filteredLog.map(entry => (
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
          </div>
        </div>
      )}

      {/* 로그 초기화 확인 */}
      <ConfirmDialog
        isOpen={clearLogConfirm}
        message="로그를 초기화하시겠습니까? 삭제된 로그는 복구할 수 없습니다."
        confirmText="초기화"
        onConfirm={() => { updateSession(session.id, { log: [] }); setClearLogConfirm(false) }}
        onCancel={() => setClearLogConfirm(false)}
      />
    </div>
  )
}
