// 캐릭터 스토어 — 캐릭터 목록 CRUD 관리
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { initialCharacters } from '../data/characters'

// 고유 ID 생성 헬퍼
function generateId() {
  return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
}

const useCharacterStore = create(
  persist(
    (set) => ({
      // 초기 캐릭터 목록
      characters: initialCharacters,

      // 새 캐릭터 추가
      addCharacter: (char) =>
        set((state) => ({
          characters: [
            ...state.characters,
            {
              ...char,
              id: generateId(),
              createdAt: char.createdAt ?? new Date().toISOString().slice(0, 10),
            },
          ],
        })),

      // 캐릭터 수정
      updateCharacter: (id, updates) =>
        set((state) => ({
          characters: state.characters.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      // 캐릭터 삭제
      deleteCharacter: (id) =>
        set((state) => ({
          characters: state.characters.filter((c) => c.id !== id),
        })),
    }),
    {
      name: 'character-store',
    }
  )
)

export default useCharacterStore
export { useCharacterStore }
