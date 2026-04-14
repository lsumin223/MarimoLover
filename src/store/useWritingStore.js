// 글 스토어 — 시리즈 + 글 CRUD 관리
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { initialSeries, initialWritings } from '../data/writings'

function generateId() {
  return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
}

const useWritingStore = create(
  persist(
    (set) => ({
      series: initialSeries,
      writings: initialWritings,

      // --- 시리즈 CRUD ---
      addSeries: (s) =>
        set((state) => ({
          series: [...state.series, { ...s, id: generateId(), createdAt: new Date().toISOString().slice(0, 10) }],
        })),
      updateSeries: (id, updates) =>
        set((state) => ({
          series: state.series.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),
      deleteSeries: (id) =>
        set((state) => ({
          series: state.series.filter((s) => s.id !== id),
          writings: state.writings.filter((w) => w.seriesId !== id),
        })),

      // --- 글 CRUD ---
      addWriting: (writing) =>
        set((state) => ({
          writings: [...state.writings, { ...writing, id: generateId(), createdAt: new Date().toISOString().slice(0, 10) }],
        })),
      updateWriting: (id, updates) =>
        set((state) => ({
          writings: state.writings.map((w) => (w.id === id ? { ...w, ...updates } : w)),
        })),
      deleteWriting: (id) =>
        set((state) => ({
          writings: state.writings.filter((w) => w.id !== id),
        })),
    }),
    { name: 'writing-store' }
  )
)

export default useWritingStore
export { useWritingStore }
