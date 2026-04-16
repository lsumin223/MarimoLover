// 캐릭터 카드 위젯 — 최근 생성된 individual 타입 캐릭터 3명 표시
// 썸네일은 IndexedDB에서 비동기 로드, 없으면 이름 이니셜 표시

import { useState, useEffect, useMemo } from 'react'
import { GripVertical, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getImage } from '../../lib/imageDB'
import useCharacterStore from '../../store/useCharacterStore'

// 단일 캐릭터 썸네일 컴포넌트 — IndexedDB에서 이미지 로드
function CharacterThumb({ thumbnailImageId, name }) {
  const [src, setSrc] = useState(null)

  useEffect(() => {
    if (!thumbnailImageId) { setSrc(null); return }
    getImage(thumbnailImageId).then(setSrc)
  }, [thumbnailImageId])

  const initial = name ? name.charAt(0) : '?'

  return (
    <div
      className="relative rounded-full overflow-hidden shrink-0"
      style={{ width: 40, height: 40, background: 'var(--elevated)', border: '2px solid var(--border)' }}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full" style={{ objectFit: 'cover' }} />
      ) : (
        <div className="flex items-center justify-center w-full h-full text-sm font-bold" style={{ color: 'var(--accent)' }}>
          {initial}
        </div>
      )}
    </div>
  )
}

export default function CharacterCardWidget() {
  const { characters } = useCharacterStore()
  const navigate = useNavigate()

  // individual 타입 캐릭터만 필터링, 최근 생성 순으로 3명
  const recentChars = useMemo(() => {
    return [...characters]
      .filter((c) => c.type === 'individual')
      .sort((a, b) => ((a.createdAt || '') < (b.createdAt || '') ? 1 : -1))
      .slice(0, 3)
  }, [characters])

  return (
    <div className="widget animate-fade-in">
      {/* 위젯 헤더 */}
      <div className="widget-header">
        <GripVertical size={14} className="drag-handle" style={{ color: 'var(--txs)' }} />
        <span className="widget-header-dot" />
        CHARACTERS
        <button
          className="ml-auto text-xs transition-colors"
          style={{ color: 'var(--txs)', background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => navigate('/characters')}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--txs)')}
        >
          전체 보기
        </button>
      </div>

      {/* 위젯 본문 */}
      <div className="widget-body" style={{ padding: '8px 0' }}>
        {recentChars.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-5" style={{ color: 'var(--txs)' }}>
            <Users size={24} strokeWidth={1.5} />
            <span className="text-xs">캐릭터가 없습니다</span>
          </div>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {recentChars.map((char) => (
              <li key={char.id}>
                <button
                  className="w-full flex items-center gap-3 px-3 py-2 text-left transition-colors"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                  onClick={() => navigate('/characters')}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--elevated)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <CharacterThumb thumbnailImageId={char.thumbnailImageId} name={char.name} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-medium truncate" style={{ color: 'var(--tx)' }}>
                      {char.name || '(이름 없음)'}
                    </span>
                    {char.bio && (
                      <span className="text-xs truncate mt-0.5" style={{ color: 'var(--txs)' }}>
                        {char.bio}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
