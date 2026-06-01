'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Check, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ComboboxItem {
  label: string
  value: string
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
      <div className={cn(
        'flex h-10 w-full items-center rounded-lg border border-input bg-transparent px-3',
        'text-sm transition-colors dark:bg-input/20',
        open && 'border-ring ring-2 ring-ring/20',
      )}>
        <input
          ref={inputRef}
          type="text"
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-foreground"
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
            className="ml-1 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={14} />
          </button>
        ) : (
          <ChevronDown
            size={14}
            className={cn(
              'shrink-0 text-muted-foreground transition-transform duration-200',
              open && 'rotate-180',
            )}
          />
        )}
      </div>

      {/* Dropdown */}
      {open && !loading && (
        <div className={cn(
          'absolute left-0 top-[calc(100%+4px)] z-50 w-full',
          'max-h-60 overflow-y-auto rounded-lg border border-border bg-card shadow-xl',
        )}>
          {filtered.length === 0 ? (
            <div className="px-3 py-2.5 text-sm text-muted-foreground">
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
                  'flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors duration-100',
                  item.value === value
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-muted/50',
                )}
              >
                <span className="flex size-3.5 shrink-0 items-center justify-center">
                  {item.value === value && <Check size={13} />}
                </span>
                {item.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
