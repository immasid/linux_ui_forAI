import { describe, it, expect } from 'vitest'
import { MockChatEngine } from '../lib/chat/mockEngine'
import type { ChatMessage } from '../lib/chat/types'

describe('MockChatEngine', () => {
  it('streams tokens and completes deterministically', async () => {
    const engine = new MockChatEngine({ thinkingDelayMs: 5, tokenDelayMs: 2 })
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'user',
        content: 'Hello system',
        status: 'completed',
        createdAt: Date.now(),
      },
    ]

    const chunks = []
    for await (const chunk of engine.sendMessage(messages)) {
      chunks.push(chunk)
    }

    expect(chunks[0]).toEqual({ type: 'status', status: 'thinking' })
    expect(chunks[1]).toEqual({ type: 'status', status: 'streaming' })

    const tokens = chunks
      .filter((c) => c.type === 'token')
      .map((c: any) => c.token)
    expect(tokens.length).toBeGreaterThan(0)
    expect(tokens.join('')).toContain('Neural Interface Online')

    expect(chunks[chunks.length - 1]).toEqual({
      type: 'status',
      status: 'completed',
    })
  })

  it('handles cancellation using AbortSignal cleanly', async () => {
    const engine = new MockChatEngine({ thinkingDelayMs: 10, tokenDelayMs: 5 })
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'user',
        content: 'Long query',
        status: 'completed',
        createdAt: Date.now(),
      },
    ]

    const controller = new AbortController()
    const chunks = []

    const stream = engine.sendMessage(messages, controller.signal)
    for await (const chunk of stream) {
      chunks.push(chunk)
      if (chunks.length === 3) {
        controller.abort()
      }
    }

    // Generator must exit early after abort
    expect(chunks.length).toBeLessThan(15)
    expect(controller.signal.aborted).toBe(true)
  })

  it('triggers mid-stream error on /error command without crashing', async () => {
    const engine = new MockChatEngine({ thinkingDelayMs: 5, tokenDelayMs: 2 })
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'user',
        content: '/error trigger pipeline test',
        status: 'completed',
        createdAt: Date.now(),
      },
    ]

    const chunks = []
    for await (const chunk of engine.sendMessage(messages)) {
      chunks.push(chunk)
    }

    const errorChunk = chunks.find((c) => c.type === 'error')
    expect(errorChunk).toBeDefined()
    if (errorChunk && errorChunk.type === 'error') {
      expect(errorChunk.error).toContain('/error')
    }
  })
})
