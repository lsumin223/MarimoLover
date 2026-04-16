// 설정 페이지
import { useState } from 'react'
import { RotateCcw, Check, Lock } from 'lucide-react'
import useSettingsStore from '../store/useSettingsStore'
import useAdminStore from '../store/useAdminStore'
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

const WIDGET_META = {
  profile:       { label: '프로필',       hint: '왼쪽' },
  bgm:           { label: 'BGM 플레이어', hint: '왼쪽' },
  archive:       { label: '최근 작업물',  hint: '가운데' },
  trpg:          { label: 'TRPG 로그',   hint: '가운데' },
  characterCard: { label: '캐릭터 카드',  hint: '오른쪽' },
  calendar:      { label: '달력',         hint: '오른쪽' },
  miniGallery:   { label: '미니 갤러리',  hint: '별도 활성화' },
}

export default function Settings() {
  const {
    nickname, setNickname,
    activityPeriod, setActivityPeriod,
    bio, setBio,
    mainVisualImageId, setMainVisualImageId,
    accentColor, setAccentColor,
    accent2Color, setAccent2Color,
    darkMode, toggleDarkMode,
    activeWidgets, toggleWidget,
    resetWidgetLayouts,
    guestbookPasswordHash, setGuestbookPasswordHash,
    adminPasswordHash, setAdminPasswordHash,
  } = useSettingsStore()
  const { isAdmin, openLoginModal } = useAdminStore()

  // 관리자 비밀번호가 설정된 상태에서 로그인 안 됐으면 잠금 화면
  if (adminPasswordHash && !isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <Lock size={40} className="mx-auto mb-4" style={{ color: 'var(--txs)' }} />
        <p className="text-sm mb-6" style={{ color: 'var(--txm)' }}>설정 페이지는 관리자만 접근할 수 있습니다.</p>
        <button className="btn-accent" onClick={openLoginModal}>관리자 로그인</button>
      </div>
    )
  }

  // 메인 비주얼 이미지
  const [mainVisualSrc, setMainVisualSrc] = useState(null)
  useEffect(() => { if (mainVisualImageId) getImage(mainVisualImageId).then(setMainVisualSrc) }, [mainVisualImageId])

  // 관리자 비밀번호 설정
  const [adminPwInput, setAdminPwInput] = useState('')
  const [adminPwConfirm, setAdminPwConfirm] = useState('')
  const [adminPwSuccess, setAdminPwSuccess] = useState(false)

  const saveAdminPassword = async () => {
    if (!adminPwInput.trim()) return
    if (adminPwInput !== adminPwConfirm) { alert('비밀번호가 일치하지 않습니다.'); return }
    const hash = await sha256(adminPwInput.trim())
    setAdminPasswordHash(hash)
    setAdminPwInput(''); setAdminPwConfirm('')
    setAdminPwSuccess(true); setTimeout(() => setAdminPwSuccess(false), 2000)
  }

  const removeAdminPassword = () => {
    setAdminPasswordHash(null)
  }

  // 방명록 비밀번호 설정
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
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--txm)' }}>한 줄 소개</label>
            <input className="input" value={bio} onChange={e => setBio(e.target.value)} placeholder="짧은 자기소개" />
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
          {Object.entries(WIDGET_META).map(([key, { label, hint }]) => (
            <div key={key} className="flex items-center justify-between py-1">
              <div>
                <span className="text-sm" style={{ color: 'var(--tx)' }}>{label}</span>
                <span className="text-xs ml-2" style={{ color: 'var(--txs)' }}>{hint}</span>
              </div>
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

      {/* 관리자 비밀번호 */}
      <SettingSection title="관리자 비밀번호">
        <p className="text-xs mb-3" style={{ color: 'var(--txm)' }}>
          {adminPasswordHash
            ? '비밀번호가 설정되어 있습니다. 방문자는 읽기 전용으로 사이트를 볼 수 있고, 관리자만 글/설정을 수정할 수 있습니다.'
            : '비밀번호를 설정하면 방문자는 읽기 전용, 관리자만 게시글/설정 수정이 가능합니다.'}
        </p>
        <div className="space-y-2">
          <input className="input" type="password" placeholder="새 비밀번호" value={adminPwInput} onChange={e => setAdminPwInput(e.target.value)} />
          <input className="input" type="password" placeholder="비밀번호 확인" value={adminPwConfirm} onChange={e => setAdminPwConfirm(e.target.value)} />
          <div className="flex gap-2 items-center">
            <button className="flex items-center gap-1.5 btn-accent text-sm" onClick={saveAdminPassword}>
              {adminPwSuccess ? <><Check size={13} /> 저장됨</> : '저장'}
            </button>
            {adminPasswordHash && (
              <button className="btn-ghost text-sm" style={{ color: '#f87171' }} onClick={removeAdminPassword}>
                비밀번호 제거 (전체 공개)
              </button>
            )}
          </div>
        </div>
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
