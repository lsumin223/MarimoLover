// 전체 검색 — 글 + 갤러리 통합 검색
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search as SearchIcon, FileText, Image, X } from 'lucide-react'
import useWritingStore from '../store/useWritingStore'
import useGalleryStore from '../store/useGalleryStore'

export default function Search() {
  const navigate = useNavigate()
  const { writings, series } = useWritingStore()
  const { posts } = useGalleryStore()

  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()

  const writingResults = useMemo(() => {
    if (!q) return []
    return writings.filter(w =>
      w.title?.toLowerCase().includes(q) ||
      w.content?.toLowerCase().includes(q)
    ).map(w => {
      const s = series.find(s => s.id === w.seriesId)
      return { ...w, _type: 'writing', _seriesTitle: s?.title || '' }
    })
  }, [q, writings, series])

  const galleryResults = useMemo(() => {
    if (!q) return []
    return posts.filter(p =>
      p.title?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      (p.tags || []).some(t => t.toLowerCase().includes(q))
    ).map(p => ({ ...p, _type: 'gallery' }))
  }, [q, posts])

  const totalCount = writingResults.length + galleryResults.length

  // 검색어 하이라이트
  const highlight = (text, keyword) => {
    if (!keyword || !text) return text
    const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) =>
      regex.test(part)
        ? <mark key={i} style={{ background: 'color-mix(in srgb, var(--accent) 30%, transparent)', color: 'var(--tx)', borderRadius: 2, padding: '0 2px' }}>{part}</mark>
        : part
    )
  }

  const excerpt = (text, keyword, maxLen = 120) => {
    if (!text) return ''
    const lower = text.toLowerCase()
    const idx = keyword ? lower.indexOf(keyword) : 0
    const start = Math.max(0, idx - 30)
    const slice = text.slice(start, start + maxLen)
    return (start > 0 ? '…' : '') + slice + (start + maxLen < text.length ? '…' : '')
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--tx)' }}>검색</h1>

      {/* 검색 입력 */}
      <div className="relative mb-6">
        <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--txs)' }} />
        <input
          autoFocus
          className="input w-full pl-9 pr-9"
          placeholder="글 제목, 내용, 갤러리 태그 등으로 검색..."
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
          <p className="text-xs mb-4" style={{ color: 'var(--txs)' }}>
            "{query}" 검색 결과 — 총 {totalCount}건 (글 {writingResults.length}, 갤러리 {galleryResults.length})
          </p>

          {totalCount === 0 ? (
            <div className="text-center py-16 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--txs)' }}>
              <SearchIcon size={32} className="mx-auto mb-3 opacity-30" />
              <p>검색 결과가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* 글 결과 */}
              {writingResults.map(w => (
                <div key={w.id} className="p-4 rounded-xl cursor-pointer transition-all"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                  onClick={() => navigate(`/writings/${w.id}`)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  <div className="flex items-center gap-2 mb-1">
                    <FileText size={13} style={{ color: 'var(--accent)', shrink: 0 }} />
                    <span className="text-xs" style={{ color: 'var(--txs)' }}>글{w._seriesTitle ? ` · ${w._seriesTitle}` : ''}{w.chapterNum ? ` · ${w.chapterNum}화` : ''}</span>
                  </div>
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--tx)' }}>{highlight(w.title, q)}</p>
                  {w.content && (
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--txm)' }}>
                      {highlight(excerpt(w.content, q), q)}
                    </p>
                  )}
                  <span className="text-xs mt-2 block" style={{ color: 'var(--txs)' }}>{w.date}</span>
                </div>
              ))}

              {/* 갤러리 결과 */}
              {galleryResults.map(p => (
                <div key={p.id} className="p-4 rounded-xl cursor-pointer transition-all"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                  onClick={() => navigate(`/gallery/${p.id}`)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  <div className="flex items-center gap-2 mb-1">
                    <Image size={13} style={{ color: 'var(--accent2)', shrink: 0 }} />
                    <span className="text-xs" style={{ color: 'var(--txs)' }}>갤러리</span>
                    {p.passwordHash && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}>잠금</span>}
                  </div>
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--tx)' }}>{highlight(p.title, q)}</p>
                  {p.description && (
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--txm)' }}>
                      {highlight(excerpt(p.description, q), q)}
                    </p>
                  )}
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
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!q && (
        <div className="text-center py-20" style={{ color: 'var(--txs)' }}>
          <SearchIcon size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">검색어를 입력해주세요.</p>
          <p className="text-xs mt-1">글 제목, 본문, 갤러리 제목 및 태그를 검색합니다.</p>
        </div>
      )}
    </div>
  )
}
