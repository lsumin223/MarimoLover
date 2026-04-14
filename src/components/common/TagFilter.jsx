// 태그 필터 컴포넌트
// 수평 스크롤 가능한 칩 버튼으로 구성
// "전체" 칩을 누르면 선택 초기화

export default function TagFilter({
  tags = [],
  selected = [],
  onChange,
  label = '필터',
}) {
  // "전체" 칩 클릭 — 선택 초기화
  const handleAll = () => {
    onChange([])
  }

  // 개별 태그 칩 클릭 — 토글
  const handleTag = (id) => {
    if (selected.includes(id)) {
      // 이미 선택된 경우 제거
      onChange(selected.filter((s) => s !== id))
    } else {
      // 선택되지 않은 경우 추가
      onChange([...selected, id])
    }
  }

  const isAllSelected = selected.length === 0

  return (
    <div className="flex items-center gap-2">
      {/* 라벨 (선택적으로 표시) */}
      {label && (
        <span
          className="text-xs shrink-0"
          style={{ color: 'var(--txs)' }}
        >
          {label}
        </span>
      )}

      {/* 스크롤 가능한 칩 영역 */}
      <div
        className="flex items-center gap-1.5 overflow-x-auto"
        style={{ scrollbarWidth: 'none' }}
      >
        {/* 전체 칩 */}
        <button
          className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium transition-all"
          style={
            isAllSelected
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
          onClick={handleAll}
        >
          전체
        </button>

        {/* 각 태그 칩 */}
        {tags.map((tag) => {
          const isSelected = selected.includes(tag.id)
          return (
            <button
              key={tag.id}
              className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium transition-all"
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
              onClick={() => handleTag(tag.id)}
            >
              {tag.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
