// 설정 스토어 — 테마, 레이아웃, 위젯 등 전역 설정 관리
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// CSS 변수 및 data-theme 속성을 document.documentElement에 적용
function applyTheme({ accentColor, accent2Color, darkMode }) {
  const root = document.documentElement

  // 강조색 CSS 변수 적용 (index.css의 --accent, --accent2 와 일치)
  if (accentColor) root.style.setProperty('--accent', accentColor)
  if (accent2Color) root.style.setProperty('--accent2', accent2Color)

  // data-theme 속성으로 라이트/다크 전환
  root.setAttribute('data-theme', darkMode ? 'dark' : 'light')
}

const useSettingsStore = create(
  persist(
    (set, get) => ({
      // 기본 프로필 설정
      nickname: '마리모',
      activityPeriod: '2020 — present',
      bio: '',
      mainVisualImageId: null,

      // 테마 색상 및 다크모드
      accentColor: '#b48ef0',
      accent2Color: '#f093b0',
      darkMode: true,

      // 위젯 표시 여부
      activeWidgets: {
        calendar: true,
        archive: true,
        trpg: true,
        characterCard: true,
        profile: true,
        miniGallery: true,
        bgm: true,
      },

      // 위젯 레이아웃 설정
      widgetLayouts: {},

      // 방명록 비밀번호 해시
      guestbookPasswordHash: null,

      // 관리자 비밀번호 해시 (null이면 비밀번호 미설정 = 누구나 수정 가능)
      adminPasswordHash: null,

      // --- 액션 ---

      setNickname: (nickname) => set({ nickname }),

      setActivityPeriod: (activityPeriod) => set({ activityPeriod }),

      setBio: (bio) => set({ bio }),

      setMainVisualImageId: (mainVisualImageId) => set({ mainVisualImageId }),

      setAccentColor: (accentColor) => {
        set({ accentColor })
        const { accent2Color, darkMode } = get()
        applyTheme({ accentColor, accent2Color, darkMode })
      },

      setAccent2Color: (accent2Color) => {
        set({ accent2Color })
        const { accentColor, darkMode } = get()
        applyTheme({ accentColor, accent2Color, darkMode })
      },

      toggleDarkMode: () => {
        const { accentColor, accent2Color, darkMode } = get()
        const next = !darkMode
        set({ darkMode: next })
        applyTheme({ accentColor, accent2Color, darkMode: next })
      },

      toggleWidget: (key) =>
        set((state) => ({
          activeWidgets: {
            ...state.activeWidgets,
            [key]: !state.activeWidgets[key],
          },
        })),

      setWidgetLayouts: (widgetLayouts) => set({ widgetLayouts }),

      resetWidgetLayouts: () => set({ widgetLayouts: {} }),

      setGuestbookPasswordHash: (guestbookPasswordHash) =>
        set({ guestbookPasswordHash }),

      setAdminPasswordHash: (adminPasswordHash) =>
        set({ adminPasswordHash }),
    }),
    {
      name: 'settings-store',
      // persist 복원 후 테마 즉시 적용
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme({
            accentColor: state.accentColor,
            accent2Color: state.accent2Color,
            darkMode: state.darkMode,
          })
        }
      },
    }
  )
)

// 스토어 초기화 시 테마 적용 (첫 로드 대응)
const { accentColor, accent2Color, darkMode } = useSettingsStore.getState()
applyTheme({ accentColor, accent2Color, darkMode })

export default useSettingsStore
export { useSettingsStore }
