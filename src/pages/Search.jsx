// 전체 검색 — 캐릭터 / 글 / 갤러리 / TRPG 섹션별 표시
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search as SearchIcon, FileText, Image, Users, Gamepad2, X } from 'lucide-react'
import useWritingStore from '../store/useWritingStore'
import useGalleryStore from '../store/useGalleryStore'
import useCharacterStore from '../store/useCharacterStore'
import useTrpgStore from '../store/useTrpgStore'

// 검색어 하이라이트
function highlight(text, keyword) {
  if (!keyword || !text) return text
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.split(regex).map((part, i) =>
    regex.test(part)
      ? <mark key={i} style={{ background: 'color-mix(in srgb, var(--accent) 30%, transparent)', color: 'var(--tx)', borderRadius: 2, padding: '0 2px' }}>{part}</mark>
      : part
  )
}

function excerpt(text, keyword, maxLen = 120) {
  if (!text) return ''
  const lower = text.toLowerCase()
  const idx = keyword ? lower.indexOf(keyword) : 0
  const start = Math.max(0, idx - 30)
  const slice = text.slice(start, start + maxLen)
  return (start > 0 ? '…' : '') + slice + (start + maxLen < text.length ? '…' : '')
}

// 섹션 래퍼
function Section({ icon, label, color, count, children }) {
  if (count === 0) return null
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color }}>{icon}</span>
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--txm)' }}>{label}</span>
        <span className="text-xs" style={{ color: 'var(--txs)' }}>({count})</span>
      </div>
      <div className="space-y-2 mb-5">{children}</div>
    </div>
  )
}

function ResultCard({ onClick, children }) {
  return (
    <div className="p-4 rounded-xl cursor-pointer transition-all"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      onClick={onClick}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
      {children}
    </div>
  )
}

export default function Search() {
  const navigate = useNavigate()
  const { writings, series } = useWritingStore()
  const { posts } = useGalleryStore()
  const { characters } = useCharacterStore()
  const { sessions, campaigns } = useTrpgStore()

  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const campaignMap = useMemo(() => {
    const map = {}
    ;(campaigns || []).forEach(c => { map[c.id] = c.title || c.name || '' })
    return map
  }, [campaigns])

  const characterResults = useMemo(() => {
    if (!q) return []
    return characters.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.bio || '').toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q) ||
      (c.members || []).some(m => m.name?.toLowerCase().includes(q))
    )
  }, [q, characters])

  const writingResults = useMemo(() => {
    if (!q) return []
    return writings.filter(w =>
      w.title?.toLowerCase().includes(q) ||
      w.content?.toLowerCase().includes(q) ||
      (w.tags || []).some(t => t.toLowerCase().includes(q))
    ).map(w => {
      const s = series.find(s => s.id === w.seriesId)
      return { ...w, _seriesTitle: s?.title || '' }
    })
  }, [q, writings, series])

  const galleryResults = useMemo(() => {
    if (!q) return []
    return posts.filter(p =>
      p.title?.toLowerCase().includes(q) ||
      (p.tags || []).some(t => t.toLowerCase().includes(q))
    )
  }, [q, posts])

  const trpgResults = useMemo(() => {
    if (!q) return []
    return (sessions || []).filter(s =>
      s.title?.toLowerCase().includes(q) ||
      s.summary?.toLowerCase().includes(q) ||
      (s.plCharacters || []).some(p => p.name?.toLowerCase().includes(q))
    ).map(s => ({ ...s, _campaignName: campaignMap[s.campaignId] || '' }))
  }, [q, sessions, campaignMap])

  const totalCount = characterResults.length + writingResults.length + galleryResults.length + trpgResults.length

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--tx)' }}>검색</h1>

      {/* 검색 입력 */}
      <div className="relative mb-6">
        <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--txs)' }} />
        <input
          autoFocus
          className="input w-full pl-9 pr-9"
          placeholder="캐릭터, 글, 갤러리, TRPG 통합 검색..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {query && (
          <button className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--txs)' }} onClick={() => setQuery('')}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* 결과 */}
      {q && (
        <div>
          <p className="text-xs mb-5" style={{ color: 'var(--txs)' }}>
            "{query}" 검색 결과 — 총 {totalCount}건
          </p>

          {totalCount === 0 ? (
            <div className="text-center py-16 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--txs)' }}>
              <SearchIcon size={32} className="mx-auto mb-3 opacity-30" />
              <p>검색 결과가 없습니다.</p>
            </div>
          ) : (
            <>
              {/* 캐릭터 */}
              <Section icon={<Users size={13} />} label="캐릭터" color="var(--accent)" count={characterResults.length}>
                {characterResults.map(c => (
                  <ResultCard key={c.id} onClick={() => navigate('/characters')}>
                    <div className="flex items-center gap-2 mb-1">
                      <Users size={13} style={{ color: 'var(--accent)' }} />
                      <span className="text-xs" style={{ color: 'var(--txs)' }}>{c.type === 'individual' ? '개인' : '그룹'}</span>
                    </div>
                    <p className="text-sm font-medium" style={{ color: 'var(--tx)' }}>
                      {highlight(c.name || (c.members||[]).map(m=>m.name).join(' × '), q)}
                    </p>
                    {(c.bio || c.description) && (
                      <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--txm)' }}>
                        {highlight(excerpt(c.bio || c.description, q), q)}
                      </p>
                    )}
                  </ResultCard>
                ))}
              </Section>

              {/* 글 */}
              <Section icon={<FileText size={13} />} label="글" color="var(--accent2)" count={writingResults.length}>
                {writingResults.map(w => (
                  <ResultCard key={w.id} onClick={() => navigate(`/writings/${w.id}`)}>
                    <div className="flex items-center gap-2 mb-1">
                      <FileText size={13} style={{ color: 'var(--accent2)' }} />
                      <span className="text-xs" style={{ color: 'var(--txs)' }}>
                        {w._seriesTitle}{w.chapterNum ? ` · ${w.chapterNum}화` : ''}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--tx)' }}>{highlight(w.title, q)}</p>
                    {w.content && (
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--txm)' }}>
                        {highlight(excerpt(w.content, q), q)}
                      </p>
                    )}
                    <span className="text-xs mt-2 block" style={{ color: 'var(--txs)' }}>{w.date}</span>
                  </ResultCard>
                ))}
              </Section>

              {/* 갤러리 */}
              <Section icon={<Image size={13} />} label="갤러리" color="var(--accent)" count={galleryResults.length}>
                {galleryResults.map(p => (
                  <ResultCard key={p.id} onClick={() => navigate(`/gallery/${p.id}`)}>
                    <div className="flex items-center gap-2 mb-1">
                      <Image size={13} style={{ color: 'var(--accent)' }} />
                      <span className="text-xs" style={{ color: 'var(--txs)' }}>갤러리</span>
                      {p.passwordHash && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}>잠금</span>}
                    </div>
                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--tx)' }}>{highlight(p.title, q)}</p>
                    {(p.tags || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.tags.map(t => (
                          <span key={t} className="tag text-xs"
                            style={t.toLowerCase().includes(q) ? { background: 'color-mix(in srgb, var(--accent) 20%, transparent)', color: 'var(--accent)' } : {}}>
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                    <span className="text-xs mt-2 block" style={{ color: 'var(--txs)' }}>{p.date}</span>
                  </ResultCard>
                ))}
              </Section>

              {/* TRPG */}
              <Section icon={<Gamepad2 size={13} />} label="TRPG" color="var(--txm)" count={trpgResults.length}>
                {trpgResults.map(s => (
                  <ResultCard key={s.id} onClick={() => navigate('/trpg')}>
                    <div className="flex items-center gap-2 mb-1">
                      <Gamepad2 size={13} style={{ color: 'var(--txm)' }} />
                      <span className="text-xs" style={{ color: 'var(--txs)' }}>
                        {s._campaignName}{s.sessionNumber ? ` · ${s.sessionNumber}회차` : ''}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--tx)' }}>{highlight(s.title || '(제목 없음)', q)}</p>
                    {s.summary && (
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--txm)' }}>
                        {highlight(excerpt(s.summary, q), q)}
                      </p>
                    )}
                    {(s.plCharacters || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {s.plCharacters.map(p => (
                          <span key={p.id} className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{ background: 'color-mix(in srgb, var(--accent2) 12%, transparent)', color: 'var(--accent2)' }}>
                            {p.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <span className="text-xs mt-2 block" style={{ color: 'var(--txs)' }}>{(s.date || '').slice(0, 10)}</span>
                  </ResultCard>
                ))}
              </Section>
            </>
          )}
        </div>
      )}

      {!q && (
        <div className="text-center py-20" style={{ color: 'var(--txs)' }}>
          <SearchIcon size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">검색어를 입력해주세요.</p>
          <p className="text-xs mt-1">캐릭터, 글, 갤러리, TRPG 세션을 검색합니다.</p>
        </div>
      )}
    </div>
  )
}
