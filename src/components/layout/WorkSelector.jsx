// 작품 선택 컴포넌트
// 상단 네비게이션에서 현재 선택된 작품을 필터링하는 용도
// 전체 + 각 작품을 수평 스크롤 칩으로 표시

import useSettingsStore from '../../store/useSettingsStore'
import useWorkStore from '../../store/useWorkStore'

export default function WorkSelector() {
  // 선택된 작품 ID와 setter
  const { selectedWorkId, setSelectedWorkId } = useSettingsStore()
  // 전체 작품 목록
  const { works } = useWorkStore()

  const handleSelect = (id) => {
    // 이미 선택된 경우 null로 초기화 (전체), 아닌 경우 해당 id 선택
    setSelectedWorkId(id === selectedWorkId ? null : id)
  }

  return (
    <div
      className="flex items-center gap-1.5 overflow-x-auto px-4 py-1.5"
      style={{ scrollbarWidth: 'none', borderTop: '1px solid var(--border)' }}
    >
      {/* "전체" 칩 */}
      <button
        className="shrink-0 px-3 py-0.5 rounded-full text-xs font-medium transition-all"
        style={
          !selectedWorkId
            ? {
                background: 'var(--accent)',
                color: 'var(--bg)',
                border: '1px solid var(--accent)',
              }
            : {
                background: 'transparent',
                color: 'var(--txm)',
                border: '1px solid var(--border)',
              }
        }
        onClick={() => setSelectedWorkId(null)}
      >
        전체
      </button>

      {/* 작품별 칩 */}
      {works.map((work) => {
        const isSelected = selectedWorkId === work.id
        return (
          <button
            key={work.id}
            className="shrink-0 px-3 py-0.5 rounded-full text-xs font-medium transition-all"
            style={
              isSelected
                ? {
                    background: 'var(--accent)',
                    color: 'var(--bg)',
                    border: '1px solid var(--accent)',
                  }
                : {
                    background: 'transparent',
                    color: 'var(--txm)',
                    border: '1px solid var(--border)',
                  }
            }
            onClick={() => handleSelect(work.id)}
          >
            {work.title}
          </button>
        )
      })}
    </div>
  )
}
