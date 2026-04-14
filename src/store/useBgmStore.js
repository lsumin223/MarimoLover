// BGM 플레이어 스토어 — 플레이리스트 및 재생 상태 관리
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

function generateId() {
  return 'bgm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
}

const useBgmStore = create(
  persist(
    (set, get) => ({
      tracks: [], // [{id, title, url}]
      currentIndex: 0,
      isPlaying: false,
      volume: 0.6,

      addTrack: (title, url) =>
        set((state) => ({
          tracks: [...state.tracks, { id: generateId(), title, url }],
        })),

      removeTrack: (id) =>
        set((state) => {
          const next = state.tracks.filter((t) => t.id !== id)
          const idx = Math.min(state.currentIndex, Math.max(0, next.length - 1))
          return { tracks: next, currentIndex: idx, isPlaying: next.length > 0 ? state.isPlaying : false }
        }),

      updateTrack: (id, updates) =>
        set((state) => ({
          tracks: state.tracks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),

      setCurrentIndex: (idx) => set({ currentIndex: idx }),
      setIsPlaying: (v) => set({ isPlaying: v }),
      setVolume: (v) => set({ volume: v }),

      nextTrack: () =>
        set((state) => ({
          currentIndex: state.tracks.length > 0
            ? (state.currentIndex + 1) % state.tracks.length
            : 0,
        })),

      prevTrack: () =>
        set((state) => ({
          currentIndex: state.tracks.length > 0
            ? (state.currentIndex - 1 + state.tracks.length) % state.tracks.length
            : 0,
        })),
    }),
    {
      name: 'bgm-store',
      // isPlaying은 새로고침 시 false로 초기화
      partialize: (state) => ({ tracks: state.tracks, currentIndex: state.currentIndex, volume: state.volume }),
    }
  )
)

export default useBgmStore
export { useBgmStore }
