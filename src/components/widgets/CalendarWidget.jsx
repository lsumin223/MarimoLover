// 캘린더 위젯 — 달력 표시 + 날짜 클릭 시 메모/일정 추가
import { useState, useMemo, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, GripVertical, Plus, X, Check } from 'lucide-react'
import useGalleryStore from '../../store/useGalleryStore'
import useWritingStore from '../../store/useWritingStore'
import useCalendarStore from '../../store/useCalendarStore'

const DAY_HEADERS = ['일', '월', '화', '수', '목', '금', '토']

export default function CalendarWidget() {
  const { posts } = useGalleryStore()
  const { writings } = useWritingStore()
  const { events, addEvent, deleteEvent } = useCalendarStore()

  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(null) // 'YYYY-MM-DD' | null
  const [newText, setNewText] = useState('')
  const inputRef = useRef(null)

  const goPrev = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) } else { setMonth(m => m - 1) }
    setSelectedDate(null)
  }
  const goNext = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) } else { setMonth(m => m + 1) }
    setSelectedDate(null)
  }

  // 콘텐츠 날짜 (갤러리 + 글)
  const contentDates = useMemo(() => {
    const dates = new Set()
    posts.forEach(p => { const d = p.date || p.createdAt; if (d) dates.add(d.slice(0, 10)) })
    writings.forEach(w => { const d = w.date || w.createdAt; if (d) dates.add(d.slice(0, 10)) })
    return dates
  }, [posts, writings])

  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const cells = useMemo(() => {
    const arr = []
    for (let i = 0; i < firstDayOfWeek; i++) arr.push(null)
    for (let d = 1; d <= daysInMonth; d++) arr.push(d)
    return arr
  }, [firstDayOfWeek, daysInMonth])

  const toDateStr = (day) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const handleDateClick = (day) => {
    const ds = toDateStr(day)
    setSelectedDate(prev => prev === ds ? null : ds)
    setNewText('')
  }

  const handleAddEvent = () => {
    if (!newText.trim() || !selectedDate) return
    addEvent(selectedDate, newText.trim())
    setNewText('')
    inputRef.current?.focus()
  }

  // 선택된 날짜의 일정
  const selectedEvents = selectedDate ? (events[selectedDate] || []) : []
  // 일정 있는 날짜들 (event dots)
  const eventDateSet = useMemo(() => new Set(Object.keys(events)), [events])

  return (
    <div className="widget animate-fade-in">
      <div className="widget-header">
        <GripVertical size={14} className="drag-handle" style={{ color: 'var(--txs)' }} />
        <span className="widget-header-dot" />
        CALENDAR
        <div className="flex items-center gap-1 ml-auto">
          <button className="flex items-center justify-center w-5 h-5 rounded transition-colors"
            style={{ color: 'var(--txs)' }} onClick={goPrev} aria-label="이전 달"
            onMouseEnter={e => e.currentTarget.style.color = 'var(--tx)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--txs)'}>
            <ChevronLeft size={12} />
          </button>
          <span className="text-xs font-medium tabular-nums"
            style={{ color: 'var(--txm)', minWidth: 58, textAlign: 'center' }}>
            {year}. {String(month + 1).padStart(2, '0')}
          </span>
          <button className="flex items-center justify-center w-5 h-5 rounded transition-colors"
            style={{ color: 'var(--txs)' }} onClick={goNext} aria-label="다음 달"
            onMouseEnter={e => e.currentTarget.style.color = 'var(--tx)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--txs)'}>
            <ChevronRight size={12} />
          </button>
        </div>
      </div>

      <div className="widget-body">
        {/* 요일 헤더 */}
        <div className="calendar-grid mb-1">
          {DAY_HEADERS.map((day, i) => (
            <div key={day} className="calendar-day" style={{
              fontSize: 10, fontWeight: 600,
              color: i === 0 ? 'var(--accent2)' : i === 6 ? 'var(--accent)' : 'var(--txs)',
            }}>{day}</div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="calendar-grid">
          {cells.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} className="calendar-day" />
            const dateStr = toDateStr(day)
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selectedDate
            const hasContent = contentDates.has(dateStr)
            const hasEvent = eventDateSet.has(dateStr)
            const colIndex = idx % 7

            let textColor = 'var(--txm)'
            if (colIndex === 0) textColor = 'var(--accent2)'
            if (colIndex === 6) textColor = 'var(--accent)'
            if (isToday || isSelected) textColor = 'var(--bg)'

            return (
              <div key={day} onClick={() => handleDateClick(day)}
                className={['calendar-day', isToday ? 'today' : '', hasContent && !isToday && !isSelected ? 'has-content' : ''].join(' ')}
                style={{
                  color: textColor,
                  cursor: 'pointer',
                  background: isSelected && !isToday ? 'var(--accent2)' : undefined,
                  borderRadius: isSelected && !isToday ? '50%' : undefined,
                  position: 'relative',
                }}>
                {day}
                {hasEvent && !isToday && !isSelected && (
                  <span style={{ position: 'absolute', bottom: 1, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: 'var(--accent)' }} />
                )}
              </div>
            )
          })}
        </div>

        {/* 선택 날짜 일정 패널 */}
        {selectedDate && (
          <div className="mt-3 pt-3 animate-slide-up" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: 'var(--tx)' }}>{selectedDate}</span>
              <button onClick={() => setSelectedDate(null)} style={{ color: 'var(--txs)' }}><X size={12} /></button>
            </div>

            {/* 일정 목록 */}
            <div className="space-y-1 mb-2">
              {selectedEvents.length === 0 ? (
                <p className="text-xs" style={{ color: 'var(--txs)' }}>일정이 없습니다.</p>
              ) : selectedEvents.map(ev => (
                <div key={ev.id} className="flex items-start gap-1.5 group">
                  <span className="text-xs flex-1 leading-relaxed" style={{ color: 'var(--txm)' }}>{ev.text}</span>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5"
                    style={{ color: 'var(--txs)' }} onClick={() => deleteEvent(selectedDate, ev.id)}>
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>

            {/* 일정 추가 입력 */}
            <div className="flex gap-1">
              <input ref={inputRef} className="input flex-1 text-xs py-1 px-2"
                placeholder="일정 추가..." value={newText}
                onChange={e => setNewText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddEvent()}
                style={{ fontSize: 11 }} />
              <button className="flex items-center justify-center w-6 h-6 rounded transition-colors shrink-0"
                style={{ background: 'var(--accent)', color: 'var(--bg)' }}
                onClick={handleAddEvent}>
                <Plus size={12} />
              </button>
            </div>
          </div>
        )}

        {/* 범례 */}
        {!selectedDate && (
          <div className="flex items-center gap-3 mt-3" style={{ color: 'var(--txs)' }}>
            <div className="flex items-center gap-1">
              <span className="rounded-full" style={{ width: 6, height: 6, background: 'var(--accent)', display: 'inline-block' }} />
              <span style={{ fontSize: 9 }}>오늘</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="rounded-full" style={{ width: 4, height: 4, background: 'var(--accent2)', display: 'inline-block' }} />
              <span style={{ fontSize: 9 }}>콘텐츠 있음</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="rounded-full" style={{ width: 4, height: 4, background: 'var(--accent)', display: 'inline-block' }} />
              <span style={{ fontSize: 9 }}>일정 있음</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
