import { useState } from 'react'
import { Edit2, ChevronDown, ChevronUp, Check } from 'lucide-react'

const GM_OPTIONS = [
  { cat: '문단', items: [
    { key: 'gm_para_textgore', label: '텍스트 고어' },
    { key: 'gm_para_soundscare', label: '사운드 점프 스케어' },
    { key: 'gm_para_unfold', label: '언폴성 재굴림' },
    { key: 'gm_para_bgm', label: 'BGM' },
    { key: 'gm_para_portrait', label: '보트레이트' },
  ]},
  { cat: '묘사', items: [
    { key: 'gm_desc_minimal', label: '최소한의 점묘만' },
    { key: 'gm_desc_detailed', label: '세세하게 묘사' },
    { key: 'gm_desc_invpoint', label: '조사포인트 강조 표기' },
    { key: 'gm_desc_listpoint', label: '조사포인트 나열식' },
    { key: 'gm_desc_metagag', label: '메타/개그 판정 가능' },
  ]},
  { cat: '사담', items: [
    { key: 'gm_chat_external', label: '외부 채널 사용' },
    { key: 'gm_chat_internal', label: '내부 채널 사용' },
    { key: 'gm_chat_sessiononly', label: '세션 내용만 선호' },
    { key: 'gm_chat_offtopic', label: '의외 내용도 가능' },
  ]},
  { cat: '진행', items: [
    { key: 'gm_time_2h', label: '2시간 이내' },
    { key: 'gm_time_4h', label: '4시간 이내' },
    { key: 'gm_time_6h', label: '6시간 이상' },
    { key: 'gm_time_breakneeded', label: '쉬는 시간 필요' },
    { key: 'gm_time_nobreak', label: '쉬는 시간 불필요' },
  ]},
  { cat: '자리', items: [
    { key: 'gm_seat_always', label: '잠깐 비워도 알림 필수' },
    { key: 'gm_seat_bathroom', label: '화장실 정도는 괜찮음' },
    { key: 'gm_seat_urgent', label: '급할 때만 알림' },
  ]},
  { cat: 'PL참여', items: [
    { key: 'gm_pl_npcromance', label: 'PC-NPC 연애' },
    { key: 'gm_pl_npcabuse', label: 'PC-NPC 학대' },
    { key: 'gm_pl_beginner', label: '입문 PL 가능' },
    { key: 'gm_pl_feedback', label: '피드백 원함' },
  ]},
  { cat: '에프터', items: [
    { key: 'gm_after_explain', label: '진상 전문 설명' },
    { key: 'gm_after_link', label: '배포 링크 전달' },
    { key: 'gm_after_auth', label: 'GM 권한 부여' },
    { key: 'gm_after_pdf', label: 'PDF 변환' },
  ]},
]

const PL_OPTIONS = [
  { cat: '길이', items: [
    { key: 'pl_len_short', label: '단문' },
    { key: 'pl_len_mid', label: '중문' },
    { key: 'pl_len_long', label: '장문' },
    { key: 'pl_len_onepara', label: '한 단락으로 묶어서' },
    { key: 'pl_len_multisent', label: '짧은 문장 여러 번' },
  ]},
  { cat: '지문', items: [
    { key: 'pl_text_selfquote', label: '대사 (자문)' },
    { key: 'pl_text_quote', label: '"대사" 자문' },
    { key: 'pl_text_5plus', label: '5분 이상' },
    { key: 'pl_text_5minus', label: '5분 이하' },
    { key: 'pl_text_1min', label: '1분 내외' },
    { key: 'pl_text_30sec', label: '30초 내외' },
  ]},
  { cat: '사담', items: [
    { key: 'pl_chat_external', label: '외부 채널 사용' },
    { key: 'pl_chat_internal', label: '내부 채널 사용' },
    { key: 'pl_chat_sessiononly', label: '세션 내용만 선호' },
    { key: 'pl_chat_offtopic', label: '의외 내용도 가능' },
    { key: 'pl_chat_none', label: '비신호' },
  ]},
  { cat: '실황', items: [
    { key: 'pl_live_thread', label: '실황/타래 업로드' },
    { key: 'pl_live_capture', label: '캡쳐 업로드' },
    { key: 'pl_live_none', label: '비신호' },
    { key: 'pl_live_nocare', label: '호불호 없음' },
  ]},
  { cat: '자리', items: [
    { key: 'pl_seat_always', label: '잠깐 비워도 알림' },
    { key: 'pl_seat_bathroom', label: '화장실 정도는 알림' },
    { key: 'pl_seat_urgent', label: '급할 때만 알림' },
    { key: 'pl_seat_break', label: '휴식시간 필수' },
    { key: 'pl_seat_nocare', label: '상관 없음' },
  ]},
  { cat: '관계', items: [
    { key: 'pl_rel_pcpc', label: 'PC-PC 연애' },
    { key: 'pl_rel_pcnpc', label: 'PC-NPC 연애' },
    { key: 'pl_rel_rival', label: 'PC-PC 대립' },
    { key: 'pl_rel_nocare', label: '상관 없음' },
    { key: 'pl_rel_fixed', label: '고정닥 선호' },
    { key: 'pl_rel_onetime', label: '일회성 관계' },
    { key: 'pl_rel_ongoing', label: '지속적 관계' },
  ]},
]

function StyleColumn({ title, options, checked, onToggle, editMode }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <div className="px-3 py-2 text-xs font-bold text-center"
        style={{ background: 'var(--elevated)', color: 'var(--tx)', borderBottom: '1px solid var(--border)' }}>
        {title}
      </div>
      <div className="p-3 space-y-3" style={{ background: 'var(--surface)' }}>
        {options.map(group => {
          const checkedItems = group.items.filter(i => checked.includes(i.key))
          if (!editMode && checkedItems.length === 0) return null
          return (
            <div key={group.cat}>
              <div className="text-xs font-medium mb-1.5"
                style={{ color: 'var(--txm)', borderLeft: '2px solid var(--accent)', paddingLeft: 6 }}>
                {group.cat}
              </div>
              <div className="space-y-1">
                {(editMode ? group.items : checkedItems).map(item => (
                  <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                    {editMode
                      ? <input type="checkbox" checked={checked.includes(item.key)} onChange={() => onToggle(item.key)}
                          style={{ accentColor: 'var(--accent)' }} />
                      : <Check size={11} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    }
                    <span className="text-xs" style={{ color: 'var(--tx)' }}>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function AboutTrpg({ otaku, updateOtaku }) {
  const [editMode, setEditMode] = useState(false)
  const [collapsed, setCollapsed] = useState(true)

  const gmStyle = otaku.gmStyle || []
  const plStyle = otaku.plStyle || []
  const hasAny = gmStyle.length > 0 || plStyle.length > 0 || otaku.trpgTriggers

  const toggleGm = (key) => updateOtaku({ gmStyle: gmStyle.includes(key) ? gmStyle.filter(k => k !== key) : [...gmStyle, key] })
  const togglePl = (key) => updateOtaku({ plStyle: plStyle.includes(key) ? plStyle.filter(k => k !== key) : [...plStyle, key] })

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-5 rounded-full" style={{ background: 'var(--accent)' }} />
          <h2 className="text-base font-bold" style={{ color: 'var(--tx)' }}>TRPG 성향표</h2>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost flex items-center gap-1 text-xs"
            onClick={() => { setCollapsed(v => !v) }}>
            {collapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>
          <button className="btn-ghost flex items-center gap-1 text-xs"
            onClick={() => { setEditMode(v => !v); setCollapsed(false) }}>
            <Edit2 size={12} /> {editMode ? '완료' : '편집'}
          </button>
        </div>
      </div>

      {!hasAny && !editMode && collapsed && (
        <p className="text-xs" style={{ color: 'var(--txs)' }}>설정된 TRPG 성향이 없습니다. 편집 버튼으로 추가해보세요.</p>
      )}

      {(!collapsed || editMode) && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <StyleColumn title="GM 성향" options={GM_OPTIONS} checked={gmStyle} onToggle={toggleGm} editMode={editMode} />
            <StyleColumn title="PL 성향" options={PL_OPTIONS} checked={plStyle} onToggle={togglePl} editMode={editMode} />
          </div>

          {(otaku.trpgTriggers || editMode) && (
            <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="text-xs font-medium mb-2" style={{ color: 'var(--txm)' }}>트리거 / 불호</div>
              {editMode
                ? <textarea className="textarea text-xs" rows={3} placeholder="트리거나 불호 요소를 적어주세요"
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
