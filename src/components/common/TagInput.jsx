import { useState } from 'react'
import { X } from 'lucide-react'

export default function TagInput({ tags = [], onChange, placeholder = '태그 입력 후 Enter' }) {
  const [input, setInput] = useState('')

  const add = (val) => {
    const t = val.trim()
    if (t && !tags.includes(t)) onChange([...tags, t])
    setInput('')
  }

  return (
    <div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {tags.map(t => (
            <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
              style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)' }}>
              {t}
              <button type="button" onClick={() => onChange(tags.filter(x => x !== t))}>
                <X size={9} />
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        className="input text-sm"
        placeholder={placeholder}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input) }
          if (e.key === 'Backspace' && !input && tags.length > 0) onChange(tags.slice(0, -1))
        }}
        onBlur={() => { if (input.trim()) add(input) }}
      />
    </div>
  )
}
