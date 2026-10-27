export type MessageRole = 'user' | 'assistant'

export type MessageStatus = 'thinking' | 'streaming' | 'completed' | 'error'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  status: MessageStatus
  createdAt: number
  error?: string
}

export type StreamChunk =
  | { type: 'status'; status: 'thinking' | 'streaming' | 'completed' }
  | { type: 'token'; token: string }
  | { type: 'error'; error: string }

export interface ChatEngine {
  sendMessage(
    messages: ChatMessage[],
    signal?: AbortSignal,
  ): AsyncIterable<StreamChunk>
}
