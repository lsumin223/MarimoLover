// TRPG 스토어 — 캠페인 및 세션 CRUD 관리
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { initialTrpg } from '../data/trpg'

// 고유 ID 생성 헬퍼
function generateId() {
  return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
}

const useTrpgStore = create(
  persist(
    (set) => ({
      // 초기 캠페인 목록
      campaigns: initialTrpg.campaigns,

      // 초기 세션 목록
      sessions: initialTrpg.sessions,

      // --- 캠페인 액션 ---

      // 새 캠페인 추가
      addCampaign: (campaign) =>
        set((state) => ({
          campaigns: [
            ...state.campaigns,
            {
              ...campaign,
              id: generateId(),
              createdAt: campaign.createdAt ?? new Date().toISOString().slice(0, 10),
            },
          ],
        })),

      // 캠페인 수정
      updateCampaign: (id, updates) =>
        set((state) => ({
          campaigns: state.campaigns.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      // 캠페인 삭제 (해당 캠페인의 세션도 함께 삭제)
      deleteCampaign: (id) =>
        set((state) => ({
          campaigns: state.campaigns.filter((c) => c.id !== id),
          sessions: state.sessions.filter((s) => s.campaignId !== id),
        })),

      // --- 세션 액션 ---

      // 새 세션 추가
      addSession: (session) =>
        set((state) => ({
          sessions: [
            ...state.sessions,
            {
              ...session,
              id: generateId(),
              createdAt: session.createdAt ?? new Date().toISOString().slice(0, 10),
            },
          ],
        })),

      // 세션 수정
      updateSession: (id, updates) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),

      // 세션 삭제
      deleteSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
        })),
    }),
    {
      name: 'trpg-store',
    }
  )
)

export default useTrpgStore
export { useTrpgStore }
