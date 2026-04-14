// 홈 대시보드 — react-grid-layout 기반 위젯 배치 페이지
// react-grid-layout v2: ResponsiveGridLayout이 WidthProvider 내장
import { ResponsiveGridLayout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

import useSettingsStore from '../store/useSettingsStore'

import MainVisual from '../components/widgets/MainVisual'
import CalendarWidget from '../components/widgets/CalendarWidget'
import ArchiveWidget from '../components/widgets/ArchiveWidget'
import TrpgWidget from '../components/widgets/TrpgWidget'
import CharacterCardWidget from '../components/widgets/CharacterCardWidget'
import ProfileWidget from '../components/widgets/ProfileWidget'
import MiniGalleryWidget from '../components/widgets/MiniGalleryWidget'
import BgmWidget from '../components/widgets/BgmWidget'

// 기본 레이아웃 (lg 브레이크포인트, 12 컬럼)
const DEFAULT_LAYOUTS = {
  lg: [
    { i: 'mainVisual',    x: 0, y: 0,  w: 4, h: 8, minW: 3, minH: 5 },
    { i: 'calendar',      x: 0, y: 8,  w: 2, h: 6, minW: 2, minH: 5 },
    { i: 'miniGallery',   x: 2, y: 8,  w: 2, h: 6, minW: 2, minH: 4 },
    { i: 'archive',       x: 4, y: 0,  w: 4, h: 7, minW: 3, minH: 4 },
    { i: 'trpg',          x: 4, y: 7,  w: 4, h: 7, minW: 3, minH: 4 },
    { i: 'characterCard', x: 8, y: 0,  w: 4, h: 7, minW: 3, minH: 4 },
    { i: 'profile',       x: 8, y: 7,  w: 2, h: 5, minW: 2, minH: 4 },
    { i: 'bgm',           x: 10, y: 7, w: 2, h: 5, minW: 2, minH: 4 },
  ],
}

// 위젯 키 → 컴포넌트 매핑
const WIDGET_MAP = {
  mainVisual:    MainVisual,
  calendar:      CalendarWidget,
  miniGallery:   MiniGalleryWidget,
  archive:       ArchiveWidget,
  trpg:          TrpgWidget,
  characterCard: CharacterCardWidget,
  profile:       ProfileWidget,
  bgm:           BgmWidget,
}

export default function Home() {
  const { activeWidgets, widgetLayouts, setWidgetLayouts } = useSettingsStore()

  // 저장된 레이아웃이 없으면 기본 레이아웃 사용
  const layouts =
    widgetLayouts && Object.keys(widgetLayouts).length > 0
      ? widgetLayouts
      : DEFAULT_LAYOUTS

  // 레이아웃 변경 핸들러 — 브레이크포인트별 저장
  const handleLayoutChange = (_layout, allLayouts) => {
    setWidgetLayouts(allLayouts)
  }

  // 활성화된 위젯 키 목록
  const activeKeys = Object.entries(activeWidgets)
    .filter(([, active]) => active)
    .map(([key]) => key)

  // 활성화된 위젯에 맞게 레이아웃 항목 필터링
  const filteredLayouts = {
    ...layouts,
    lg: (layouts.lg || DEFAULT_LAYOUTS.lg).filter((item) =>
      activeKeys.includes(item.i)
    ),
  }

  return (
    <div className="pt-14 min-h-screen bg-bg">
      <ResponsiveGridLayout
        className="layout"
        layouts={filteredLayouts}
        breakpoints={{ lg: 1200, md: 768, sm: 480, xs: 0 }}
        cols={{ lg: 12, md: 8, sm: 4, xs: 2 }}
        rowHeight={40}
        margin={[8, 8]}
        draggableHandle=".drag-handle"
        onLayoutChange={handleLayoutChange}
        isResizable
        isDraggable
      >
        {activeKeys.map((key) => {
          const WidgetComponent = WIDGET_MAP[key]
          if (!WidgetComponent) return null
          return (
            <div
              key={key}
              className="overflow-hidden rounded-xl border border-border"
              style={{ background: 'var(--surface)' }}
            >
              <WidgetComponent />
            </div>
          )
        })}
      </ResponsiveGridLayout>
    </div>
  )
}
