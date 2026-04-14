// 달력 일정 스토어 — 날짜별 메모/일정 CRUD
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

function generateId() {
  return 'ev-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
}

const useCalendarStore = create(
  persist(
    (set) => ({
      // { 'YYYY-MM-DD': [{id, text}] }
      events: {},

      addEvent: (dateStr, text) =>
        set((state) => ({
          events: {
            ...state.events,
            [dateStr]: [...(state.events[dateStr] || []), { id: generateId(), text }],
          },
        })),

      updateEvent: (dateStr, id, text) =>
        set((state) => ({
          events: {
            ...state.events,
            [dateStr]: (state.events[dateStr] || []).map((e) => (e.id === id ? { ...e, text } : e)),
          },
        })),

      deleteEvent: (dateStr, id) =>
        set((state) => {
          const next = (state.events[dateStr] || []).filter((e) => e.id !== id)
          const events = { ...state.events }
          if (next.length === 0) delete events[dateStr]
          else events[dateStr] = next
          return { events }
        }),
    }),
    { name: 'calendar-store' }
  )
)

export default useCalendarStore
export { useCalendarStore }
