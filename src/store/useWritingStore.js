// 글 스토어 — 글(소설/단편) 목록 CRUD 관리
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { initialWritings } from '../data/writings'

// 고유 ID 생성 헬퍼
function generateId() {
  return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
}

const useWritingStore = create(
  persist(
    (set) => ({
      // 초기 글 목록
      writings: initialWritings,

      // 새 글 추가
      addWriting: (writing) =>
        set((state) => ({
          writings: [
            ...state.writings,
            {
              ...writing,
              id: generateId(),
              createdAt: writing.createdAt ?? new Date().toISOString().slice(0, 10),
            },
          ],
        })),

      // 글 수정
      updateWriting: (id, updates) =>
        set((state) => ({
          writings: state.writings.map((w) =>
            w.id === id ? { ...w, ...updates } : w
          ),
        })),

      // 글 삭제
      deleteWriting: (id) =>
        set((state) => ({
          writings: state.writings.filter((w) => w.id !== id),
        })),
    }),
    {
      name: 'writing-store',
    }
  )
)

export default useWritingStore
export { useWritingStore }
