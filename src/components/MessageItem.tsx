import { memo } from 'react'
import { AlertTriangle, Bot } from 'lucide-react'
import type { ChatMessage } from '../lib/chat/types'
import type { AccentTheme } from '../lib/themes'
import { MarkdownView } from './MarkdownView'

interface MessageItemProps {
  message: ChatMessage
  theme: AccentTheme
}

export const MessageItem = memo(function MessageItem({
  message,
  theme,
}: MessageItemProps) {
  const isUser = message.role === 'user'
  const isThinking = message.status === 'thinking'
  const isError = message.status === 'error'
  const isStreaming = message.status === 'streaming'

  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (isUser) {
    return (
      <div className="flex w-full justify-end px-3 py-1.5 sm:px-4">
        <div className="flex max-w-[85%] flex-col items-end gap-1 sm:max-w-[75%]">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/40">
            <span>You</span>
            <span>•</span>
            <span>{formattedTime}</span>
          </div>
          <div
            className="rounded-2xl border bg-[#06121d]/90 px-4 py-2.5 text-sm leading-relaxed text-white shadow-lg"
            style={{
              borderColor: theme.border,
            }}
          >
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          </div>
        </div>
      </div>
    )
  }

  // Assistant Message
  return (
    <div className="flex w-full justify-start px-3 py-2 sm:px-4">
      <div className="flex max-w-[92%] items-start gap-3 sm:max-w-[85%]">
        {/* AVATAR BADGE */}
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border bg-[#04090e]/90 shadow-sm"
          style={{
            borderColor: theme.border,
            color: theme.primary,
          }}
        >
          <Bot size={16} strokeWidth={1.8} />
        </div>

        {/* CONTENT BUBBLE */}
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: theme.primary }}
            >
              V-Core Neural
            </span>
            <span className="text-[10px] text-white/30">•</span>
            <span className="text-[10px] text-white/40">{formattedTime}</span>

            {isStreaming && (
              <span className="flex items-center gap-1 rounded bg-white/5 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-white/60">
                <span
                  className="h-1.5 w-1.5 animate-pulse rounded-full"
                  style={{ background: theme.primary }}
                />
                Streaming
              </span>
            )}
          </div>

          <div
            className="rounded-2xl border bg-[#04090e]/80 p-4 shadow-xl backdrop-blur-md"
            style={{
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            {isThinking && (
              <div className="flex items-center gap-2 py-1 text-xs text-white/50">
                <div
                  className="h-2 w-2 animate-ping rounded-full"
                  style={{ background: theme.primary }}
                />
                <span className="font-mono text-[11px] uppercase tracking-wider">
                  Synthesizing neural weights...
                </span>
              </div>
            )}

            {isError && (
              <div className="space-y-2">
                {message.content && (
                  <MarkdownView
                    content={message.content}
                    accentColor={theme.primary}
                  />
                )}
                <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-200">
                  <AlertTriangle
                    size={16}
                    className="mt-0.5 shrink-0 text-red-400"
                  />
                  <div>
                    <div className="font-semibold uppercase tracking-wider text-red-400">
                      Pipeline Interruption
                    </div>
                    <div className="mt-0.5 text-red-300/80">
                      {message.error || 'Operation failed during stream transmission.'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isThinking && !isError && (
              <div>
                <MarkdownView
                  content={message.content}
                  accentColor={theme.primary}
                />
                {isStreaming && (
                  <span
                    className="inline-block h-3.5 w-1.5 animate-pulse align-middle"
                    style={{ background: theme.primary }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
