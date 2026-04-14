// TRPG 세션 상세 — 로그 파싱/뷰어/내보내기
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Download, Upload, X } from 'lucide-react'
import useTrpgStore from '../store/useTrpgStore'
import ConfirmDialog from '../components/common/ConfirmDialog'

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
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { campaigns, sessions, updateSession } = useTrpgStore()

  const session = sessions.find(s => s.id === sessionId)
  const campaign = session ? campaigns.find(c => c.id === session.campaignId) : null

  const [rawHtml, setRawHtml] = useState('')
  const [parseMode, setParseMode] = useState(false)
  const [charFilter, setCharFilter] = useState(null) // null = 전체
  const [clearLogConfirm, setClearLogConfirm] = useState(false)

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 text-center" style={{ color: 'var(--txs)' }}>
        <p>세션을 찾을 수 없습니다.</p>
        <button className="btn-ghost mt-4" onClick={() => navigate('/trpg')}>← TRPG 목록으로</button>
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
      </div>

      {/* 세션 정보 */}
      <div className="mb-5">
        <div className="text-xs mb-1" style={{ color: 'var(--txm)' }}>{campaign?.title || '캠페인'} · {campaign?.system || ''}</div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--tx)' }}>{session.title}</h1>
        <div className="text-xs mt-1" style={{ color: 'var(--txs)' }}>{session.date}</div>
        {session.summary && <p className="text-sm mt-2" style={{ color: 'var(--txm)' }}>{session.summary}</p>}
      </div>

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
