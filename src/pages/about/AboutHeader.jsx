import { useState, useEffect } from 'react'
import { Edit2, Upload } from 'lucide-react'
import { getImage, saveImage, resizeImage } from '../../lib/imageDB'

const genId = () => 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)

export default function AboutHeader({ otaku, updateOtaku, nickname }) {
  const [editMode, setEditMode] = useState(false)
  const [bannerSrc, setBannerSrc] = useState(null)
  const [profileSrc, setProfileSrc] = useState(null)

  useEffect(() => {
    if (otaku.bannerImageId) getImage(otaku.bannerImageId).then(setBannerSrc)
  }, [otaku.bannerImageId])

  useEffect(() => {
    if (otaku.profileImageId) getImage(otaku.profileImageId).then(setProfileSrc)
  }, [otaku.profileImageId])

  const handleBanner = async (e) => {
    const file = e.target.files[0]; if (!file) return
    const b64 = await resizeImage(file, 1200)
    const id = genId(); await saveImage(id, b64)
    updateOtaku({ bannerImageId: id }); setBannerSrc(b64)
  }

  const handleProfileImg = async (e) => {
    const file = e.target.files[0]; if (!file) return
    const b64 = await resizeImage(file, 400)
    const id = genId(); await saveImage(id, b64)
    updateOtaku({ profileImageId: id }); setProfileSrc(b64)
  }

  return (
    <div className="relative">
      {/* 배너 */}
      <div className="relative w-full overflow-hidden" style={{ height: 180 }}>
        {bannerSrc
          ? <img src={bannerSrc} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 30%, var(--bg)), var(--bg))' }} />
        }
        {editMode && (
          <label className="absolute inset-0 flex items-center justify-center cursor-pointer" style={{ background: 'rgba(0,0,0,0.35)' }}>
            <span className="flex items-center gap-1.5 text-white text-xs font-medium"><Upload size={14} /> 배너 이미지 변경</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleBanner} />
          </label>
        )}
      </div>

      {/* 프로필 영역 */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-end gap-4 relative" style={{ marginTop: -40 }}>
          {/* 원형 프로필 사진 */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center font-bold text-2xl"
              style={{ background: 'var(--elevated)', color: 'var(--accent)', border: '4px solid var(--bg)' }}>
              {profileSrc
                ? <img src={profileSrc} alt="" className="w-full h-full object-cover" />
                : nickname?.[0] || '?'}
            </div>
            {editMode && (
              <label className="absolute inset-0 rounded-full flex items-center justify-center cursor-pointer" style={{ background: 'rgba(0,0,0,0.4)' }}>
                <Upload size={14} style={{ color: 'white' }} />
                <input type="file" accept="image/*" className="hidden" onChange={handleProfileImg} />
              </label>
            )}
          </div>

          {/* 말풍선 */}
          {(otaku.shortBio || editMode) && (
            <div className="relative mb-2 px-3 py-2 rounded-xl text-xs max-w-xs"
              style={{ background: 'var(--accent)', color: 'var(--bg)' }}>
              {editMode
                ? <input className="bg-transparent outline-none text-xs w-full" style={{ color: 'var(--bg)' }}
                    placeholder="간단히 할 말" value={otaku.shortBio || ''}
                    onChange={e => updateOtaku({ shortBio: e.target.value })} />
                : <span>{otaku.shortBio}</span>
              }
              <div className="absolute" style={{ left: -8, bottom: 10, width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderRight: '8px solid var(--accent)' }} />
            </div>
          )}

          <div className="ml-auto mb-2">
            <button className="btn-ghost flex items-center gap-1 text-xs" onClick={() => setEditMode(v => !v)}>
              <Edit2 size={12} /> {editMode ? '완료' : '편집'}
            </button>
          </div>
        </div>

        {/* 닉네임 + 핸들 */}
        <div className="mt-3 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
          {editMode ? (
            <div className="flex flex-wrap gap-2">
              <input className="input text-sm" placeholder="영어 닉네임" value={otaku.englishNickname || ''}
                onChange={e => updateOtaku({ englishNickname: e.target.value })} style={{ width: 160 }} />
              <input className="input text-sm" placeholder="@아이디" value={otaku.handle || ''}
                onChange={e => updateOtaku({ handle: e.target.value })} style={{ width: 130 }} />
            </div>
          ) : (
            <div>
              <span className="text-xl font-bold" style={{ color: 'var(--tx)' }}>{nickname}</span>
              {otaku.englishNickname && <span className="text-sm ml-2" style={{ color: 'var(--txm)' }}>/ {otaku.englishNickname}</span>}
              {otaku.handle && <div className="text-xs mt-0.5" style={{ color: 'var(--txs)' }}>{otaku.handle}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
