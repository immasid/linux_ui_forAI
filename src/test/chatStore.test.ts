import { describe, it, expect, beforeEach } from 'vitest'
import { chatStore } from '../lib/chat/chatStore'
import { MockChatEngine } from '../lib/chat/mockEngine'

describe('chatStore', () => {
  const fastEngine = new MockChatEngine({
    thinkingDelayMs: 2,
    tokenDelayMs: 1,
  })

  beforeEach(() => {
    chatStore.clearChat()
  })

  it('submits user message and streams assistant response', async () => {
    await chatStore.sendMessage('Hello V-Core', fastEngine)

    const state = chatStore.getState()
    expect(state.messages.length).toBe(2)
    expect(state.messages[0].role).toBe('user')
    expect(state.messages[0].content).toBe('Hello V-Core')
    expect(state.messages[1].role).toBe('assistant')
    expect(state.messages[1].status).toBe('completed')
    expect(state.messages[1].content.length).toBeGreaterThan(0)
    expect(state.isStreaming).toBe(false)
  })

  it('preserves message ordering and generates stable IDs', async () => {
    await chatStore.sendMessage('First message', fastEngine)
    await chatStore.sendMessage('Second message', fastEngine)

    const state = chatStore.getState()
    expect(state.messages.length).toBe(4)
    expect(state.messages[0].content).toBe('First message')
    expect(state.messages[1].role).toBe('assistant')
    expect(state.messages[2].content).toBe('Second message')
    expect(state.messages[3].role).toBe('assistant')

    const ids = state.messages.map((m) => m.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(4)
  })

  it('stops generation cleanly without losing earlier messages', async () => {
    // Send first message completely
    await chatStore.sendMessage('Saved message', fastEngine)
    expect(chatStore.getState().messages.length).toBe(2)

    // Send slow second message and abort mid-stream
    const slowEngine = new MockChatEngine({
      thinkingDelayMs: 50,
      tokenDelayMs: 20,
    })
    const promise = chatStore.sendMessage('Slow query', slowEngine)

    // Abort after 30ms
    await new Promise((r) => setTimeout(r, 30))
    chatStore.stopGeneration()
    await promise

    const state = chatStore.getState()
    expect(state.isStreaming).toBe(false)
    expect(state.messages.length).toBe(4)
    expect(state.messages[0].content).toBe('Saved message')
    expect(state.messages[2].content).toBe('Slow query')
  })

  it('handles error response without losing previous messages', async () => {
    await chatStore.sendMessage('First good message', fastEngine)
    await chatStore.sendMessage('/error trigger fault', fastEngine)

    const state = chatStore.getState()
    expect(state.messages.length).toBe(4)
    expect(state.messages[0].content).toBe('First good message')
    expect(state.messages[1].status).toBe('completed')
    expect(state.messages[2].content).toBe('/error trigger fault')
    expect(state.messages[3].status).toBe('error')
    expect(state.messages[3].error).toBeDefined()
  })

  it('clears all messages on clearChat()', async () => {
    await chatStore.sendMessage('Query to clear', fastEngine)
    expect(chatStore.getState().messages.length).toBe(2)

    chatStore.clearChat()
    expect(chatStore.getState().messages.length).toBe(0)
    expect(chatStore.getState().isStreaming).toBe(false)
  })
})
