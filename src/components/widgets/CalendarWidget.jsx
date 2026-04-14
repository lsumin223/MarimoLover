// 캘린더 위젯 — 현재 월 달력을 표시하고 갤러리/글 작성일을 마킹
// 갤러리 포스트와 글의 날짜를 수집하여 해당 날에 닷 표시

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react'
import useGalleryStore from '../../store/useGalleryStore'
import useWritingStore from '../../store/useWritingStore'

// 요일 헤더 (일~토)
const DAY_HEADERS = ['일', '월', '화', '수', '목', '금', '토']

export default function CalendarWidget() {
  const { posts } = useGalleryStore()
  const { writings } = useWritingStore()

  // 현재 표시 중인 연/월 (기본: 오늘)
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth()) // 0-indexed

  // 이전 달로 이동
  const goPrev = () => {
    if (month === 0) {
      setYear((y) => y - 1)
      setMonth(11)
    } else {
      setMonth((m) => m - 1)
    }
  }

  // 다음 달로 이동
  const goNext = () => {
    if (month === 11) {
      setYear((y) => y + 1)
      setMonth(0)
    } else {
      setMonth((m) => m + 1)
    }
  }

  // 콘텐츠가 있는 날짜를 Set으로 수집 (YYYY-MM-DD 형식)
  const contentDates = useMemo(() => {
    const dates = new Set()

    // 갤러리 포스트 날짜 수집
    posts.forEach((post) => {
      const d = post.date || post.createdAt
      if (d) dates.add(d.slice(0, 10))
    })

    // 글 날짜 수집
    writings.forEach((w) => {
      const d = w.date || w.createdAt
      if (d) dates.add(d.slice(0, 10))
    })

    return dates
  }, [posts, writings])

  // 해당 달의 첫날 요일과 총 일수 계산
  const firstDayOfWeek = new Date(year, month, 1).getDay() // 0=일, 6=토
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // 오늘 날짜 문자열 (비교용)
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  // 달력 셀 배열 생성 (앞 빈칸 + 날짜)
  const cells = useMemo(() => {
    const arr = []
    // 첫날 앞 빈칸
    for (let i = 0; i < firstDayOfWeek; i++) {
      arr.push(null)
    }
    // 날짜 채우기
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push(d)
    }
    return arr
  }, [firstDayOfWeek, daysInMonth])

  // 날짜 -> YYYY-MM-DD 문자열 변환
  const toDateStr = (day) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  return (
    <div className="widget animate-fade-in">
      {/* 위젯 헤더 */}
      <div className="widget-header">
        <GripVertical size={14} className="drag-handle" style={{ color: 'var(--txs)' }} />
        <span className="widget-header-dot" />
        CALENDAR
        {/* 월 이동 버튼 — 헤더 오른쪽 */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            className="flex items-center justify-center w-5 h-5 rounded transition-colors"
            style={{ color: 'var(--txs)' }}
            onClick={goPrev}
            aria-label="이전 달"
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--tx)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--txs)')}
          >
            <ChevronLeft size={12} />
          </button>
          <span
            className="text-xs font-medium tabular-nums"
            style={{ color: 'var(--txm)', minWidth: 58, textAlign: 'center' }}
          >
            {year}. {String(month + 1).padStart(2, '0')}
          </span>
          <button
            className="flex items-center justify-center w-5 h-5 rounded transition-colors"
            style={{ color: 'var(--txs)' }}
            onClick={goNext}
            aria-label="다음 달"
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--tx)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--txs)')}
          >
            <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* 달력 본문 */}
      <div className="widget-body">
        {/* 요일 헤더 */}
        <div className="calendar-grid mb-1">
          {DAY_HEADERS.map((day, i) => (
            <div
              key={day}
              className="calendar-day"
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: i === 0
                  ? 'var(--accent2)'
                  : i === 6
                  ? 'var(--accent)'
                  : 'var(--txs)',
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="calendar-grid">
          {cells.map((day, idx) => {
            if (day === null) {
              // 빈 칸
              return <div key={`empty-${idx}`} className="calendar-day" />
            }

            const dateStr = toDateStr(day)
            const isToday = dateStr === todayStr
            const hasContent = contentDates.has(dateStr)
            const colIndex = idx % 7

            // 요일별 색상
            let textColor = 'var(--txm)'
            if (colIndex === 0) textColor = 'var(--accent2)' // 일요일
            if (colIndex === 6) textColor = 'var(--accent)'  // 토요일
            if (isToday) textColor = 'var(--bg)'             // 오늘은 배경색

            return (
              <div
                key={day}
                className={[
                  'calendar-day',
                  isToday ? 'today' : '',
                  hasContent && !isToday ? 'has-content' : '',
                ].join(' ')}
                style={{ color: textColor }}
              >
                {day}
              </div>
            )
          })}
        </div>

        {/* 범례 */}
        <div className="flex items-center gap-3 mt-3" style={{ color: 'var(--txs)' }}>
          <div className="flex items-center gap-1">
            <span
              className="rounded-full"
              style={{ width: 6, height: 6, background: 'var(--accent)', display: 'inline-block' }}
            />
            <span style={{ fontSize: 9 }}>오늘</span>
          </div>
          <div className="flex items-center gap-1">
            <span
              className="rounded-full"
              style={{ width: 4, height: 4, background: 'var(--accent2)', display: 'inline-block' }}
            />
            <span style={{ fontSize: 9 }}>콘텐츠 있음</span>
          </div>
        </div>
      </div>
    </div>
  )
}
