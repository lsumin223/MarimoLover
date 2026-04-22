// 홈 대시보드 — 모바일 1열 (사용자 순서) / 데스크톱 3열
import { useState, useEffect } from 'react'
import useSettingsStore from '../store/useSettingsStore'
import CalendarWidget from '../components/widgets/CalendarWidget'
import ArchiveWidget from '../components/widgets/ArchiveWidget'
import TrpgWidget from '../components/widgets/TrpgWidget'
import CharacterCardWidget from '../components/widgets/CharacterCardWidget'
import ProfileWidget from '../components/widgets/ProfileWidget'
import MiniGalleryWidget from '../components/widgets/MiniGalleryWidget'
import BgmWidget from '../components/widgets/BgmWidget'

const WIDGET_MAP = {
  calendar:      CalendarWidget,
  miniGallery:   MiniGalleryWidget,
  archive:       ArchiveWidget,
  trpg:          TrpgWidget,
  characterCard: CharacterCardWidget,
  profile:       ProfileWidget,
  bgm:           BgmWidget,
}

// 데스크톱 3열 배치
const LEFT_COL   = ['profile', 'bgm']
const CENTER_COL = ['archive', 'trpg']
const RIGHT_COL  = ['characterCard', 'calendar']

function Widget({ id }) {
  const W = WIDGET_MAP[id]
  if (!W) return null
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <W />
    </div>
  )
}

function Column({ keys, activeWidgets }) {
  const active = keys.filter(k => activeWidgets[k])
  if (active.length === 0) return null
  return (
    <div className="space-y-3">
      {active.map(k => <Widget key={k} id={k} />)}
    </div>
  )
}

export default function Home() {
  const { activeWidgets, mobileWidgetOrder } = useSettingsStore()

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const handler = e => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // 모바일: 사용자 지정 순서로 활성 위젯만 렌더링
  const mobileOrder = (mobileWidgetOrder || []).filter(k => activeWidgets[k] && WIDGET_MAP[k])

  return (
    <div className="pt-14 min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-7xl mx-auto px-3 py-3">
        {isMobile ? (
          // 모바일 — 사용자 정의 순서 단일 열
          <div className="space-y-3">
            {mobileOrder.map(k => <Widget key={k} id={k} />)}
          </div>
        ) : (
          // 데스크톱 — 3열 고정 레이아웃
          <div className="flex gap-3">
            <div className="w-72 shrink-0 space-y-3">
              <Column keys={LEFT_COL} activeWidgets={activeWidgets} />
            </div>
            <div className="flex-1 space-y-3">
              <Column keys={CENTER_COL} activeWidgets={activeWidgets} />
            </div>
            <div className="w-64 shrink-0 space-y-3">
              <Column keys={RIGHT_COL} activeWidgets={activeWidgets} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
