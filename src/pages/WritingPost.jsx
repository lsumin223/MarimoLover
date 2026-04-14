// 글 뷰어 — 커스터마이징 가능한 독서 뷰어
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Edit2, Trash2, Palette, X } from 'lucide-react'
import useWritingStore from '../store/useWritingStore'
import useWorkStore from '../store/useWorkStore'
import useCharacterStore from '../store/useCharacterStore'
import ConfirmDialog from '../components/common/ConfirmDialog'

// 뷰어 설정 기본값
const DEFAULT_VIEWER = {
  fontFamily: 'Noto Serif KR',
  fontSize: 17,
  lineHeight: 1.9,
  letterSpacing: 0.03,
  maxWidth: 640,
  bgColor: 'default',   // 'white' | 'cream' | 'dark' | 'custom' | 'default'
  customBg: '#ffffff',
  textColor: 'default', // 'dark' | 'soft' | 'custom' | 'default'
  customText: '#1a1730',
}

const FONT_OPTIONS = [
  { value: 'Noto Serif KR', label: '명조 (Noto Serif)' },
  { value: 'Gowun Batang', label: '명조 (고운 바탕)' },
  { value: 'Noto Sans KR', label: '고딕 (Noto Sans)' },
  { value: 'Gowun Dodum', label: '손글씨 (고운 돋움)' },
  { value: 'Nanum Gothic Coding', label: '모노 (나눔고딕코딩)' },
]

const BG_PRESETS = [
  { key: 'default', label: '기본', bg: null },
  { key: 'white', label: '화이트', bg: '#ffffff' },
  { key: 'cream', label: '크림', bg: '#faf6ee' },
  { key: 'dark', label: '다크', bg: '#1a1a26' },
]
const TEXT_PRESETS = [
  { key: 'default', label: '기본', color: null },
  { key: 'dark', label: '다크', color: '#1a1730' },
  { key: 'soft', label: '소프트', color: '#4a4a5a' },
]

const STORAGE_KEY = 'writing-viewer-settings'

export default function WritingPost() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { writings, deleteWriting } = useWritingStore()
  const { works } = useWorkStore()
  const { characters } = useCharacterStore()

  const [settings, setSettings] = useState(() => {
    try { return { ...DEFAULT_VIEWER, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } } catch { return DEFAULT_VIEWER }
  })
  const [settingOpen, setSettingOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  // 설정 저장
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  const setSetting = (key, value) => setSettings(s => ({ ...s, [key]: value }))

  const writing = writings.find(w => w.id === id)
  if (!writing) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 text-center" style={{ color: 'var(--txs)' }}>
        <p>글을 찾을 수 없습니다.</p>
        <button className="btn-ghost mt-4" onClick={() => navigate('/writings')}>← 목록으로</button>
      </div>
    )
  }

  // 이전/다음 글 (날짜 정렬)
  const sorted = [...writings].sort((a, b) => b.date.localeCompare(a.date))
  const idx = sorted.findIndex(w => w.id === id)
  const prev = sorted[idx + 1]
  const next = sorted[idx - 1]

  const workTitle = works.find(w => w.id === writing.workId)?.title || '미분류'
  const charNames = (writing.characterTags || []).map(cid => characters.find(c => c.id === cid)?.name).filter(Boolean)

  // 배경/글자색 계산
  const getBg = () => {
    if (settings.bgColor === 'custom') return settings.customBg
    const p = BG_PRESETS.find(b => b.key === settings.bgColor)
    return p?.bg || undefined
  }
  const getTextColor = () => {
    if (settings.textColor === 'custom') return settings.customText
    const p = TEXT_PRESETS.find(b => b.key === settings.textColor)
    return p?.color || undefined
  }

  // --- 로 구분선 렌더링
  const renderContent = (text) => {
    return text.split('\n').map((line, i) => {
      if (line.trim() === '---') return <hr key={i} className="divider my-8" style={{ width: '40%', margin: '2em auto' }} />
      return <span key={i}>{line}{'\n'}</span>
    })
  }

  const viewerBg = getBg()
  const viewerText = getTextColor()

  return (
    <div className="relative min-h-screen animate-fade-in" style={{ background: viewerBg || 'var(--bg)', transition: 'background 0.2s' }}>
      {/* 상단 툴바 */}
      <div className="sticky top-12 z-10 flex items-center justify-between px-4 py-2" style={{ background: 'color-mix(in srgb, var(--surface) 90%, transparent)', backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--border)' }}>
        <button className="flex items-center gap-1 text-sm btn-ghost" onClick={() => navigate('/writings')}>
          <ChevronLeft size={16} /> 목록
        </button>
        <div className="flex gap-2">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors"
            style={{ color: settingOpen ? 'var(--accent)' : 'var(--txm)', background: settingOpen ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent', border: '1px solid var(--border)' }}
            onClick={() => setSettingOpen(s => !s)}
          >
            <Palette size={13} /> 뷰어 설정
          </button>
          <button className="btn-ghost flex items-center gap-1.5" onClick={() => navigate(`/writings/${id}/edit`)}><Edit2 size={13} /> 수정</button>
          <button className="btn-danger flex items-center gap-1.5" onClick={() => setDeleteOpen(true)}><Trash2 size={13} /> 삭제</button>
        </div>
      </div>

      {/* 뷰어 설정 패널 */}
      {settingOpen && (
        <div className="fixed right-4 top-32 z-20 w-72 rounded-xl shadow-2xl overflow-y-auto max-h-[80vh] animate-slide-up"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between p-4 border-b border-border">
            <span className="font-medium text-sm" style={{ color: 'var(--tx)' }}>뷰어 설정</span>
            <button onClick={() => setSettingOpen(false)} style={{ color: 'var(--txm)' }}><X size={16} /></button>
          </div>
          <div className="p-4 space-y-5">
            {/* 글꼴 */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--txm)' }}>글꼴</label>
              <select className="input text-sm" value={settings.fontFamily} onChange={e => setSetting('fontFamily', e.target.value)} style={{ fontFamily: settings.fontFamily }}>
                {FONT_OPTIONS.map(f => <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>)}
              </select>
            </div>
            {/* 글자 크기 */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-medium" style={{ color: 'var(--txm)' }}>글자 크기</label>
                <span className="text-xs" style={{ color: 'var(--accent)' }}>{settings.fontSize}px</span>
              </div>
              <input type="range" min={14} max={24} step={1} value={settings.fontSize} onChange={e => setSetting('fontSize', Number(e.target.value))} className="w-full" style={{ accentColor: 'var(--accent)' }} />
            </div>
            {/* 행간 */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-medium" style={{ color: 'var(--txm)' }}>행간</label>
                <span className="text-xs" style={{ color: 'var(--accent)' }}>{settings.lineHeight.toFixed(1)}</span>
              </div>
              <input type="range" min={1.4} max={2.4} step={0.1} value={settings.lineHeight} onChange={e => setSetting('lineHeight', Number(e.target.value))} className="w-full" style={{ accentColor: 'var(--accent)' }} />
            </div>
            {/* 자간 */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-medium" style={{ color: 'var(--txm)' }}>자간</label>
                <span className="text-xs" style={{ color: 'var(--accent)' }}>{settings.letterSpacing.toFixed(2)}em</span>
              </div>
              <input type="range" min={-0.05} max={0.20} step={0.01} value={settings.letterSpacing} onChange={e => setSetting('letterSpacing', Number(e.target.value))} className="w-full" style={{ accentColor: 'var(--accent)' }} />
            </div>
            {/* 본문 너비 */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-medium" style={{ color: 'var(--txm)' }}>본문 너비</label>
                <span className="text-xs" style={{ color: 'var(--accent)' }}>{settings.maxWidth}px</span>
              </div>
              <input type="range" min={400} max={900} step={20} value={settings.maxWidth} onChange={e => setSetting('maxWidth', Number(e.target.value))} className="w-full" style={{ accentColor: 'var(--accent)' }} />
            </div>
            {/* 배경색 */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--txm)' }}>배경색</label>
              <div className="flex gap-2 flex-wrap">
                {BG_PRESETS.map(b => (
                  <button key={b.key} className="px-2.5 py-1 rounded text-xs font-medium transition-all"
                    style={settings.bgColor === b.key
                      ? { background: 'var(--accent)', color: 'var(--bg)' }
                      : { border: '1px solid var(--border)', color: 'var(--txm)' }}
                    onClick={() => setSetting('bgColor', b.key)}>
                    {b.label}
                  </button>
                ))}
                <button className="px-2.5 py-1 rounded text-xs font-medium transition-all"
                  style={settings.bgColor === 'custom'
                    ? { background: 'var(--accent)', color: 'var(--bg)' }
                    : { border: '1px solid var(--border)', color: 'var(--txm)' }}
                  onClick={() => setSetting('bgColor', 'custom')}>
                  직접 지정
                </button>
              </div>
              {settings.bgColor === 'custom' && (
                <input type="color" className="mt-2 w-full h-8 rounded cursor-pointer" value={settings.customBg} onChange={e => setSetting('customBg', e.target.value)} style={{ border: '1px solid var(--border)', background: 'transparent' }} />
              )}
            </div>
            {/* 글자색 */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--txm)' }}>글자색</label>
              <div className="flex gap-2 flex-wrap">
                {TEXT_PRESETS.map(t => (
                  <button key={t.key} className="px-2.5 py-1 rounded text-xs font-medium transition-all"
                    style={settings.textColor === t.key
                      ? { background: 'var(--accent)', color: 'var(--bg)' }
                      : { border: '1px solid var(--border)', color: 'var(--txm)' }}
                    onClick={() => setSetting('textColor', t.key)}>
                    {t.label}
                  </button>
                ))}
                <button className="px-2.5 py-1 rounded text-xs font-medium transition-all"
                  style={settings.textColor === 'custom'
                    ? { background: 'var(--accent)', color: 'var(--bg)' }
                    : { border: '1px solid var(--border)', color: 'var(--txm)' }}
                  onClick={() => setSetting('textColor', 'custom')}>
                  직접 지정
                </button>
              </div>
              {settings.textColor === 'custom' && (
                <input type="color" className="mt-2 w-full h-8 rounded cursor-pointer" value={settings.customText} onChange={e => setSetting('customText', e.target.value)} style={{ border: '1px solid var(--border)', background: 'transparent' }} />
              )}
            </div>
            {/* 초기화 */}
            <button className="btn-ghost w-full text-xs" onClick={() => setSettings(DEFAULT_VIEWER)}>기본값으로 초기화</button>
          </div>
        </div>
      )}

      {/* 본문 영역 */}
      <div className="mx-auto px-4 py-12" style={{ maxWidth: settings.maxWidth }}>
        {/* 제목/메타 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-3" style={{ color: viewerText || 'var(--tx)', fontFamily: settings.fontFamily }}>{writing.title}</h1>
          <div className="flex flex-wrap gap-2 items-center">
            {writing.workId && <span className="tag">{workTitle}</span>}
            {charNames.map((n, i) => <span key={i} className="tag" style={{ color: 'var(--accent2)', background: 'color-mix(in srgb, var(--accent2) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--accent2) 25%, transparent)' }}>{n}</span>)}
            <span className="text-xs ml-auto" style={{ color: viewerText ? `${viewerText}88` : 'var(--txs)' }}>{writing.date}</span>
          </div>
        </div>

        {/* 본문 */}
        <div
          className="writing-viewer-content"
          style={{
            fontFamily: settings.fontFamily,
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
            letterSpacing: `${settings.letterSpacing}em`,
            color: viewerText || 'var(--tx)',
            transition: 'all 0.2s',
          }}
        >
          {renderContent(writing.content || '')}
        </div>

        {/* 이전/다음 내비게이션 */}
        <div className="flex justify-between mt-16 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
          {next ? (
            <button className="flex items-center gap-2 text-sm" style={{ color: 'var(--txm)' }} onClick={() => navigate(`/writings/${next.id}`)}>
              <ChevronLeft size={16} />
              <span className="truncate max-w-40">{next.title}</span>
            </button>
          ) : <div />}
          {prev ? (
            <button className="flex items-center gap-2 text-sm" style={{ color: 'var(--txm)' }} onClick={() => navigate(`/writings/${prev.id}`)}>
              <span className="truncate max-w-40">{prev.title}</span>
              <ChevronRight size={16} />
            </button>
          ) : <div />}
        </div>
      </div>

      {/* 삭제 확인 */}
      <ConfirmDialog
        isOpen={deleteOpen}
        message={`"${writing.title}"를 삭제하시겠습니까?`}
        onConfirm={() => { deleteWriting(writing.id); navigate('/writings') }}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  )
}
