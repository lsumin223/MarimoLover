// 관리자 로그인 모달 — 전역 (App.jsx에서 항상 렌더링)
import { useState } from 'react'
import { Lock, Eye, EyeOff, X } from 'lucide-react'
import useAdminStore from '../../store/useAdminStore'
import useSettingsStore from '../../store/useSettingsStore'

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function AdminLoginModal() {
  const { loginModalOpen, closeLoginModal, login } = useAdminStore()
  const adminPasswordHash = useSettingsStore(s => s.adminPasswordHash)

  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState(false)

  if (!loginModalOpen) return null

  const handleClose = () => {
    setPw(''); setError(false); closeLoginModal()
  }

  const handleLogin = async () => {
    if (!pw.trim()) return
    const hash = await sha256(pw.trim())
    if (hash === adminPasswordHash) {
      login()
      handleClose()
    } else {
      setError(true)
      setPw('')
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={handleClose}
    >
      <div
        className="rounded-2xl p-6 w-80 animate-slide-up"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Lock size={16} style={{ color: 'var(--accent)' }} />
            <span className="text-sm font-bold" style={{ color: 'var(--tx)' }}>관리자 로그인</span>
          </div>
          <button onClick={handleClose} style={{ color: 'var(--txm)' }}><X size={16} /></button>
        </div>

        <div className="relative mb-2">
          <input
            className="input pr-9"
            type={show ? 'text' : 'password'}
            value={pw}
            onChange={e => { setPw(e.target.value); setError(false) }}
            placeholder="비밀번호"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            autoFocus
          />
          <button
            className="absolute right-2.5 top-2"
            style={{ color: 'var(--txm)' }}
            onClick={() => setShow(s => !s)}
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>

        {error && (
          <p className="text-xs mb-3" style={{ color: '#f87171' }}>비밀번호가 틀렸습니다.</p>
        )}

        <button
          className="btn-accent w-full mt-4"
          onClick={handleLogin}
        >
          로그인
        </button>
      </div>
    </div>
  )
}
