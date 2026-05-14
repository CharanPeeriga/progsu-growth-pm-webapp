'use client'

import { useState, useRef, useEffect, FC, ReactNode } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface DropdownItem {
  label: string
  value: string
}

interface AnimatedDropdownProps {
  items: DropdownItem[]
  value?: string
  onSelect: (value: string) => void
  placeholder?: string
  loading?: boolean
  className?: string
}

function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  handler: () => void
) {
  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handler()
    }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [ref, handler])
}

interface OnClickOutsideProps {
  children: ReactNode
  onClickOutside: () => void
  className?: string
}

const OnClickOutside: FC<OnClickOutsideProps> = ({
  children,
  onClickOutside,
  className,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  useClickOutside(wrapperRef, onClickOutside)
  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      {children}
    </div>
  )
}

export default function AnimatedDropdown({
  items,
  value,
  onSelect,
  placeholder = 'Select option',
  loading = false,
  className,
}: AnimatedDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selected = items.find((item) => item.value === value)

  return (
    <OnClickOutside
      onClickOutside={() => setIsOpen(false)}
      className={cn('w-full', className)}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-lg border border-input',
          'bg-transparent px-3 py-2 text-sm transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:border-ring',
          'dark:bg-input/20',
          isOpen && 'border-ring ring-2 ring-ring/20'
        )}
      >
        <span className={selected ? 'text-foreground' : 'text-muted-foreground'}>
          {loading ? 'Loading members…' : (selected?.label ?? placeholder)}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              'absolute left-0 top-[calc(100%+4px)] z-50 w-full',
              'max-h-60 overflow-y-auto',
              'rounded-lg border border-border bg-card shadow-xl'
            )}
          >
            {loading || items.length === 0 ? (
              <div className="px-3 py-2.5 text-sm text-muted-foreground">
                {loading ? 'Loading…' : 'No team members found'}
              </div>
            ) : (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.025 } },
                }}
              >
                {items.map((item) => (
                  <motion.button
                    key={item.value}
                    type="button"
                    variants={{
                      hidden: { opacity: 0, x: -8 },
                      visible: { opacity: 1, x: 0 },
                    }}
                    onClick={() => {
                      onSelect(item.value)
                      setIsOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm',
                      'transition-colors duration-100',
                      item.value === value
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted/50'
                    )}
                  >
                    <span className="flex size-3.5 shrink-0 items-center justify-center">
                      {item.value === value && <Check className="size-3.5" />}
                    </span>
                    {item.label}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </OnClickOutside>
  )
}
