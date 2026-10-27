import { useSyncExternalStore } from 'react'
import type { ChatEngine, ChatMessage } from './types'
import { MockChatEngine } from './mockEngine'

const STORAGE_KEY = 'ai-ui-chat-history'

interface ChatState {
  messages: ChatMessage[]
  isStreaming: boolean
  streamingMessageId: string | null
}

function loadPersistedMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Sanitize and ensure no lingering thinking/streaming status from previous crash
    return parsed.map((m: any) => ({
      id: String(m.id || crypto.randomUUID()),
      role: m.role === 'user' ? 'user' : 'assistant',
      content: String(m.content || ''),
      status: m.status === 'error' ? 'error' : 'completed',
      createdAt: Number(m.createdAt || Date.now()),
      error: m.error ? String(m.error) : undefined,
    }))
  } catch {
    return []
  }
}

function saveMessages(messages: ChatMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  } catch {
    // Ignore storage quota errors
  }
}

class ChatStore {
  private state: ChatState = {
    messages: loadPersistedMessages(),
    isStreaming: false,
    streamingMessageId: null,
  }

  private listeners = new Set<() => void>()
  private abortController: AbortController | null = null
  private defaultEngine: ChatEngine = new MockChatEngine()

  // Frame batching buffer
  private tokenBuffer = ''
  private rafId: number | null = null

  getState(): ChatState {
    return this.state
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify() {
    for (const listener of this.listeners) {
      listener()
    }
  }

  private setState(updater: (prev: ChatState) => ChatState) {
    this.state = updater(this.state)
    this.notify()
    saveMessages(this.state.messages)
  }

  private flushBuffer(final = false) {
    if (!this.state.streamingMessageId || (!this.tokenBuffer && !final)) {
      this.rafId = null
      return
    }

    const chunk = this.tokenBuffer
    this.tokenBuffer = ''
    this.rafId = null

    const targetId = this.state.streamingMessageId
    this.setState((prev) => ({
      ...prev,
      messages: prev.messages.map((m) =>
        m.id === targetId ? { ...m, content: m.content + chunk } : m,
      ),
    }))
  }

  private scheduleFlush() {
    if (this.rafId !== null) return
    if (typeof requestAnimationFrame === 'function') {
      this.rafId = requestAnimationFrame(() => this.flushBuffer(false))
    } else {
      // Fallback for non-browser/test environments
      this.rafId = setTimeout(() => this.flushBuffer(false), 16) as any
    }
  }

  async sendMessage(prompt: string, customEngine?: ChatEngine) {
    const trimmed = prompt.trim()
    if (!trimmed || this.state.isStreaming) return

    const userMsgId = crypto.randomUUID()
    const assistantMsgId = crypto.randomUUID()

    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: trimmed,
      status: 'completed',
      createdAt: Date.now(),
    }

    const assistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      status: 'thinking',
      createdAt: Date.now(),
    }

    this.setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage, assistantMessage],
      isStreaming: true,
      streamingMessageId: assistantMsgId,
    }))

    this.abortController = new AbortController()
    const signal = this.abortController.signal
    const engine = customEngine ?? this.defaultEngine

    try {
      const stream = engine.sendMessage(
        [...this.state.messages, userMessage],
        signal,
      )

      for await (const chunk of stream) {
        if (signal.aborted) break

        if (chunk.type === 'token') {
          this.tokenBuffer += chunk.token
          this.scheduleFlush()
        } else if (chunk.type === 'status') {
          this.flushBuffer(false)
          this.setState((prev) => ({
            ...prev,
            messages: prev.messages.map((m) =>
              m.id === assistantMsgId ? { ...m, status: chunk.status } : m,
            ),
          }))
        } else if (chunk.type === 'error') {
          this.flushBuffer(true)
          this.setState((prev) => ({
            ...prev,
            messages: prev.messages.map((m) =>
              m.id === assistantMsgId
                ? { ...m, status: 'error', error: chunk.error }
                : m,
            ),
          }))
        }
      }

      // Final flush of remaining buffer
      this.flushBuffer(true)

      // Ensure assistant status is marked completed unless it had an error
      this.setState((prev) => ({
        ...prev,
        isStreaming: false,
        streamingMessageId: null,
        messages: prev.messages.map((m) =>
          m.id === assistantMsgId && m.status !== 'error'
            ? { ...m, status: 'completed' }
            : m,
        ),
      }))
    } catch (err: any) {
      this.flushBuffer(true)
      if (signal.aborted) {
        // Stopped by user: keep current content, mark completed
        this.setState((prev) => ({
          ...prev,
          isStreaming: false,
          streamingMessageId: null,
          messages: prev.messages.map((m) =>
            m.id === assistantMsgId && m.status !== 'error'
              ? { ...m, status: 'completed' }
              : m,
          ),
        }))
      } else {
        this.setState((prev) => ({
          ...prev,
          isStreaming: false,
          streamingMessageId: null,
          messages: prev.messages.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  status: 'error',
                  error: err?.message || 'Neural pipeline unexpected error',
                }
              : m,
          ),
        }))
      }
    } finally {
      this.abortController = null
      this.tokenBuffer = ''
      if (this.rafId !== null) {
        if (typeof cancelAnimationFrame === 'function') {
          cancelAnimationFrame(this.rafId)
        } else {
          clearTimeout(this.rafId)
        }
        this.rafId = null
      }
    }
  }

  stopGeneration() {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
    this.flushBuffer(true)
    this.setState((prev) => ({
      ...prev,
      isStreaming: false,
      streamingMessageId: null,
      messages: prev.messages.map((m) =>
        m.id === prev.streamingMessageId && m.status !== 'error'
          ? { ...m, status: 'completed' }
          : m,
      ),
    }))
  }

  clearChat() {
    this.stopGeneration()
    this.setState(() => ({
      messages: [],
      isStreaming: false,
      streamingMessageId: null,
    }))
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }
}

export const chatStore = new ChatStore()

export function useChat(): ChatState & {
  sendMessage: (prompt: string, customEngine?: ChatEngine) => Promise<void>
  stopGeneration: () => void
  clearChat: () => void
} {
  const state = useSyncExternalStore(
    (onStoreChange) => chatStore.subscribe(onStoreChange),
    () => chatStore.getState(),
    () => chatStore.getState(),
  )

  return {
    ...state,
    sendMessage: (prompt, engine) => chatStore.sendMessage(prompt, engine),
    stopGeneration: () => chatStore.stopGeneration(),
    clearChat: () => chatStore.clearChat(),
  }
}
