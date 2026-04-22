// 캐릭터 관계도 — SVG 노드-엣지 그래프 (원형 레이아웃)
import { useState, useEffect, useMemo } from 'react'
import { getImage } from '../lib/imageDB'

const W = 720
const H = 520
const NODE_R = 26
const LABEL_OFFSET = NODE_R + 16

function NodeAvatar({ char, x, y, isHovered }) {
  const [src, setSrc] = useState(null)
  useEffect(() => {
    if (char.thumbnailImageId) getImage(char.thumbnailImageId).then(setSrc)
  }, [char.thumbnailImageId])

  const name = char.name || '?'
  const truncated = name.length > 8 ? name.slice(0, 7) + '…' : name

  return (
    <g style={{ cursor: 'default' }}>
      <defs>
        <clipPath id={`rg-clip-${char.id}`}>
          <circle cx={x} cy={y} r={NODE_R - 2} />
        </clipPath>
      </defs>
      {/* 후광 */}
      {isHovered && (
        <circle cx={x} cy={y} r={NODE_R + 5}
          style={{ fill: 'color-mix(in srgb, var(--accent) 18%, transparent)', stroke: 'none' }} />
      )}
      {/* 배경 원 */}
      <circle cx={x} cy={y} r={NODE_R}
        style={{
          fill: 'var(--elevated)',
          stroke: isHovered ? 'var(--accent)' : 'var(--border)',
          strokeWidth: isHovered ? 2.5 : 1.5,
          transition: 'all 0.15s',
        }}
      />
      {/* 이미지 */}
      {src && (
        <image
          href={src}
          x={x - (NODE_R - 2)} y={y - (NODE_R - 2)}
          width={(NODE_R - 2) * 2} height={(NODE_R - 2) * 2}
          clipPath={`url(#rg-clip-${char.id})`}
          preserveAspectRatio="xMidYMid slice"
        />
      )}
      {/* 이니셜 (이미지 없을 때) */}
      {!src && (
        <text x={x} y={y}
          textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: NODE_R * 0.72, fill: isHovered ? 'var(--accent)' : 'var(--accent)', fontWeight: 700 }}
        >
          {name[0]}
        </text>
      )}
      {/* 이름 라벨 */}
      <text x={x} y={y + LABEL_OFFSET}
        textAnchor="middle"
        style={{
          fontSize: 11.5,
          fill: isHovered ? 'var(--accent)' : 'var(--txm)',
          fontWeight: isHovered ? '600' : '400',
          transition: 'fill 0.15s',
        }}
      >
        {truncated}
      </text>
    </g>
  )
}

export default function RelationGraph({ characters }) {
  const [hoveredEdge, setHoveredEdge] = useState(null)
  const [hoveredNode, setHoveredNode] = useState(null)

  const individuals = useMemo(() =>
    characters.filter(c => c.type === 'individual' && c.name),
    [characters]
  )

  const edges = useMemo(() => {
    const result = []
    individuals.forEach(char => {
      (char.relations || []).forEach(rel => {
        const target = individuals.find(c => c.id === rel.characterId)
        if (target && rel.description) {
          result.push({ fromId: char.id, toId: rel.characterId, description: rel.description })
        }
      })
    })
    return result
  }, [individuals])

  const positions = useMemo(() => {
    const n = individuals.length
    if (n === 0) return {}
    const cxC = W / 2, cyC = H / 2
    const r = Math.max(130, Math.min(200, n * 26))
    const pos = {}
    individuals.forEach((char, i) => {
      const angle = (2 * Math.PI * i / n) - Math.PI / 2
      pos[char.id] = {
        x: cxC + r * Math.cos(angle),
        y: cyC + r * Math.sin(angle),
      }
    })
    return pos
  }, [individuals])

  if (individuals.length === 0) {
    return (
      <div className="text-center py-20" style={{ color: 'var(--txs)' }}>
        등록된 캐릭터가 없습니다
      </div>
    )
  }

  if (edges.length === 0) {
    return (
      <div className="text-center py-20 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--txs)' }}>
        <p className="text-sm mb-1">등록된 관계가 없습니다</p>
        <p className="text-xs">캐릭터 편집 → 관계 항목에서 추가해주세요</p>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl p-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', maxWidth: W, display: 'block', margin: '0 auto' }}
      >
        {/* 엣지 */}
        {edges.map((edge, i) => {
          const from = positions[edge.fromId]
          const to = positions[edge.toId]
          if (!from || !to) return null

          const midX = (from.x + to.x) / 2
          const midY = (from.y + to.y) / 2
          const isHov = hoveredEdge === i
          const isConn = hoveredNode === edge.fromId || hoveredNode === edge.toId

          const desc = edge.description.length > 12
            ? edge.description.slice(0, 11) + '…'
            : edge.description
          const labelW = Math.max(60, desc.length * 9 + 16)

          return (
            <g key={i}>
              {/* 히트 영역 (클릭 영역을 넓히기 위해) */}
              <line
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                strokeWidth={12} stroke="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredEdge(i)}
                onMouseLeave={() => setHoveredEdge(null)}
              />
              {/* 실제 선 */}
              <line
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                style={{
                  stroke: isHov || isConn ? 'var(--accent)' : 'var(--border)',
                  strokeWidth: isHov || isConn ? 2 : 1,
                  strokeDasharray: isHov ? '' : '5 4',
                  transition: 'all 0.15s',
                  pointerEvents: 'none',
                }}
              />
              {/* 관계 설명 툴팁 */}
              {isHov && (
                <g>
                  <rect
                    x={midX - labelW / 2} y={midY - 13}
                    width={labelW} height={22}
                    rx={5}
                    style={{ fill: 'var(--surface)', stroke: 'var(--accent)', strokeWidth: 1 }}
                  />
                  <text
                    x={midX} y={midY}
                    textAnchor="middle" dominantBaseline="central"
                    style={{ fontSize: 11, fill: 'var(--tx)', fontWeight: '500' }}
                  >
                    {desc}
                  </text>
                </g>
              )}
            </g>
          )
        })}

        {/* 노드 */}
        {individuals.map(char => {
          const pos = positions[char.id]
          if (!pos) return null
          return (
            <g
              key={char.id}
              onMouseEnter={() => setHoveredNode(char.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <NodeAvatar char={char} x={pos.x} y={pos.y} isHovered={hoveredNode === char.id} />
            </g>
          )
        })}
      </svg>
    </div>
  )
}
