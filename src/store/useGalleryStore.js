// 갤러리 스토어 — 갤러리 포스트 CRUD 관리
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { initialGallery } from '../data/gallery'

// 고유 ID 생성 헬퍼
function generateId() {
  return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
}

const useGalleryStore = create(
  persist(
    (set) => ({
      // 초기 갤러리 포스트 목록
      posts: initialGallery,

      // 새 갤러리 포스트 추가
      addPost: (post) =>
        set((state) => ({
          posts: [
            ...state.posts,
            {
              ...post,
              id: generateId(),
              createdAt: post.createdAt ?? new Date().toISOString().slice(0, 10),
            },
          ],
        })),

      // 갤러리 포스트 수정
      updatePost: (id, updates) =>
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      // 갤러리 포스트 삭제
      deletePost: (id) =>
        set((state) => ({
          posts: state.posts.filter((p) => p.id !== id),
        })),
    }),
    {
      name: 'gallery-store',
    }
  )
)

export default useGalleryStore
export { useGalleryStore }
