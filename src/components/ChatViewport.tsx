import { useRef, useEffect, useState, memo } from 'react'
import { ArrowDown } from 'lucide-react'
import type { ChatMessage } from '../lib/chat/types'
import type { AccentTheme } from '../lib/themes'
import { MessageItem } from './MessageItem'
import { VMark } from './VMark'

interface ChatViewportProps {
  messages: ChatMessage[]
  theme: AccentTheme
  isStreaming: boolean
}

export const ChatViewport = memo(function ChatViewport({
  messages,
  theme,
  isStreaming,
}: ChatViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)
  const [showScrollBottom, setShowScrollBottom] = useState(false)

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    const isNearBottom = distanceFromBottom <= 48

    isAtBottomRef.current = isNearBottom
    setShowScrollBottom(!isNearBottom)
  }

  // Bottom anchoring on message update or token stream
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    if (isAtBottomRef.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages, isStreaming])

  const scrollToBottom = () => {
    const el = containerRef.current
    if (!el) return

    if (typeof el.scrollTo === 'function') {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: 'smooth',
      })
    } else {
      el.scrollTop = el.scrollHeight
    }
    isAtBottomRef.current = true
    setShowScrollBottom(false)
  }

  if (messages.length === 0) {
    return (
      <div
        className="relative flex h-full w-full flex-1 items-center justify-center overflow-hidden"
        data-testid="empty-canvas"
      >
        <VMark />
      </div>
    )
  }

  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden py-4 scroll-smooth"
        role="log"
        aria-live="polite"
        aria-label="Conversation history"
      >
        <div className="mx-auto flex max-w-4xl flex-col space-y-3 pb-6">
          {messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} theme={theme} />
          ))}
        </div>
      </div>

      {/* FLOATING RESUME AUTO-SCROLL CONTROL */}
      {showScrollBottom && (
        <div className="pointer-events-none absolute bottom-3 right-6 z-20">
          <button
            type="button"
            onClick={scrollToBottom}
            className="pointer-events-auto flex items-center gap-1.5 rounded-full border bg-[#06121c]/95 px-3 py-1.5 text-xs text-white shadow-xl backdrop-blur-md transition hover:bg-[#0b1c2b]"
            style={{
              borderColor: theme.border,
              boxShadow: `0 0 16px ${theme.glow}`,
            }}
            aria-label="Resume auto-scroll"
          >
            <ArrowDown size={14} style={{ color: theme.primary }} />
            <span className="text-[11px] font-medium text-white/80">
              Resume Auto-Scroll
            </span>
          </button>
        </div>
      )}
    </div>
  )
})
