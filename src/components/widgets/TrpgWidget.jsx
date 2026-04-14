// TRPG 위젯 — 최근 5개의 TRPG 세션을 표시
// 세션 제목, 캠페인명, 날짜를 보여주고 클릭 시 /trpg로 이동

import { useMemo } from 'react'
import { GripVertical, Gamepad2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useTrpgStore from '../../store/useTrpgStore'

export default function TrpgWidget() {
  const { sessions, campaigns } = useTrpgStore()
  const navigate = useNavigate()

  // 캠페인 id -> 이름 매핑
  const campaignMap = useMemo(() => {
    if (!campaigns) return {}
    const map = {}
    campaigns.forEach((c) => {
      map[c.id] = c.title || c.name || '(캠페인 없음)'
    })
    return map
  }, [campaigns])

  // 날짜 내림차순 정렬 후 상위 5개
  const recentSessions = useMemo(() => {
    return [...(sessions || [])]
      .sort((a, b) => {
        const da = a.date || a.createdAt || ''
        const db = b.date || b.createdAt || ''
        return da < db ? 1 : -1
      })
      .slice(0, 5)
  }, [sessions])

  return (
    <div className="widget animate-fade-in">
      {/* 위젯 헤더 */}
      <div className="widget-header">
        <GripVertical size={14} className="drag-handle" style={{ color: 'var(--txs)' }} />
        <span className="widget-header-dot" />
        TRPG LOG
        {/* TRPG 페이지로 이동 버튼 */}
        <button
          className="ml-auto text-xs transition-colors"
          style={{ color: 'var(--txs)', background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => navigate('/trpg')}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--txs)')}
        >
          더 보기
        </button>
      </div>

      {/* 위젯 본문 */}
      <div className="widget-body" style={{ padding: '8px 0' }}>
        {recentSessions.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-2 py-5"
            style={{ color: 'var(--txs)' }}
          >
            <Gamepad2 size={24} strokeWidth={1.5} />
            <span className="text-xs">세션 기록이 없습니다</span>
          </div>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {recentSessions.map((session) => {
              const campaignName = session.campaignId
                ? campaignMap[session.campaignId]
                : null
              const date = (session.date || session.createdAt || '').slice(0, 10)

              return (
                <li key={session.id}>
                  <button
                    className="w-full flex items-start gap-2 px-3 py-2 text-left transition-colors"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                    onClick={() => navigate('/trpg')}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'var(--elevated)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'transparent')
                    }
                  >
                    {/* 세션 번호 뱃지 */}
                    <span
                      className="shrink-0 flex items-center justify-center rounded text-xs font-mono font-medium mt-0.5"
                      style={{
                        width: 22,
                        height: 22,
                        background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                        color: 'var(--accent)',
                        fontSize: 10,
                      }}
                    >
                      {session.sessionNumber ?? '#'}
                    </span>

                    {/* 세션 정보 */}
                    <div className="flex flex-col min-w-0 flex-1">
                      {/* 세션 제목 */}
                      <span
                        className="text-xs font-medium truncate"
                        style={{ color: 'var(--tx)' }}
                      >
                        {session.title || '(제목 없음)'}
                      </span>

                      {/* 캠페인명 + 날짜 */}
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {campaignName && (
                          <span
                            className="text-xs truncate"
                            style={{ color: 'var(--txs)', maxWidth: 90 }}
                          >
                            {campaignName}
                          </span>
                        )}
                        {campaignName && date && (
                          <span style={{ color: 'var(--txs)', fontSize: 10 }}>·</span>
                        )}
                        {date && (
                          <span
                            className="text-xs tabular-nums shrink-0"
                            style={{ color: 'var(--txs)' }}
                          >
                            {date}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
