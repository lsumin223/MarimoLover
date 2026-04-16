// 홈 대시보드 — 고정 3열 레이아웃 (react-grid-layout 제거)
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

// 데스크톱 3열 배치 순서 (목업 기준)
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
  const { activeWidgets } = useSettingsStore()

  return (
    <div className="pt-14 min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-7xl mx-auto px-3 py-3">
        {/*
          모바일:  1열 (flex-col)
          데스크톱 (lg+): 3열 — 왼쪽 고정 / 중간 가변 / 오른쪽 고정
        */}
        <div className="flex flex-col lg:flex-row gap-3">
          {/* 왼쪽 */}
          <div className="lg:w-72 shrink-0 space-y-3">
            <Column keys={LEFT_COL} activeWidgets={activeWidgets} />
          </div>

          {/* 가운데 */}
          <div className="flex-1 space-y-3">
            <Column keys={CENTER_COL} activeWidgets={activeWidgets} />
          </div>

          {/* 오른쪽 */}
          <div className="lg:w-64 shrink-0 space-y-3">
            <Column keys={RIGHT_COL} activeWidgets={activeWidgets} />
          </div>
        </div>
      </div>
    </div>
  )
}
