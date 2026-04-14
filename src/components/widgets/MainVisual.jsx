// 메인 비주얼 위젯 — 캐릭터 카드 / 아이돌 프로필 느낌의 메인 이미지 표시
// 설정에서 지정한 이미지를 IndexedDB에서 로드하여 표시

import { useState, useEffect } from 'react'
import { GripVertical, Star } from 'lucide-react'
import { getImage } from '../../lib/imageDB'
import useSettingsStore from '../../store/useSettingsStore'

export default function MainVisual() {
  const { mainVisualImageId, nickname, activityPeriod } = useSettingsStore()

  // IndexedDB에서 로드된 이미지 src 상태
  const [imageSrc, setImageSrc] = useState(null)

  // mainVisualImageId가 바뀌면 이미지 새로 로드
  useEffect(() => {
    if (!mainVisualImageId) {
      setImageSrc(null)
      return
    }
    getImage(mainVisualImageId).then(setImageSrc)
  }, [mainVisualImageId])

  return (
    <div className="widget animate-fade-in">
      {/* 위젯 헤더 */}
      <div className="widget-header">
        <GripVertical size={14} className="drag-handle" style={{ color: 'var(--txs)' }} />
        <span className="widget-header-dot" />
        MAIN VISUAL
      </div>

      {/* 위젯 본문 */}
      <div className="widget-body" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
        {/* 이미지 영역 */}
        <div
          className="relative flex items-center justify-center overflow-hidden"
          style={{ flex: '1 1 0', minHeight: 180, background: 'var(--elevated)' }}
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt="메인 비주얼"
              className="w-full h-full animate-fade-in"
              style={{ objectFit: 'cover', objectPosition: 'top center' }}
            />
          ) : (
            /* 이미지 없을 때 장식적 플레이스홀더 */
            <div
              className="flex flex-col items-center justify-center gap-3 w-full h-full"
              style={{ color: 'var(--txs)', minHeight: 180 }}
            >
              {/* 장식용 별 패턴 */}
              <div className="relative flex items-center justify-center">
                <Star
                  size={40}
                  strokeWidth={1}
                  style={{ color: 'var(--accent)', opacity: 0.4 }}
                />
                <Star
                  size={20}
                  strokeWidth={1}
                  className="absolute"
                  style={{
                    color: 'var(--accent2)',
                    opacity: 0.6,
                    top: -10,
                    right: -14,
                  }}
                />
                <Star
                  size={12}
                  strokeWidth={1}
                  className="absolute"
                  style={{
                    color: 'var(--accent)',
                    opacity: 0.3,
                    bottom: -8,
                    left: -12,
                  }}
                />
              </div>
              <span className="text-xs" style={{ color: 'var(--txs)' }}>
                이미지를 설정에서 업로드하세요
              </span>
            </div>
          )}

          {/* 이미지 위 그라디언트 오버레이 (하단에 텍스트 대비) */}
          {imageSrc && (
            <div
              className="absolute inset-x-0 bottom-0"
              style={{
                height: '40%',
                background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)',
                pointerEvents: 'none',
              }}
            />
          )}

          {/* 장식 닷 — 우상단 */}
          <div
            className="absolute top-2 right-2 flex gap-1"
            style={{ pointerEvents: 'none' }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="rounded-full"
                style={{
                  width: 4,
                  height: 4,
                  background: 'var(--accent)',
                  opacity: 0.3 + i * 0.2,
                }}
              />
            ))}
          </div>
        </div>

        {/* 프로필 텍스트 영역 */}
        <div
          className="flex flex-col items-center gap-1 py-3 px-4"
          style={{ background: 'var(--surface)' }}
        >
          {/* 닉네임 */}
          <span
            className="text-lg font-bold tracking-wider"
            style={{ color: 'var(--accent)' }}
          >
            {nickname || '닉네임'}
          </span>

          {/* 활동 기간 */}
          <span
            className="text-xs tracking-widest"
            style={{ color: 'var(--txs)' }}
          >
            {activityPeriod || '—'}
          </span>

          {/* 장식 구분선 */}
          <div
            className="flex items-center gap-2 mt-1"
            style={{ width: '60%' }}
          >
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <Star size={8} style={{ color: 'var(--accent2)', opacity: 0.7 }} />
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
