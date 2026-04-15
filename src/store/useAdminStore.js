// 관리자 인증 스토어 — 세션 기반 (탭 닫으면 자동 로그아웃)
import { create } from 'zustand'
import useSettingsStore from './useSettingsStore'

// 편의 훅: 비밀번호 미설정 시 항상 true, 설정 시 로그인 여부로 판단
export function useIsAdmin() {
  const adminPasswordHash = useSettingsStore(s => s.adminPasswordHash)
  const isAdmin = useAdminStore(s => s.isAdmin)
  return !adminPasswordHash || isAdmin
}

const useAdminStore = create((set) => ({
  // 세션스토리지에서 로그인 상태 복원
  isAdmin: sessionStorage.getItem('admin-session') === 'true',

  // 로그인 성공 시 호출
  login: () => {
    sessionStorage.setItem('admin-session', 'true')
    set({ isAdmin: true })
  },

  // 로그아웃
  logout: () => {
    sessionStorage.removeItem('admin-session')
    set({ isAdmin: false })
  },

  // 로그인 모달 표시 여부
  loginModalOpen: false,
  openLoginModal: () => set({ loginModalOpen: true }),
  closeLoginModal: () => set({ loginModalOpen: false }),
}))

export default useAdminStore
