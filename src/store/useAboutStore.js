// 어바웃 스토어 — 프로필, 공지사항, 방명록 관리
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { initialAbout } from '../data/about'

// 고유 ID 생성 헬퍼
function generateId() {
  return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
}

const useAboutStore = create(
  persist(
    (set) => ({
      // 초기 프로필 데이터
      profile: initialAbout.profile,

      // 초기 공지사항 목록
      notices: initialAbout.notices,

      // 초기 방명록 목록 (빈 배열)
      guestbook: initialAbout.guestbook,

      // --- 프로필 액션 ---

      // 프로필 얕은 병합 업데이트
      updateProfile: (updates) =>
        set((state) => ({
          profile: { ...state.profile, ...updates },
        })),

      // --- 공지사항 액션 ---

      // 새 공지사항 추가
      addNotice: (notice) =>
        set((state) => ({
          notices: [
            {
              ...notice,
              id: generateId(),
              pinned: notice.pinned ?? false,
              createdAt: notice.createdAt ?? new Date().toISOString().slice(0, 10),
            },
            ...state.notices,
          ],
        })),

      // 공지사항 수정
      updateNotice: (id, updates) =>
        set((state) => ({
          notices: state.notices.map((n) =>
            n.id === id ? { ...n, ...updates } : n
          ),
        })),

      // 공지사항 삭제
      deleteNotice: (id) =>
        set((state) => ({
          notices: state.notices.filter((n) => n.id !== id),
        })),

      // 공지사항 핀 토글
      toggleNoticePin: (id) =>
        set((state) => ({
          notices: state.notices.map((n) =>
            n.id === id ? { ...n, pinned: !n.pinned } : n
          ),
        })),

      // --- 방명록 액션 ---

      // 새 방명록 항목 추가
      addGuestbookEntry: (entry) =>
        set((state) => ({
          guestbook: [
            ...state.guestbook,
            {
              ...entry,
              id: generateId(),
              createdAt: entry.createdAt ?? new Date().toISOString(),
            },
          ],
        })),

      // 방명록 항목 삭제
      deleteGuestbookEntry: (id) =>
        set((state) => ({
          guestbook: state.guestbook.filter((e) => e.id !== id),
        })),
    }),
    {
      name: 'about-store',
    }
  )
)

export default useAboutStore
export { useAboutStore }
