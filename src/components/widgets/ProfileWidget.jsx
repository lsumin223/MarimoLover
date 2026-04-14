// 프로필 위젯 — 닉네임, 활동 기간, 각종 콘텐츠 통계 표시

import { useMemo } from 'react'
import { GripVertical } from 'lucide-react'
import useSettingsStore from '../../store/useSettingsStore'
import useCharacterStore from '../../store/useCharacterStore'
import useGalleryStore from '../../store/useGalleryStore'
import useWritingStore from '../../store/useWritingStore'
import useTrpgStore from '../../store/useTrpgStore'

export default function ProfileWidget() {
  const { nickname, activityPeriod } = useSettingsStore()
  const { characters } = useCharacterStore()
  const { posts } = useGalleryStore()
  const { writings } = useWritingStore()
  const { sessions } = useTrpgStore()

  // 각 콘텐츠 수 계산
  const stats = useMemo(() => [
    {
      label: '캐릭터',
      value: characters.filter((c) => c.type === 'individual').length,
      unit: '명',
    },
    {
      label: '그림',
      value: posts.length,
      unit: '개',
    },
    {
      label: '글',
      value: writings.length,
      unit: '편',
    },
    {
      label: 'TRPG',
      value: (sessions || []).length,
      unit: '회',
    },
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
        {/* 닉네임 */}
        <div className="flex flex-col items-center gap-1 pb-3 mb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          {/* 장식 아바타 영역 */}
          <div
            className="flex items-center justify-center rounded-full mb-1"
            style={{
              width: 48,
              height: 48,
              background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
              border: '2px solid color-mix(in srgb, var(--accent) 30%, transparent)',
            }}
          >
            <span
              className="text-lg font-bold"
              style={{ color: 'var(--accent)' }}
            >
              {nickname ? nickname.charAt(0) : '?'}
            </span>
          </div>

          {/* 닉네임 텍스트 */}
          <span
            className="text-base font-bold tracking-wide"
            style={{ color: 'var(--accent)' }}
          >
            {nickname || '닉네임'}
          </span>

          {/* 활동 기간 */}
          {activityPeriod && (
            <span
              className="text-xs tracking-widest"
              style={{ color: 'var(--txs)' }}
            >
              {activityPeriod}
            </span>
          )}
        </div>

        {/* 통계 그리드 */}
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}
        >
          {stats.map(({ label, value, unit }) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center rounded-lg py-2.5"
              style={{ background: 'var(--elevated)' }}
            >
              {/* 숫자 */}
              <span
                className="text-xl font-bold tabular-nums leading-none"
                style={{ color: 'var(--accent)' }}
              >
                {value}
                <span
                  className="text-xs font-normal ml-0.5"
                  style={{ color: 'var(--txm)' }}
                >
                  {unit}
                </span>
              </span>
              {/* 라벨 */}
              <span
                className="text-xs mt-1"
                style={{ color: 'var(--txs)' }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
