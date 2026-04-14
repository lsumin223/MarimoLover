import { useState, useEffect } from 'react'
import { Edit2, Plus, X, Upload, ExternalLink } from 'lucide-react'
import { getImage, saveImage, resizeImage } from '../../lib/imageDB'

const genId = () => 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)

const AGE_OPTS = ['미성년자', '성인', '비공개']
const MAJOR_OPTS = ['글', '그림', '디자인', '소비', '기타']
const FUB_OPTS = ['O', 'X']
const TENDENCY_OPTS = ['RT', '마음', '일상', '구독', '셀', '연성', '일상트', '욕트', '셋트', '우울트', '담라대화', '잊이']
const GENRE_TENDENCY_OPTS = ['1차', '2차', '드림']

function ChipSelect({ options, value, onChange, multi = false }) {
  const toggle = (opt) => {
    if (multi) onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt])
    else onChange(value === opt ? '' : opt)
  }
  const isActive = (opt) => multi ? value.includes(opt) : value === opt
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => (
        <button key={opt} onClick={() => toggle(opt)}
          className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
          style={isActive(opt) ? { background: 'var(--accent)', color: 'var(--bg)' } : { border: '1px solid var(--border)', color: 'var(--txm)' }}>
          {opt}
        </button>
      ))}
    </div>
  )
}

function LabelRow({ label, children }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="text-sm font-bold shrink-0 pt-0.5" style={{ color: 'var(--tx)', minWidth: 72 }}>{label} |</span>
      <div className="flex-1">{children}</div>
    </div>
  )
}

function GenreCard({ item, editMode, onChange, onImageChange, onRemove }) {
  const [imgSrc, setImgSrc] = useState(null)
  useEffect(() => {
    if (item.imageId) getImage(item.imageId).then(setImgSrc)
    else setImgSrc(null)
  }, [item.imageId])

  return (
    <div className="flex flex-col rounded-xl overflow-hidden relative" style={{ border: '1px solid var(--border)', background: 'var(--elevated)' }}>
      <div className="relative" style={{ paddingTop: '140%' }}>
        <div className="absolute inset-0">
          {imgSrc ? <img src={imgSrc} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full" style={{ background: 'var(--border)' }} />}
          {editMode && (
            <label className="absolute inset-0 flex items-center justify-center cursor-pointer" style={{ background: 'rgba(0,0,0,0.35)' }}>
              <Upload size={16} style={{ color: 'white' }} />
              <input type="file" accept="image/*" className="hidden" onChange={onImageChange} />
            </label>
          )}
        </div>
      </div>
      <div className="p-1.5">
        {editMode ? (
          <>
            <input className="input text-xs py-0.5 px-1.5 mb-1 w-full" placeholder="이름" value={item.title || ''}
              onChange={e => onChange({ title: e.target.value })} />
            <input className="input text-xs py-0.5 px-1.5 w-full" placeholder="카테고리" value={item.subtitle || ''}
              onChange={e => onChange({ subtitle: e.target.value })} />
          </>
        ) : (
          <>
            {item.title && <p className="text-xs font-bold truncate" style={{ color: 'var(--tx)' }}>{item.title}</p>}
            {item.subtitle && <p className="text-xs truncate" style={{ color: 'var(--txs)', fontSize: 10 }}>{item.subtitle}</p>}
          </>
        )}
      </div>
      {editMode && (
        <button className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.55)', color: 'white' }} onClick={onRemove}>
          <X size={10} />
        </button>
      )}
    </div>
  )
}

export default function AboutOtaku({ otaku, updateOtaku, profile }) {
  const [editMode, setEditMode] = useState(false)

  const handleGenreImage = async (e, idx) => {
    const file = e.target.files[0]; if (!file) return
    const b64 = await resizeImage(file, 400)
    const id = genId(); await saveImage(id, b64)
    const next = [...(otaku.genreItems || [])]
    next[idx] = { ...next[idx], imageId: id }
    updateOtaku({ genreItems: next })
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-5 rounded-full" style={{ background: 'var(--accent2)' }} />
          <h2 className="text-base font-bold" style={{ color: 'var(--tx)' }}>오타쿠 설명서</h2>
        </div>
        <button className="btn-ghost flex items-center gap-1 text-sm" onClick={() => setEditMode(v => !v)}>
          <Edit2 size={13} /> {editMode ? '완료' : '편집'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* 프로필 (left) */}
        <div className="space-y-4 p-5 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-bold pb-3 mb-1" style={{ color: 'var(--tx)', borderBottom: '1px solid var(--border)' }}>프로필</h3>

          {(otaku.age || editMode) && (
            <LabelRow label="연령">
              {editMode ? <ChipSelect options={AGE_OPTS} value={otaku.age || ''} onChange={v => updateOtaku({ age: v })} />
                : <span className="text-sm" style={{ color: 'var(--tx)' }}>{otaku.age}</span>}
            </LabelRow>
          )}

          {(otaku.majors?.length > 0 || editMode) && (
            <LabelRow label="전공">
              {editMode ? <ChipSelect options={MAJOR_OPTS} value={otaku.majors || []} onChange={v => updateOtaku({ majors: v })} multi />
                : <div className="flex flex-wrap gap-1">{(otaku.majors || []).map(m => <span key={m} className="tag">{m}</span>)}</div>}
            </LabelRow>
          )}

          {(otaku.fubFree || editMode) && (
            <LabelRow label="FUB FREE">
              {editMode ? <ChipSelect options={FUB_OPTS} value={otaku.fubFree || ''} onChange={v => updateOtaku({ fubFree: v })} />
                : <span className="text-sm" style={{ color: 'var(--tx)' }}>{otaku.fubFree}</span>}
            </LabelRow>
          )}

          {editMode && (
            <textarea className="textarea text-xs" rows={2} placeholder="FUB FREE 설명"
              value={otaku.fubFreeDesc || ''} onChange={e => updateOtaku({ fubFreeDesc: e.target.value })} />
          )}
          {!editMode && otaku.fubFreeDesc && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ color: 'var(--txm)', background: 'var(--elevated)' }}>{otaku.fubFreeDesc}</p>
          )}

          {(otaku.accountTendencies?.length > 0 || editMode) && (
            <LabelRow label="계정 성향">
              {editMode ? <ChipSelect options={TENDENCY_OPTS} value={otaku.accountTendencies || []} onChange={v => updateOtaku({ accountTendencies: v })} multi />
                : <div className="flex flex-wrap gap-1">{(otaku.accountTendencies || []).map(t => <span key={t} className="tag">{t}</span>)}</div>}
            </LabelRow>
          )}

          {editMode && (
            <textarea className="textarea text-xs" rows={2} placeholder="계정 성향 설명"
              value={otaku.accountTendenciesDesc || ''} onChange={e => updateOtaku({ accountTendenciesDesc: e.target.value })} />
          )}
          {!editMode && otaku.accountTendenciesDesc && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ color: 'var(--txm)', background: 'var(--elevated)' }}>{otaku.accountTendenciesDesc}</p>
          )}

          {(otaku.landmines || editMode) && (
            <LabelRow label="지뢰">
              {editMode ? <textarea className="textarea text-xs" rows={3} placeholder="지뢰/불호 소재"
                  value={otaku.landmines || ''} onChange={e => updateOtaku({ landmines: e.target.value })} />
                : <p className="text-sm" style={{ color: 'var(--txm)', whiteSpace: 'pre-wrap' }}>{otaku.landmines}</p>}
            </LabelRow>
          )}

          {(profile.links?.length > 0) && (
            <div className="flex flex-wrap gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              {profile.links.map(link => (
                <a key={link.id} href={link.url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
                  style={{ background: 'var(--elevated)', color: 'var(--tx)', textDecoration: 'none', border: '1px solid var(--border)' }}>
                  {link.label} <ExternalLink size={11} style={{ color: 'var(--txs)' }} />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* 장르 (right) */}
        <div className="space-y-4 p-5 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-bold pb-3 mb-1" style={{ color: 'var(--tx)', borderBottom: '1px solid var(--border)' }}>장르</h3>

          <div className="grid grid-cols-3 gap-2">
            {(otaku.genreItems || []).map((item, idx) => (
              <GenreCard key={item.id} item={item} editMode={editMode}
                onChange={updates => {
                  const next = [...(otaku.genreItems || [])]; next[idx] = { ...next[idx], ...updates }
                  updateOtaku({ genreItems: next })
                }}
                onImageChange={e => handleGenreImage(e, idx)}
                onRemove={() => updateOtaku({ genreItems: (otaku.genreItems || []).filter((_, i) => i !== idx) })}
              />
            ))}
            {editMode && (otaku.genreItems || []).length < 3 && (
              <button className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed text-xs py-8"
                style={{ borderColor: 'var(--border)', color: 'var(--txs)' }}
                onClick={() => updateOtaku({ genreItems: [...(otaku.genreItems || []), { id: genId(), title: '', subtitle: '', imageId: null }] })}>
                <Plus size={18} className="mb-1" /> 추가
              </button>
            )}
          </div>

          {(otaku.genreTendencies?.length > 0 || editMode) && (
            <LabelRow label="장르 성향">
              {editMode ? <ChipSelect options={GENRE_TENDENCY_OPTS} value={otaku.genreTendencies || []} onChange={v => updateOtaku({ genreTendencies: v })} multi />
                : <div className="flex flex-wrap gap-1">{(otaku.genreTendencies || []).map(t => <span key={t} className="tag">{t}</span>)}</div>}
            </LabelRow>
          )}

          {(otaku.dislikedContent || editMode) && (
            <LabelRow label="불호 소재">
              {editMode ? <textarea className="textarea text-xs" rows={3} placeholder="불호 소재 설명"
                  value={otaku.dislikedContent || ''} onChange={e => updateOtaku({ dislikedContent: e.target.value })} />
                : <p className="text-sm" style={{ color: 'var(--txm)', whiteSpace: 'pre-wrap' }}>{otaku.dislikedContent}</p>}
            </LabelRow>
          )}
        </div>
      </div>
    </section>
  )
}
