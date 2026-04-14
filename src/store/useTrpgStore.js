// TRPG 스토어 — 캠페인 및 세션 CRUD 관리
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { initialTrpg } from '../data/trpg'

function generateId() {
  return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
}

const useTrpgStore = create(
  persist(
    (set) => ({
      campaigns: initialTrpg.campaigns,
      sessions: initialTrpg.sessions,

      // --- 캠페인 ---
      addCampaign: (campaign) =>
        set((state) => ({
          campaigns: [...state.campaigns, { ...campaign, id: generateId(), coverImageId: null, createdAt: new Date().toISOString().slice(0, 10) }],
        })),
      updateCampaign: (id, updates) =>
        set((state) => ({
          campaigns: state.campaigns.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),
      deleteCampaign: (id) =>
        set((state) => ({
          campaigns: state.campaigns.filter((c) => c.id !== id),
          sessions: state.sessions.filter((s) => s.campaignId !== id),
        })),

      // --- 세션 ---
      addSession: (session) =>
        set((state) => ({
          sessions: [...state.sessions, {
            ...session,
            id: generateId(),
            plCharacters: session.plCharacters ?? [],
            passwordHash: session.passwordHash ?? null,
            createdAt: new Date().toISOString().slice(0, 10),
          }],
        })),
      updateSession: (id, updates) =>
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),
      deleteSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
        })),
    }),
    { name: 'trpg-store' }
  )
)

export default useTrpgStore
export { useTrpgStore }
