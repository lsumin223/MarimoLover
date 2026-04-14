// 이미지 슬라이더 컴포넌트
// IndexedDB에서 비동기로 이미지를 로드하여 슬라이드로 보여줌
// 이미지가 여러 장이면 좌우 화살표와 하단 닷 인디케이터 표시

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Image } from 'lucide-react'
import { getImage } from '../../lib/imageDB'

export default function ImageSlider({ imageIds = [], className = '' }) {
  // 현재 슬라이드 인덱스
  const [currentIndex, setCurrentIndex] = useState(0)
  // id별로 로드된 src 저장 (key: imageId, value: base64 or null)
  const [loadedImages, setLoadedImages] = useState({})

  // imageIds가 바뀌면 인덱스 초기화
  useEffect(() => {
    setCurrentIndex(0)
  }, [imageIds])

  // 필요한 이미지를 IndexedDB에서 로드
  useEffect(() => {
    if (!imageIds || imageIds.length === 0) return

    imageIds.forEach((id) => {
      if (!id) return
      // 이미 로드된 이미지는 다시 불러오지 않음
      if (loadedImages[id] !== undefined) return

      getImage(id).then((src) => {
        setLoadedImages((prev) => ({ ...prev, [id]: src }))
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageIds])

  const validIds = imageIds.filter(Boolean)
  const total = validIds.length

  // 이전/다음 슬라이드
  const goPrev = (e) => {
    e.stopPropagation()
    setCurrentIndex((i) => (i - 1 + total) % total)
  }
  const goNext = (e) => {
    e.stopPropagation()
    setCurrentIndex((i) => (i + 1) % total)
  }

  // 이미지가 없거나 아직 로드 중인 경우 플레이스홀더 표시
  if (total === 0) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg ${className}`}
        style={{
          background: 'var(--elevated)',
          border: '1px solid var(--border)',
          minHeight: 160,
        }}
      >
        <div className="flex flex-col items-center gap-2" style={{ color: 'var(--txs)' }}>
          <Image size={32} strokeWidth={1.5} />
          <span className="text-xs">이미지 없음</span>
        </div>
      </div>
    )
  }

  const currentId = validIds[currentIndex]
  const currentSrc = loadedImages[currentId]

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-lg ${className}`}
      style={{
        background: 'var(--elevated)',
        border: '1px solid var(--border)',
        minHeight: 160,
      }}
    >
      {/* 이미지 영역 */}
      {currentSrc ? (
        <img
          key={currentId}
          src={currentSrc}
          alt={`슬라이드 ${currentIndex + 1}`}
          className="w-full h-full animate-fade-in"
          style={{ objectFit: 'contain', maxHeight: '100%' }}
        />
      ) : (
        /* 로딩 중 플레이스홀더 */
        <div
          className="flex items-center justify-center w-full h-full"
          style={{ minHeight: 160, color: 'var(--txs)' }}
        >
          <Image size={28} strokeWidth={1.5} />
        </div>
      )}

      {/* 여러 장일 때만 네비게이션 표시 */}
      {total > 1 && (
        <>
          {/* 왼쪽 화살표 */}
          <button
            className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full transition-all"
            style={{ background: 'rgba(0,0,0,0.45)', color: '#fff' }}
            onClick={goPrev}
            aria-label="이전 이미지"
          >
            <ChevronLeft size={16} />
          </button>

          {/* 오른쪽 화살표 */}
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full transition-all"
            style={{ background: 'rgba(0,0,0,0.45)', color: '#fff' }}
            onClick={goNext}
            aria-label="다음 이미지"
          >
            <ChevronRight size={16} />
          </button>

          {/* 하단 닷 인디케이터 */}
          <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1.5">
            {validIds.map((_, i) => (
              <button
                key={i}
                className="rounded-full transition-all"
                style={{
                  width: i === currentIndex ? 16 : 6,
                  height: 6,
                  background: i === currentIndex ? 'var(--accent)' : 'rgba(255,255,255,0.4)',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentIndex(i)
                }}
                aria-label={`${i + 1}번째 이미지로 이동`}
              />
            ))}
          </div>

          {/* 슬라이드 카운터 */}
          <div
            className="absolute top-2 right-2 text-xs px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}
          >
            {currentIndex + 1} / {total}
          </div>
        </>
      )}
    </div>
  )
}
