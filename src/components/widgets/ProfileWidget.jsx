// 프로필 위젯 — 닉네임, 활동 기간, 각종 콘텐츠 통계 표시
// mainVisual 이미지가 설정된 경우 아바타 자리에 표시

import { useState, useEffect, useMemo } from 'react'
import { GripVertical } from 'lucide-react'
import { getImage } from '../../lib/imageDB'
import useSettingsStore from '../../store/useSettingsStore'
import useCharacterStore from '../../store/useCharacterStore'
import useGalleryStore from '../../store/useGalleryStore'
import useWritingStore from '../../store/useWritingStore'
import useTrpgStore from '../../store/useTrpgStore'

export default function ProfileWidget() {
  const { nickname, activityPeriod, bio, mainVisualImageId } = useSettingsStore()
  const { characters } = useCharacterStore()
  const { posts } = useGalleryStore()
  const { writings } = useWritingStore()
  const { sessions } = useTrpgStore()

  const [avatarSrc, setAvatarSrc] = useState(null)

  useEffect(() => {
    if (!mainVisualImageId) { setAvatarSrc(null); return }
    getImage(mainVisualImageId).then(setAvatarSrc)
  }, [mainVisualImageId])

  const stats = useMemo(() => [
    { label: '캐릭터', value: characters.filter((c) => c.type === 'individual').length, unit: '명' },
    { label: '그림',   value: posts.length,              unit: '개' },
    { label: '글',     value: writings.length,           unit: '편' },
    { label: 'TRPG',  value: (sessions || []).length,   unit: '회' },
  ], [characters, posts, writings, sessions])

  return (
    <div className="widget animate-fade-in">
      {/* 위젯 헤더 */}
      <div className="widget-header">
        <GripVertical size={14} className="drag-handle" style={{ color: 'var(--txs)' }} />
        <span className="widget-header-dot" />
        PROFILE
      </div>

      {/* 위젯 본문 */}
      <div className="widget-body">
        {/* 아바타 + 닉네임 */}
        <div className="flex flex-col items-center gap-1 pb-3 mb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          {/* 아바타 */}
          <div
            className="rounded-full overflow-hidden mb-1 shrink-0"
            style={{
              width: 56,
              height: 56,
              background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
              border: '2px solid color-mix(in srgb, var(--accent) 30%, transparent)',
            }}
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt={nickname} className="w-full h-full" style={{ objectFit: 'cover', objectPosition: 'top center' }} />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-lg font-bold" style={{ color: 'var(--accent)' }}>
                {nickname ? nickname.charAt(0) : '?'}
              </div>
            )}
          </div>

          {/* 닉네임 */}
          <span className="text-base font-bold tracking-wide" style={{ color: 'var(--accent)' }}>
            {nickname || '닉네임'}
          </span>

          {/* 활동 기간 */}
          {activityPeriod && (
            <span className="text-xs tracking-widest" style={{ color: 'var(--txs)' }}>
              {activityPeriod}
            </span>
          )}
          {/* 한 줄 소개 */}
          {bio && (
            <span className="text-xs text-center leading-relaxed mt-0.5" style={{ color: 'var(--txm)', fontStyle: 'italic' }}>
              {bio}
            </span>
          )}
        </div>

        {/* 통계 그리드 */}
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          {stats.map(({ label, value, unit }) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center rounded-lg py-2.5"
              style={{ background: 'var(--elevated)' }}
            >
              <span className="text-xl font-bold tabular-nums leading-none" style={{ color: 'var(--accent)' }}>
                {value}
                <span className="text-xs font-normal ml-0.5" style={{ color: 'var(--txm)' }}>{unit}</span>
              </span>
              <span className="text-xs mt-1" style={{ color: 'var(--txs)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
