// TRPG 세션 뷰어 — 세션 기록 읽기 + 로그 뷰어 + 관리자 도구
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Download, Trash2,
  Lock, Eye, EyeOff, Users, Edit2,
} from 'lucide-react'
import useTrpgStore from '../store/useTrpgStore'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { useIsAdmin } from '../store/useAdminStore'

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function TrpgSession() {
  const isAdmin = useIsAdmin()
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { campaigns, sessions, deleteSession } = useTrpgStore()

  const session = sessions.find(s => s.id === sessionId)
  const campaign = session ? campaigns.find(c => c.id === session.campaignId) : null

  // 캐릭터 필터
  const [charFilter, setCharFilter] = useState(null)

  // 잠금 해제
  const [unlocked, setUnlocked] = useState(() => !session?.passwordHash)
  const [unlockInput, setUnlockInput] = useState('')
  const [unlockError, setUnlockError] = useState(false)
  const [showPw, setShowPw] = useState(false)

  // 삭제 확인
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const handleUnlock = async () => {
    const hash = await sha256(unlockInput)
    if (hash === session.passwordHash) { setUnlocked(true); setUnlockInput('') }
    else { setUnlockError(true); setTimeout(() => setUnlockError(false), 2000) }
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${session.title.replace(/\s+/g, '_')}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  // — 세션 없음
  if (!session) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 text-center" style={{ color: 'var(--txs)' }}>
        <p>세션을 찾을 수 없습니다.</p>
        <button className="btn-ghost mt-4" onClick={() => navigate('/trpg')}>← TRPG 목록으로</button>
      </div>
    )
  }

  // — 비밀번호 잠금 게이트
  if (session.passwordHash && !unlocked) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}>
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

  const uniqueChars = [...new Set((session.log || []).map(e => e.character))].filter(Boolean)
  const filteredLog = charFilter
    ? (session.log || []).filter(e => e.character === charFilter)
    : (session.log || [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 animate-fade-in">

      {/* 상단 내비게이션 + 관리자 툴바 */}
      <div className="flex items-center justify-between mb-6">
        <button className="flex items-center gap-1 text-sm btn-ghost" onClick={() => navigate('/trpg')}>
          <ChevronLeft size={16} /> TRPG
        </button>
        {isAdmin && (
          <div className="flex gap-2 flex-wrap justify-end">
            <button className="btn-ghost flex items-center gap-1.5 text-xs" onClick={handleExport}>
              <Download size={13} /> 내보내기
            </button>
            <button className="btn-ghost flex items-center gap-1.5 text-xs"
              onClick={() => navigate(`/trpg/${sessionId}/edit`)}>
              <Edit2 size={13} /> 수정
            </button>
            <button className="btn-danger flex items-center gap-1.5 text-xs"
              onClick={() => setDeleteConfirm(true)}>
              <Trash2 size={13} /> 삭제
            </button>
          </div>
        )}
      </div>

      {/* 세션 정보 — 게시글 헤더 */}
      <div className="mb-6">
        <div className="text-xs mb-2 font-medium" style={{ color: 'var(--accent)' }}>
          {campaign?.title || '캠페인'}{campaign?.system ? ` · ${campaign.system}` : ''}
        </div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--tx)' }}>{session.title}</h1>
        <div className="text-sm" style={{ color: 'var(--txs)' }}>{session.date}</div>
      </div>

      {/* PL 캐릭터 표시 (읽기 전용) */}
      {(session.plCharacters || []).length > 0 && (
        <div className="mb-5 p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Users size={14} style={{ color: 'var(--accent)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--tx)' }}>PL 캐릭터</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(session.plCharacters || []).map(p => (
              <div key={p.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <span className="font-medium" style={{ color: 'var(--tx)' }}>{p.name}</span>
                {p.player && <span style={{ color: 'var(--txs)' }}>/ {p.player}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 세션 기록 / 요약 본문 */}
      {session.summary && (
        <div className="mb-6 p-5 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p style={{
            color: 'var(--tx)',
            fontFamily: 'Noto Serif KR, serif',
            fontSize: '15px',
            lineHeight: '2',
            letterSpacing: '0.02em',
            whiteSpace: 'pre-wrap',
          }}>{session.summary}</p>
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
            onClick={() => setCharFilter(null)}>전체</button>
          {uniqueChars.map(name => (
            <button key={name}
              className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
              style={charFilter === name
                ? { background: 'var(--accent)', color: 'var(--bg)' }
                : { border: '1px solid var(--border)', color: 'var(--txm)' }}
              onClick={() => setCharFilter(name)}>{name}</button>
          ))}
        </div>
      )}

      {/* 로그 뷰어 */}
      {(session.log?.length || 0) === 0 ? (
        <div className="text-center py-20 rounded-xl"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--txs)' }}>
          <p className="mb-3">저장된 로그가 없습니다.</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="px-4 py-2.5 text-xs font-medium"
            style={{ borderBottom: '1px solid var(--border)', color: 'var(--txm)' }}>
            총 {filteredLog.length}줄{charFilter ? ` (${charFilter})` : ''}
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

      {/* 세션 삭제 확인 */}
      <ConfirmDialog
        isOpen={deleteConfirm}
        message={`"${session.title}" 세션을 삭제하시겠습니까?`}
        confirmText="삭제"
        onConfirm={() => { deleteSession(session.id); navigate('/trpg') }}
        onCancel={() => setDeleteConfirm(false)}
      />
    </div>
  )
}
