import {
  useState,
  useRef,
  useEffect,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react'
import { motion } from 'motion/react'
import { ArrowUp, Square } from 'lucide-react'
import type { AccentTheme } from '../lib/themes'
import { uiSounds } from '../lib/uiSounds'

interface ComposerProps {
  onSend: (message: string) => void
  onStop: () => void
  isStreaming: boolean
  theme: AccentTheme
}

export function Composer({
  onSend,
  onStop,
  isStreaming,
  theme,
}: ComposerProps) {
  const [draft, setDraft] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lastTypingSound = useRef(0)

  // Auto-resize textarea height
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const newHeight = Math.min(el.scrollHeight, 180)
    el.style.height = `${Math.max(newHeight, 38)}px`
  }, [draft])

  const playTypingSound = () => {
    const now = performance.now()
    if (now - lastTypingSound.current < 35) return
    lastTypingSound.current = now
    uiSounds.play('typing')
  }

  const handleSend = () => {
    const trimmed = draft.trim()
    if (!trimmed) {
      uiSounds.play('click')
      return
    }

    uiSounds.play('send')
    onSend(trimmed)
    setDraft('')

    if (textareaRef.current) {
      textareaRef.current.style.height = '38px'
    }
  }

  const handleStop = () => {
    uiSounds.play('click')
    onStop()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (isStreaming) {
        handleStop()
      } else {
        handleSend()
      }
      return
    }

    // Audio feedback on typing
    if (e.ctrlKey || e.metaKey || e.altKey) return
    const isTypingKey =
      e.key.length === 1 ||
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === ' ' ||
      e.key === 'Tab'

    if (isTypingKey) {
      playTypingSound()
    }
  }

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value)
    playTypingSound()
  }

  return (
    <div className="relative z-10 p-3 sm:p-5">
      <motion.div
        className="flex items-end gap-2.5 rounded-2xl border bg-[#03080c]/85 px-3.5 py-2 shadow-[0_0_25px_rgba(0,0,0,0.18)] focus-within:bg-[#040a0f]/95"
        style={{
          borderColor: theme.border,
        }}
      >
        <textarea
          ref={textareaRef}
          rows={1}
          aria-label="Message prompt"
          value={draft}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            void uiSounds.unlock()
          }}
          placeholder="Enter command or query (Enter to send, Shift+Enter for newline)..."
          className="max-h-[180px] min-h-[38px] min-w-0 flex-1 resize-none bg-transparent py-1.5 text-sm leading-relaxed text-white outline-none placeholder:text-white/20"
        />

        {isStreaming ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={handleStop}
            className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-500/40 bg-red-950/30 text-red-400 transition hover:bg-red-900/40"
            aria-label="Stop generating response"
            title="Stop generation"
          >
            <Square size={15} fill="currentColor" />
          </motion.button>
        ) : (
          <motion.button
            whileHover={{
              scale: 1.05,
              boxShadow: `0 0 16px ${theme.glow}`,
            }}
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={handleSend}
            disabled={!draft.trim()}
            className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-white/[0.03] transition-colors disabled:cursor-not-allowed disabled:opacity-25"
            style={{
              borderColor: theme.border,
              color: theme.primary,
            }}
            aria-label="Send message"
            title="Send (Enter)"
          >
            <ArrowUp size={16} strokeWidth={2} />
          </motion.button>
        )}
      </motion.div>
    </div>
  )
}
