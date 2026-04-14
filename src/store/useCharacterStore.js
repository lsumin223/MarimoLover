// 캐릭터 스토어 — 캐릭터 목록 CRUD 관리
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { initialCharacters } from '../data/characters'

function generateId() {
  return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
}

const useCharacterStore = create(
  persist(
    (set) => ({
      characters: initialCharacters,

      addCharacter: (char) =>
        set((state) => ({
          characters: [...state.characters, {
            ...char,
            id: generateId(),
            thumbnailImageId: char.thumbnailImageId ?? null,
            profileFields: char.profileFields ?? [],
            createdAt: char.createdAt ?? new Date().toISOString().slice(0, 10),
          }],
        })),
      updateCharacter: (id, updates) =>
        set((state) => ({
          characters: state.characters.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),
      deleteCharacter: (id) =>
        set((state) => ({
          characters: state.characters.filter((c) => c.id !== id),
        })),
    }),
    { name: 'character-store' }
  )
)

export default useCharacterStore
export { useCharacterStore }
