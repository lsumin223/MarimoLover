// 작품 스토어 — 작품 목록 CRUD 관리
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { initialWorks } from '../data/works'

// 고유 ID 생성 헬퍼
function generateId() {
  return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
}

const useWorkStore = create(
  persist(
    (set) => ({
      // 초기 작품 목록
      works: initialWorks,

      // 새 작품 추가
      addWork: (work) =>
        set((state) => ({
          works: [
            ...state.works,
            {
              ...work,
              id: generateId(),
              createdAt: work.createdAt ?? new Date().toISOString().slice(0, 10),
            },
          ],
        })),

      // 작품 수정
      updateWork: (id, updates) =>
        set((state) => ({
          works: state.works.map((w) =>
            w.id === id ? { ...w, ...updates } : w
          ),
        })),

      // 작품 삭제
      deleteWork: (id) =>
        set((state) => ({
          works: state.works.filter((w) => w.id !== id),
        })),
    }),
    {
      name: 'work-store',
    }
  )
)

export default useWorkStore
export { useWorkStore }
