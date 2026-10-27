import type { ChatEngine, ChatMessage, StreamChunk } from './types'

function abortableSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)

    const onAbort = () => {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
      reject(new DOMException('Aborted', 'AbortError'))
    }

    signal?.addEventListener('abort', onAbort)
  })
}

const RESPONSES: Record<string, string> = {
  default: `### Neural Interface Online

V-Core system telemetry reports nominal operation across all localized subsystems.

- **Kernel:** Native Linux POSIX subsystem verified
- **Display Engine:** Wayland compositor with direct surface mapping
- **Audio Synthesizer:** Real-time Web Audio API procedural oscillator
- **Local Storage:** Synchronous atomic configuration schema

\`\`\`rust
// Zero-cost telemetry probe
pub fn query_subsystem() -> SubsystemStatus {
    SubsystemStatus {
        core_temperature: 42.0,
        neural_entropy: 0.0012,
        active_pipeline: "Linux Wayland Native Shell",
    }
}
\`\`\`

Ready for sequential command ingestion.`,

  code: `### Code Synthesis Protocol

Below is the verified production architecture for the reactive event loop:

\`\`\`typescript
interface PipelineStage<T> {
  id: string;
  process: (input: T) => Promise<T>;
  telemetry: () => Record<string, number>;
}

export async function runPipeline<T>(
  initial: T,
  stages: PipelineStage<T>[]
): Promise<T> {
  let current = initial;
  for (const stage of stages) {
    current = await stage.process(current);
  }
  return current;
}
\`\`\`

You can verify subsystem integrity directly using the Linux CLI:

\`\`\`bash
# Query memory rollup directly from procfs
cat /proc/self/smaps_rollup | grep -E "Rss|Pss|Private"
\`\`\`
`,

  help: `### V-Core Command Index

The following system controls are supported in this offline environment:

- **/code** — Synthesize code samples with multi-language code blocks and copy triggers.
- **/error** — Emulate mid-stream pipeline fault to verify resilience and error recovery.
- **/help** — Surface this interface documentation.
- **Normal queries** — Receive deterministic cybernetic neural responses.`,
}

export class MockChatEngine implements ChatEngine {
  private thinkingDelayMs: number
  private tokenDelayMs: number

  constructor(options?: { thinkingDelayMs?: number; tokenDelayMs?: number }) {
    this.thinkingDelayMs = options?.thinkingDelayMs ?? 200
    this.tokenDelayMs = options?.tokenDelayMs ?? 15
  }

  async *sendMessage(
    messages: ChatMessage[],
    signal?: AbortSignal,
  ): AsyncIterable<StreamChunk> {
    if (signal?.aborted) {
      return
    }

    // 1. Thinking state
    yield { type: 'status', status: 'thinking' }

    try {
      await abortableSleep(this.thinkingDelayMs, signal)
    } catch {
      return
    }

    // 2. Determine response text
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === 'user')
    const userPrompt = (lastUserMessage?.content ?? '').trim()

    // 3. Check for error command
    const isErrorTest = userPrompt.startsWith('/error')

    // 4. Streaming status
    yield { type: 'status', status: 'streaming' }

    let responseTemplate: string
    if (isErrorTest) {
      responseTemplate = 'Initiating command parsing sequence... Synthesizing neural tensor weights... [FAULT DETECTED]'
    } else if (userPrompt.startsWith('/code')) {
      responseTemplate = RESPONSES.code
    } else if (userPrompt.startsWith('/help')) {
      responseTemplate = RESPONSES.help
    } else {
      responseTemplate = RESPONSES.default
    }

    // Split into tokens (words and punctuation preservation)
    const tokens = responseTemplate.match(/(\s+|\S+)/g) || [responseTemplate]

    for (let i = 0; i < tokens.length; i++) {
      if (signal?.aborted) {
        return
      }

      if (isErrorTest && i >= 6) {
        // Trigger simulated mid-stream error
        yield {
          type: 'error',
          error: 'Simulated pipeline failure triggered via /error command. Subsystem recovered.',
        }
        return
      }

      yield { type: 'token', token: tokens[i] }

      try {
        await abortableSleep(this.tokenDelayMs, signal)
      } catch {
        return
      }
    }

    // 5. Completed status
    yield { type: 'status', status: 'completed' }
  }
}
