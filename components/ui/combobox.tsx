'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Check, X, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ComboboxItem {
  label: string
  value: string
  hint?: string
  color?: string
}

interface ComboboxProps {
  items: ComboboxItem[]
  value?: string
  onSelect: (value: string) => void
  onClear?: () => void
  placeholder?: string
  loading?: boolean
  className?: string
}

export default function Combobox({
  items,
  value,
  onSelect,
  onClear,
  placeholder = 'Search or select member…',
  loading = false,
  className,
}: ComboboxProps) {
  const selected = items.find((i) => i.value === value)
  const [query, setQuery] = useState(selected?.label ?? '')
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Keep input text in sync when value changes externally (e.g. form reset)
  useEffect(() => {
    setQuery(selected?.label ?? '')
  }, [selected?.label])

  const filtered = items.filter((i) =>
    i.label.toLowerCase().includes(query.toLowerCase())
  )

  const handleSelect = useCallback(
    (item: ComboboxItem) => {
      onSelect(item.value)
      setQuery(item.label)
      setOpen(false)
    },
    [onSelect]
  )

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onClear?.()
      setQuery('')
      setOpen(false)
      inputRef.current?.focus()
    },
    [onClear]
  )

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
        // If nothing selected, reset text to previously selected label
        setQuery(selected?.label ?? '')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [selected?.label])

  return (
    <div ref={wrapperRef} className={cn('relative w-full', className)}>
      {/* Input trigger */}
      <div
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-control border border-[rgba(255,255,255,0.09)] bg-[#12151C] px-3',
          'text-[13.5px] transition-[border-color,box-shadow,background] duration-[160ms] ease-standard',
          'hover:border-[rgba(255,255,255,0.14)]',
          open && 'border-[rgba(107,138,253,0.55)] shadow-[0_0_0_3px_rgba(107,138,253,0.18)]'
        )}
      >
        <input
          ref={inputRef}
          type="text"
          className="flex-1 bg-transparent outline-none placeholder:text-[#4E5665] text-[#E8EBF2]"
          placeholder={loading ? 'Loading members…' : placeholder}
          value={query}
          disabled={loading}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
        />
        {value && onClear ? (
          <button
            type="button"
            onClick={handleClear}
            className="ml-1 shrink-0 text-[#6E7686] hover:text-[#E8EBF2] transition-colors"
          >
            <X size={14} />
          </button>
        ) : (
          <ChevronsUpDown
            size={14}
            className="shrink-0 text-[#6E7686]"
          />
        )}
      </div>

      {/* Dropdown */}
      {open && !loading && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-full max-h-[264px] overflow-y-auto rounded-[12px] border border-[rgba(255,255,255,0.09)] bg-[#171B23] shadow-popover p-1">
          {filtered.length === 0 ? (
            <div className="py-6 text-center text-[13px] text-[#6E7686]">
              {query ? 'No members match' : 'No members found'}
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.value}
                type="button"
                onMouseDown={(e) => e.preventDefault()} // prevent input blur before click
                onClick={() => handleSelect(item)}
                className={cn(
                  'relative flex h-8 w-full cursor-pointer items-center gap-2 rounded-chip px-2.5 text-left text-[13px] transition-colors duration-100',
                  item.value === value
                    ? 'bg-[rgba(107,138,253,0.10)] text-[#C7D1FE]'
                    : 'text-[#A7B0C0] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#E8EBF2]'
                )}
              >
                {item.color && (
                  <span
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                )}
                <span className="flex-1 truncate">{item.label}</span>
                {item.hint && (
                  <span className="t-caption text-[#6E7686] shrink-0">{item.hint}</span>
                )}
                {item.value === value && (
                  <Check size={14} className="shrink-0 text-[#8099FE]" />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
