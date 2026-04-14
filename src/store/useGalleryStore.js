// 갤러리 스토어 — 갤러리 포스트 CRUD 관리
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { initialGallery } from '../data/gallery'

function generateId() {
  return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
}

const useGalleryStore = create(
  persist(
    (set) => ({
      posts: initialGallery,

      addPost: (post) =>
        set((state) => ({
          posts: [...state.posts, {
            ...post,
            id: generateId(),
            passwordHash: post.passwordHash ?? null,
            createdAt: post.createdAt ?? new Date().toISOString().slice(0, 10),
          }],
        })),
      updatePost: (id, updates) =>
        set((state) => ({
          posts: state.posts.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),
      deletePost: (id) =>
        set((state) => ({
          posts: state.posts.filter((p) => p.id !== id),
        })),
    }),
    { name: 'gallery-store' }
  )
)

export default useGalleryStore
export { useGalleryStore }
