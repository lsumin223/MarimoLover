// 설정 페이지
import { useState } from 'react'
import { RotateCcw, Check, Plus, Edit2, Trash2, X } from 'lucide-react'
import useSettingsStore from '../store/useSettingsStore'
import useWorkStore from '../store/useWorkStore'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { saveImage, resizeImage, getImage } from '../lib/imageDB'
import { useEffect } from 'react'

const genId = () => 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// 설정 섹션 래퍼
function SettingSection({ title, children }) {
  return (
    <div className="p-5 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--tx)', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>{title}</h3>
      {children}
    </div>
  )
}

const ACCENT_PRESETS = ['#b48ef0', '#7c4dce', '#60a5fa', '#34d399', '#fb7185', '#f97316']
const ACCENT2_PRESETS = ['#f093b0', '#fb923c', '#facc15', '#a3e635', '#22d3ee', '#e879f9']

const WIDGET_LABELS = {
  mainVisual: '메인 비주얼',
  calendar: '달력',
  archive: '최근 작업물',
  trpg: 'TRPG 로그',
  characterCard: '캐릭터 카드',
  profile: '프로필',
  miniGallery: '미니 갤러리',
  bgm: 'BGM 플레이어',
}

export default function Settings() {
  const {
    nickname, setNickname,
    activityPeriod, setActivityPeriod,
    mainVisualImageId, setMainVisualImageId,
    accentColor, setAccentColor,
    accent2Color, setAccent2Color,
    darkMode, toggleDarkMode,
    activeWidgets, toggleWidget,
    resetWidgetLayouts,
    guestbookPasswordHash, setGuestbookPasswordHash,
  } = useSettingsStore()

  const { works, addWork, updateWork, deleteWork } = useWorkStore()

  // 메인 비주얼 이미지
  const [mainVisualSrc, setMainVisualSrc] = useState(null)
  useEffect(() => { if (mainVisualImageId) getImage(mainVisualImageId).then(setMainVisualSrc) }, [mainVisualImageId])

  // 작품 폼
  const [workFormOpen, setWorkFormOpen] = useState(false)
  const [workEdit, setWorkEdit] = useState(null)
  const [workForm, setWorkForm] = useState({ title: '', description: '' })
  const [deleteWorkTarget, setDeleteWorkTarget] = useState(null)

  // 비밀번호 설정
  const [pwInput, setPwInput] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  // 위젯 초기화 확인
  const [resetConfirm, setResetConfirm] = useState(false)

  // 메인 비주얼 업로드
  const handleMainVisual = async (e) => {
    const file = e.target.files[0]; if (!file) return
    const b64 = await resizeImage(file, 1200) // 메인 비주얼은 더 크게
    const id = genId()
    await saveImage(id, b64)
    setMainVisualImageId(id)
    setMainVisualSrc(b64)
  }

  // 작품 저장
  const saveWork = () => {
    if (!workForm.title) return
    if (workEdit) updateWork(workEdit.id, workForm)
    else addWork({ ...workForm, id: genId(), coverImageId: null, createdAt: new Date().toISOString() })
    setWorkFormOpen(false)
  }

  // 비밀번호 설정
  const savePassword = async () => {
    if (!pwInput.trim()) return
    if (pwInput !== pwConfirm) { alert('비밀번호가 일치하지 않습니다.'); return }
    const hash = await sha256(pwInput)
    setGuestbookPasswordHash(hash)
    setPwInput(''); setPwConfirm('')
    setPwSuccess(true)
    setTimeout(() => setPwSuccess(false), 2000)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5 animate-fade-in">
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--tx)' }}>설정</h1>

      {/* 기본 정보 */}
      <SettingSection title="기본 정보">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>닉네임</label>
            <input className="input" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="닉네임" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>활동 기간</label>
            <input className="input" value={activityPeriod} onChange={e => setActivityPeriod(e.target.value)} placeholder="2020 — present" />
          </div>
        </div>
      </SettingSection>

      {/* 메인 비주얼 */}
      <SettingSection title="메인 비주얼 이미지">
        <div className="flex items-center gap-4">
          {mainVisualSrc ? (
            <img src={mainVisualSrc} alt="메인 비주얼" className="w-24 h-16 object-cover rounded-lg" style={{ border: '1px solid var(--border)' }} />
          ) : (
            <div className="w-24 h-16 rounded-lg flex items-center justify-center text-xs" style={{ background: 'var(--elevated)', color: 'var(--txs)', border: '1px solid var(--border)' }}>미등록</div>
          )}
          <label className="btn-ghost cursor-pointer text-sm">
            {mainVisualSrc ? '이미지 변경' : '이미지 업로드'}
            <input type="file" accept="image/*" className="hidden" onChange={handleMainVisual} />
          </label>
        </div>
      </SettingSection>

      {/* 테마 컬러 */}
      <SettingSection title="테마 컬러">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--txm)' }}>메인 강조색</label>
            <div className="flex items-center gap-2 flex-wrap">
              {ACCENT_PRESETS.map(c => (
                <button key={c} className="w-7 h-7 rounded-full transition-all" style={{ background: c, border: accentColor === c ? '3px solid white' : '2px solid transparent', outline: accentColor === c ? `2px solid ${c}` : 'none' }} onClick={() => setAccentColor(c)} />
              ))}
              <input type="color" className="w-7 h-7 rounded-full cursor-pointer border-0" value={accentColor} onChange={e => setAccentColor(e.target.value)} title="직접 지정" />
              <span className="text-xs font-mono" style={{ color: 'var(--txm)' }}>{accentColor}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--txm)' }}>보조 강조색</label>
            <div className="flex items-center gap-2 flex-wrap">
              {ACCENT2_PRESETS.map(c => (
                <button key={c} className="w-7 h-7 rounded-full transition-all" style={{ background: c, border: accent2Color === c ? '3px solid white' : '2px solid transparent', outline: accent2Color === c ? `2px solid ${c}` : 'none' }} onClick={() => setAccent2Color(c)} />
              ))}
              <input type="color" className="w-7 h-7 rounded-full cursor-pointer border-0" value={accent2Color} onChange={e => setAccent2Color(e.target.value)} title="직접 지정" />
              <span className="text-xs font-mono" style={{ color: 'var(--txm)' }}>{accent2Color}</span>
            </div>
          </div>
        </div>
      </SettingSection>

      {/* 다크/라이트 모드 */}
      <SettingSection title="화면 모드">
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: 'var(--tx)' }}>{darkMode ? '다크 모드' : '라이트 모드'}</span>
          <button
            className="relative w-12 h-6 rounded-full transition-all"
            style={{ background: darkMode ? 'var(--accent)' : 'var(--border)' }}
            onClick={toggleDarkMode}
          >
            <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all" style={{ left: darkMode ? '26px' : '4px' }} />
          </button>
        </div>
      </SettingSection>

      {/* 위젯 표시 설정 */}
      <SettingSection title="위젯 표시 설정">
        <div className="space-y-2">
          {Object.entries(WIDGET_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between py-1">
              <span className="text-sm" style={{ color: 'var(--tx)' }}>{label}</span>
              <button
                className="relative w-10 h-5 rounded-full transition-all"
                style={{ background: activeWidgets[key] ? 'var(--accent)' : 'var(--border)' }}
                onClick={() => toggleWidget(key)}
              >
                <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: activeWidgets[key] ? '22px' : '2px' }} />
              </button>
            </div>
          ))}
        </div>
        <button
          className="btn-ghost flex items-center gap-1.5 text-sm mt-4"
          onClick={() => setResetConfirm(true)}
        >
          <RotateCcw size={13} /> 위젯 배치 초기화
        </button>
      </SettingSection>

      {/* 작품 관리 */}
      <SettingSection title="작품 관리">
        <div className="space-y-2 mb-4">
          {works.length === 0 && <div className="text-sm" style={{ color: 'var(--txs)' }}>등록된 작품이 없습니다</div>}
          {works.map(work => (
            <div key={work.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--elevated)' }}>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: 'var(--tx)' }}>{work.title}</div>
                {work.description && <div className="text-xs truncate mt-0.5" style={{ color: 'var(--txm)' }}>{work.description}</div>}
              </div>
              <button className="w-7 h-7 rounded flex items-center justify-center" style={{ color: 'var(--txm)' }} onClick={() => { setWorkEdit(work); setWorkForm({ title: work.title, description: work.description || '' }); setWorkFormOpen(true) }}><Edit2 size={13} /></button>
              <button className="w-7 h-7 rounded flex items-center justify-center" style={{ color: '#f87171' }} onClick={() => setDeleteWorkTarget(work)}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
        <button className="btn-accent flex items-center gap-1.5 text-sm" onClick={() => { setWorkEdit(null); setWorkForm({ title: '', description: '' }); setWorkFormOpen(true) }}>
          <Plus size={13} /> 작품 추가
        </button>
      </SettingSection>

      {/* 방명록 비밀번호 */}
      <SettingSection title="방명록 비밀번호">
        <p className="text-xs mb-3" style={{ color: 'var(--txm)' }}>
          {guestbookPasswordHash ? '비밀번호가 설정되어 있습니다. 변경하려면 새 비밀번호를 입력하세요.' : '방명록 삭제 시 비밀번호를 요구하려면 설정해주세요.'}
        </p>
        <div className="space-y-2">
          <input className="input" type="password" placeholder="새 비밀번호" value={pwInput} onChange={e => setPwInput(e.target.value)} />
          <input className="input" type="password" placeholder="비밀번호 확인" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} />
          <button
            className="flex items-center gap-1.5 btn-accent text-sm"
            onClick={savePassword}
          >
            {pwSuccess ? <><Check size={13} /> 저장됨</> : '저장'}
          </button>
        </div>
      </SettingSection>

      {/* 작품 폼 모달 */}
      <Modal isOpen={workFormOpen} onClose={() => setWorkFormOpen(false)} title={workEdit ? '작품 수정' : '새 작품'} size="sm">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>작품명 *</label>
            <input className="input" value={workForm.title} onChange={e => setWorkForm(f => ({ ...f, title: e.target.value }))} placeholder="작품 이름" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>설명</label>
            <textarea className="textarea" rows={3} value={workForm.description} onChange={e => setWorkForm(f => ({ ...f, description: e.target.value }))} placeholder="작품 소개" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn-ghost" onClick={() => setWorkFormOpen(false)}>취소</button>
          <button className="btn-accent" onClick={saveWork}>저장</button>
        </div>
      </Modal>

      {/* 작품 삭제 확인 */}
      <ConfirmDialog
        isOpen={!!deleteWorkTarget}
        message={`"${deleteWorkTarget?.title}" 작품을 삭제하시겠습니까?`}
        onConfirm={() => { deleteWork(deleteWorkTarget.id); setDeleteWorkTarget(null) }}
        onCancel={() => setDeleteWorkTarget(null)}
      />

      {/* 위젯 배치 초기화 확인 */}
      <ConfirmDialog
        isOpen={resetConfirm}
        message="위젯 배치를 기본값으로 초기화하시겠습니까?"
        confirmText="초기화"
        onConfirm={() => { resetWidgetLayouts(); setResetConfirm(false) }}
        onCancel={() => setResetConfirm(false)}
      />
    </div>
  )
}
