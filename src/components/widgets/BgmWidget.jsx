// BGM 플레이어 위젯 — 유튜브/외부 URL 플레이리스트
import { useState, useRef, useEffect } from 'react'
import { GripVertical, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Plus, X, Music, List } from 'lucide-react'
import useBgmStore from '../../store/useBgmStore'

export default function BgmWidget() {
  const {
    tracks, currentIndex, isPlaying, volume,
    addTrack, removeTrack,
    setCurrentIndex, setIsPlaying, setVolume,
    nextTrack, prevTrack,
  } = useBgmStore()

  const audioRef = useRef(null)
  const [showList, setShowList] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [addTitle, setAddTitle] = useState('')
  const [addUrl, setAddUrl] = useState('')
  const [muted, setMuted] = useState(false)

  const currentTrack = tracks[currentIndex] || null

  // 트랙 변경 시 src 업데이트 & 재생
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return
    audio.src = currentTrack.url
    audio.volume = volume
    if (isPlaying) audio.play().catch(() => setIsPlaying(false))
    else audio.pause()
  }, [currentIndex, currentTrack])

  // isPlaying 변경 시 재생/일시정지
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) audio.play().catch(() => setIsPlaying(false))
    else audio.pause()
  }, [isPlaying])

  // 볼륨 변경
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume
    }
  }, [volume, muted])

  const handleEnded = () => {
    if (tracks.length > 1) nextTrack()
    else setIsPlaying(false)
  }

  const handlePlay = () => {
    if (!currentTrack) return
    setIsPlaying(!isPlaying)
  }

  const handlePrev = () => {
    prevTrack()
    if (!isPlaying) setIsPlaying(true)
  }

  const handleNext = () => {
    nextTrack()
    if (!isPlaying) setIsPlaying(true)
  }

  const handleTrackSelect = (idx) => {
    setCurrentIndex(idx)
    setIsPlaying(true)
    setShowList(false)
  }

  const handleAddTrack = () => {
    if (!addTitle.trim() || !addUrl.trim()) return
    addTrack(addTitle.trim(), addUrl.trim())
    setAddTitle(''); setAddUrl('')
    setShowAdd(false)
  }

  return (
    <div className="widget animate-fade-in">
      <audio ref={audioRef} onEnded={handleEnded} preload="none" />

      <div className="widget-header">
        <GripVertical size={14} className="drag-handle" style={{ color: 'var(--txs)' }} />
        <span className="widget-header-dot" />
        BGM
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => { setShowList(v => !v); setShowAdd(false) }}
            style={{ color: showList ? 'var(--accent)' : 'var(--txs)' }}>
            <List size={13} />
          </button>
          <button onClick={() => { setShowAdd(v => !v); setShowList(false) }}
            style={{ color: showAdd ? 'var(--accent)' : 'var(--txs)' }}>
            <Plus size={13} />
          </button>
        </div>
      </div>

      <div className="widget-body">
        {/* 현재 트랙 정보 */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
            style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}>
            <Music size={14} style={{ color: 'var(--accent)' }} />
          </div>
          <div className="flex-1 min-w-0">
            {currentTrack ? (
              <>
                <p className="text-xs font-medium truncate" style={{ color: 'var(--tx)' }}>{currentTrack.title}</p>
                <p className="text-xs truncate" style={{ color: 'var(--txs)' }}>{currentIndex + 1} / {tracks.length}</p>
              </>
            ) : (
              <p className="text-xs" style={{ color: 'var(--txs)' }}>트랙이 없습니다</p>
            )}
          </div>
        </div>

        {/* 컨트롤 버튼 */}
        <div className="flex items-center justify-center gap-4 mb-3">
          <button onClick={handlePrev} disabled={tracks.length === 0}
            style={{ color: tracks.length === 0 ? 'var(--txs)' : 'var(--txm)', opacity: tracks.length === 0 ? 0.4 : 1 }}>
            <SkipBack size={16} />
          </button>
          <button onClick={handlePlay} disabled={!currentTrack}
            className="flex items-center justify-center w-9 h-9 rounded-full transition-all"
            style={{
              background: currentTrack ? 'var(--accent)' : 'var(--surface)',
              color: currentTrack ? 'var(--bg)' : 'var(--txs)',
              opacity: !currentTrack ? 0.5 : 1,
            }}>
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button onClick={handleNext} disabled={tracks.length === 0}
            style={{ color: tracks.length === 0 ? 'var(--txs)' : 'var(--txm)', opacity: tracks.length === 0 ? 0.4 : 1 }}>
            <SkipForward size={16} />
          </button>
        </div>

        {/* 볼륨 슬라이더 */}
        <div className="flex items-center gap-2">
          <button onClick={() => setMuted(v => !v)} style={{ color: 'var(--txs)' }}>
            {muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </button>
          <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
            onChange={e => { setVolume(Number(e.target.value)); setMuted(false) }}
            className="flex-1" style={{ accentColor: 'var(--accent)', height: 3 }} />
        </div>

        {/* 트랙 목록 */}
        {showList && (
          <div className="mt-3 pt-3 animate-slide-up" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--txm)' }}>플레이리스트</p>
            {tracks.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--txs)' }}>트랙이 없습니다.</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {tracks.map((t, i) => (
                  <div key={t.id} className="flex items-center gap-2 group rounded px-1 py-0.5 transition-colors"
                    style={{ background: i === currentIndex ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent' }}>
                    <button className="flex-1 text-left text-xs truncate"
                      style={{ color: i === currentIndex ? 'var(--accent)' : 'var(--txm)' }}
                      onClick={() => handleTrackSelect(i)}>
                      {i === currentIndex && isPlaying ? '▶ ' : ''}{t.title}
                    </button>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      style={{ color: 'var(--txs)' }} onClick={() => removeTrack(t.id)}>
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 트랙 추가 폼 */}
        {showAdd && (
          <div className="mt-3 pt-3 space-y-2 animate-slide-up" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-xs font-medium" style={{ color: 'var(--txm)' }}>트랙 추가</p>
            <input className="input w-full text-xs" placeholder="트랙 제목" value={addTitle}
              onChange={e => setAddTitle(e.target.value)} style={{ fontSize: 11 }} />
            <input className="input w-full text-xs" placeholder="오디오 URL (.mp3, .ogg 등)" value={addUrl}
              onChange={e => setAddUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddTrack()}
              style={{ fontSize: 11 }} />
            <div className="flex gap-2">
              <button className="btn-accent flex-1 text-xs py-1" onClick={handleAddTrack}>추가</button>
              <button className="btn-ghost text-xs py-1" onClick={() => setShowAdd(false)}>취소</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
