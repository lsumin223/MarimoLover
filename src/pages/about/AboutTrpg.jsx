import { useState } from 'react'
import { Edit2, ChevronDown, ChevronUp } from 'lucide-react'

// ── 플레이 성향 통합 카테고리 ────────────────────────────────
const STYLE_CATS = [
  { cat: '세션 유형', items: [
    { key: 'ov_forum',    label: '포럼/포스트라인' },
    { key: 'ov_sound',    label: 'VTT/사운드' },
    { key: 'ov_text',     label: '텍스트' },
    { key: 'ov_dice',     label: '다이스 (1회성)' },
    { key: 'ov_master',   label: '마스터링' },
    { key: 'ov_campaign', label: '장기 캠페인' },
  ]},
  { cat: '조율 방식', items: [
    { key: 'ov_coord_indiv',  label: '개별 조율' },
    { key: 'ov_coord_common', label: '공통 조율' },
    { key: 'ov_coord_dice',   label: '다이스만' },
    { key: 'ov_coord_flex',   label: '유동적' },
  ]},
  { cat: '참여 빈도', items: [
    { key: 'ov_freq_often',     label: '자주' },
    { key: 'ov_freq_sometimes', label: '가끔' },
    { key: 'ov_freq_rare',      label: '드문드문' },
    { key: 'ov_freq_none',      label: '일정 없음' },
  ]},
  { cat: '플레이 성향', items: [
    { key: 'ov_play_rp',      label: '롤플 중심' },
    { key: 'ov_play_story',   label: '스토리 중심' },
    { key: 'ov_play_combat',  label: '전투 중심' },
    { key: 'ov_play_explore', label: '탐색 중심' },
    { key: 'ov_play_social',  label: '사교 중심' },
    { key: 'ov_play_mixed',   label: '균형잡힌 편' },
  ]},
  { cat: '길이', items: [
    { key: 'pl_len_short',     label: '단문' },
    { key: 'pl_len_mid',       label: '중문' },
    { key: 'pl_len_long',      label: '장문' },
    { key: 'pl_len_onepara',   label: '한 단락' },
    { key: 'pl_len_multisent', label: '짧게 여러 번' },
  ]},
  { cat: '지문', items: [
    { key: 'pl_text_selfquote', label: '대사 (자문)' },
    { key: 'pl_text_quote',     label: '"대사" 지문' },
    { key: 'pl_text_other',     label: '기타 스타일' },
    { key: 'pl_text_5plus',     label: '5분 이상' },
    { key: 'pl_text_5minus',    label: '5분 이하' },
    { key: 'pl_text_1min',      label: '1분 내외' },
    { key: 'pl_text_30sec',     label: '30초 내외' },
  ]},
  { cat: '사담', items: [
    { key: 'pl_chat_external',    label: '외부 채널' },
    { key: 'pl_chat_internal',    label: '내부 채널' },
    { key: 'pl_chat_sessiononly', label: '세션 내용만' },
    { key: 'pl_chat_offtopic',    label: '의외 내용도 가능' },
    { key: 'pl_chat_none',        label: '비신호' },
  ]},
  { cat: '실황', items: [
    { key: 'pl_live_thread',  label: '타래 업로드' },
    { key: 'pl_live_capture', label: '캡쳐 업로드' },
    { key: 'pl_live_none',    label: '비신호' },
    { key: 'pl_live_quiet',   label: '조용 필요' },
    { key: 'pl_live_nocare',  label: '호불호 없음' },
  ]},
  { cat: '자리', items: [
    { key: 'pl_seat_always',    label: '반드시 알리는 편' },
    { key: 'pl_seat_bathroom',  label: '화장실 정도는 알림' },
    { key: 'pl_seat_urgent',    label: '급할 때만 알림' },
    { key: 'pl_seat_break',     label: '휴식시간 필수' },
    { key: 'pl_seat_breaknice', label: '있으면 좋음' },
    { key: 'pl_seat_nocare',    label: '상관 없음' },
  ]},
  { cat: '관계', items: [
    { key: 'pl_rel_pcpc',    label: 'PC-PC 연애' },
    { key: 'pl_rel_pcnpc',   label: 'PC-NPC 연애' },
    { key: 'pl_rel_rival',   label: 'PC-PC 대립' },
    { key: 'pl_rel_nocare',  label: '상관 없음' },
    { key: 'pl_rel_fixed',   label: '팀/고정닥 선호' },
    { key: 'pl_rel_onetime', label: '일회성' },
    { key: 'pl_rel_ongoing', label: '지속적' },
    { key: 'pl_rel_multi',   label: '다관팬/페어' },
    { key: 'pl_rel_init',    label: '먼저 제안' },
    { key: 'pl_rel_follow',  label: '해주면 같이' },
    { key: 'pl_rel_often',   label: '자주 하는 편' },
    { key: 'pl_rel_rare',    label: '가끔 하는 편' },
    { key: 'pl_rel_none',    label: '비신호' },
  ]},
]

// ── 잠재요소 성향표 ───────────────────────────────────────────
const LATENT_CATS = [
  { cat: '공포', color: '#8b5cf6', items: [
    { key: 'lt_h_memory',  label: '기억/정체성' },
    { key: 'lt_h_human',   label: '인간 혐오' },
    { key: 'lt_h_animal',  label: '동물 학대' },
    { key: 'lt_h_mental',  label: '정신 붕괴' },
    { key: 'lt_h_choice',  label: '선택/희생' },
    { key: 'lt_h_threat',  label: '외부 위협' },
    { key: 'lt_h_apoc',    label: '아포칼립스' },
    { key: 'lt_h_punish',  label: '형벌' },
  ]},
  { cat: '폭력/학대', color: '#ef4444', items: [
    { key: 'lt_v_phys',     label: '신체적 폭력' },
    { key: 'lt_v_physpc',   label: '신체적 폭력 (PC)' },
    { key: 'lt_v_ment',     label: '정신적 학대' },
    { key: 'lt_v_mentpc',   label: '정신적 학대 (PC)' },
    { key: 'lt_v_selfharm', label: '자해/자살' },
    { key: 'lt_v_trauma',   label: '트라우마 묘사' },
  ]},
  { cat: '사회적', color: '#f59e0b', items: [
    { key: 'lt_s_disc',     label: '차별/혐오' },
    { key: 'lt_s_politics', label: '정치적 요소' },
    { key: 'lt_s_religion', label: '종교적 요소' },
    { key: 'lt_s_addict',   label: '중독 요소' },
    { key: 'lt_s_crime',    label: '범죄 묘사' },
  ]},
  { cat: '성인', color: '#ec4899', items: [
    { key: 'lt_a_romance',  label: '성인 로맨스' },
    { key: 'lt_a_explicit', label: '성적 묘사 (명시)' },
    { key: 'lt_a_implied',  label: '성적 묘사 (암시)' },
    { key: 'lt_a_noncon',   label: '비합의 요소' },
  ]},
  { cat: '기타', color: 'var(--txm)', items: [
    { key: 'lt_e_pcdeath',    label: 'PC 사망' },
    { key: 'lt_e_npcdeath',   label: 'NPC 사망' },
    { key: 'lt_e_badend',     label: '배드 엔딩' },
    { key: 'lt_e_pcconflict', label: 'PC간 갈등 극단화' },
    { key: 'lt_e_spoiler',    label: '스포일러 포함' },
  ]},
]

const RATING_OPTS = [
  { key: 'ok',   label: '가능',  bg: 'var(--accent)', text: 'var(--bg)' },
  { key: 'cond', label: '조건부', bg: '#f59e0b',        text: 'white' },
  { key: 'no',   label: '불가',  bg: '#f87171',        text: 'white' },
]

// ── 칩 토글 리스트 (항상 표시, 선택 여부만 색상으로 구분) ─────
function ChipToggleGrid({ cats, checked, onToggle, editMode }) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
      {cats.map(group => (
        <div key={group.cat}>
          <div className="text-xs font-medium mb-1.5"
            style={{ color: 'var(--txm)', borderLeft: '2px solid var(--accent)', paddingLeft: 6 }}>
            {group.cat}
          </div>
          <div className="flex flex-wrap gap-1">
            {group.items.map(item => {
              const active = checked.includes(item.key)
              return (
                <button
                  key={item.key}
                  onClick={() => editMode && onToggle(item.key)}
                  className="px-2 py-0.5 rounded-full text-xs transition-all"
                  style={active
                    ? { background: 'var(--accent)', color: 'var(--bg)', cursor: editMode ? 'pointer' : 'default' }
                    : { border: '1px solid var(--border)', color: 'var(--txm)', cursor: editMode ? 'pointer' : 'default' }
                  }
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── 잠재요소 테이블 ───────────────────────────────────────────
function LatentTable({ ratings, onRate, editMode }) {
  const hasAny = Object.keys(ratings).length > 0
  if (!editMode && !hasAny) return null

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <div className="px-3 py-2 text-xs font-bold text-center"
        style={{ background: 'var(--elevated)', color: 'var(--tx)', borderBottom: '1px solid var(--border)' }}>
        잠재요소 성향표
      </div>
      <div className="p-3 space-y-4" style={{ background: 'var(--surface)' }}>
        {editMode && (
          <p className="text-xs" style={{ color: 'var(--txs)' }}>각 요소에 대해 가능/조건부/불가를 선택해주세요.</p>
        )}
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {LATENT_CATS.map(group => {
            const visible = editMode ? group.items : group.items.filter(i => ratings[i.key])
            if (!editMode && visible.length === 0) return null
            return (
              <div key={group.cat}>
                <div className="text-xs font-medium mb-1.5"
                  style={{ color: 'var(--txm)', borderLeft: `2px solid ${group.color}`, paddingLeft: 6 }}>
                  {group.cat}
                </div>
                <div className="space-y-1.5">
                  {visible.map(item => {
                    const val = ratings[item.key] || null
                    return (
                      <div key={item.key} className="flex items-center gap-1.5">
                        <span className="text-xs flex-1" style={{ color: 'var(--tx)' }}>{item.label}</span>
                        <div className="flex gap-1 shrink-0">
                          {RATING_OPTS.map(opt => {
                            const active = val === opt.key
                            return (
                              <button key={opt.key}
                                onClick={() => editMode && onRate(item.key, active ? null : opt.key)}
                                className="rounded transition-all"
                                style={{
                                  fontSize: 9, padding: '1px 5px',
                                  background: active ? opt.bg : 'transparent',
                                  color: active ? opt.text : (editMode ? 'var(--txs)' : 'transparent'),
                                  border: `1px solid ${active ? opt.bg : (editMode ? 'var(--border)' : 'transparent')}`,
                                  cursor: editMode ? 'pointer' : 'default',
                                }}>
                                {opt.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── 메인 섹션 ─────────────────────────────────────────────────
export default function AboutTrpg({ otaku, updateOtaku }) {
  const [editMode, setEditMode] = useState(false)
  const [collapsed, setCollapsed] = useState(true)

  // 이전 데이터(plStyle/ovStyle)와 통합
  const trpgStyle = otaku.trpgStyle || [
    ...(otaku.ovStyle || []),
    ...(otaku.plStyle || []),
  ]
  const latentRatings = otaku.latentRatings || {}
  const hasAny = trpgStyle.length > 0 || Object.keys(latentRatings).length > 0 || otaku.trpgTriggers

  const toggle = k => updateOtaku({
    trpgStyle: trpgStyle.includes(k) ? trpgStyle.filter(x => x !== k) : [...trpgStyle, k]
  })
  const rateLatent = (k, v) => updateOtaku({
    latentRatings: v
      ? { ...latentRatings, [k]: v }
      : Object.fromEntries(Object.entries(latentRatings).filter(([x]) => x !== k))
  })

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-5 rounded-full" style={{ background: 'var(--accent)' }} />
          <h2 className="text-base font-bold" style={{ color: 'var(--tx)' }}>TRPG 플레이 성향</h2>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost flex items-center gap-1 text-xs" onClick={() => setCollapsed(v => !v)}>
            {collapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>
          <button className="btn-ghost flex items-center gap-1 text-xs"
            onClick={() => { setEditMode(v => !v); setCollapsed(false) }}>
            <Edit2 size={12} /> {editMode ? '완료' : '편집'}
          </button>
        </div>
      </div>

      {!hasAny && !editMode && collapsed && (
        <p className="text-xs" style={{ color: 'var(--txs)' }}>설정된 플레이 성향이 없습니다. 편집 버튼으로 추가해보세요.</p>
      )}

      {(!collapsed || editMode) && (
        <div className="space-y-4">

          {/* 플레이 성향 통합 */}
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <div className="px-3 py-2 text-xs font-bold text-center"
              style={{ background: 'var(--elevated)', color: 'var(--tx)', borderBottom: '1px solid var(--border)' }}>
              플레이 성향
            </div>
            <div className="p-4 space-y-3" style={{ background: 'var(--surface)' }}>
              {(otaku.plStyleNote || editMode) && (
                editMode
                  ? <textarea className="textarea text-xs" rows={2} placeholder="본인 기준 상세 기술 (선택)"
                      value={otaku.plStyleNote || ''} onChange={e => updateOtaku({ plStyleNote: e.target.value })} />
                  : <p className="text-xs px-3 py-2 rounded-lg"
                      style={{ color: 'var(--txm)', background: 'var(--elevated)' }}>{otaku.plStyleNote}</p>
              )}
              <ChipToggleGrid cats={STYLE_CATS} checked={trpgStyle} onToggle={toggle} editMode={editMode} />
            </div>
          </div>

          {/* 잠재요소 성향표 */}
          <LatentTable ratings={latentRatings} onRate={rateLatent} editMode={editMode} />

          {/* 불호 소재 / 트리거 */}
          {(otaku.trpgTriggers || editMode) && (
            <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="text-xs font-medium mb-2" style={{ color: 'var(--txm)' }}>불호 소재 / 트리거</div>
              {editMode
                ? <textarea className="textarea text-xs" rows={3} placeholder="불호 소재나 트리거 요소를 적어주세요"
                    value={otaku.trpgTriggers || ''} onChange={e => updateOtaku({ trpgTriggers: e.target.value })} />
                : <p className="text-sm" style={{ color: 'var(--tx)', whiteSpace: 'pre-wrap' }}>{otaku.trpgTriggers}</p>
              }
            </div>
          )}

        </div>
      )}
    </section>
  )
}
