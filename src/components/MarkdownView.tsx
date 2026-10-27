import { useState, memo } from 'react'
import { Check, Copy } from 'lucide-react'

interface MarkdownViewProps {
  content: string
  accentColor?: string
}

function safeUrl(url: string): string {
  try {
    const parsed = new URL(url, 'https://localhost')
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return url
    }
  } catch {
    // invalid URL
  }
  return '#'
}

const CodeBlock = memo(function CodeBlock({
  code,
  language,
  accentColor = '#67e8f9',
}: {
  code: string
  language: string
  accentColor?: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard fallback
    }
  }

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-white/10 bg-[#03070b]/90 text-xs">
      <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-3.5 py-1.5 text-white/50">
        <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-white/60 transition hover:bg-white/5 hover:text-white"
          aria-label="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check size={12} style={{ color: accentColor }} />
              <span style={{ color: accentColor }}>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-3.5 font-mono text-white/90">
        <pre className="m-0 leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  )
})

export const MarkdownView = memo(function MarkdownView({
  content,
  accentColor = '#67e8f9',
}: MarkdownViewProps) {
  // Parse blocks: code blocks vs text blocks
  const parts: Array<
    | { type: 'code'; code: string; language: string }
    | { type: 'text'; text: string }
  > = []

  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        text: content.slice(lastIndex, match.index),
      })
    }
    parts.push({
      type: 'code',
      language: match[1] || '',
      code: match[2].trimEnd(),
    })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      text: content.slice(lastIndex),
    })
  }

  return (
    <div className="markdown-body space-y-2 text-sm leading-relaxed text-white/85">
      {parts.map((part, idx) => {
        if (part.type === 'code') {
          return (
            <CodeBlock
              key={`code-${idx}`}
              code={part.code}
              language={part.language}
              accentColor={accentColor}
            />
          )
        }

        // Render paragraphs, headings, bullet lists
        const lines = part.text.split('\n')
        const elements: Array<{
          type: 'p' | 'h1' | 'h2' | 'h3' | 'ul' | 'ol'
          items?: string[]
          content?: string
        }> = []

        let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) {
            if (currentList) {
              elements.push(currentList)
              currentList = null
            }
            continue
          }

          if (trimmed.startsWith('### ')) {
            if (currentList) {
              elements.push(currentList)
              currentList = null
            }
            elements.push({ type: 'h3', content: trimmed.slice(4) })
          } else if (trimmed.startsWith('## ')) {
            if (currentList) {
              elements.push(currentList)
              currentList = null
            }
            elements.push({ type: 'h2', content: trimmed.slice(3) })
          } else if (trimmed.startsWith('# ')) {
            if (currentList) {
              elements.push(currentList)
              currentList = null
            }
            elements.push({ type: 'h1', content: trimmed.slice(2) })
          } else if (/^[-*]\s+/.test(trimmed)) {
            const item = trimmed.replace(/^[-*]\s+/, '')
            if (currentList && currentList.type === 'ul') {
              currentList.items.push(item)
            } else {
              if (currentList) elements.push(currentList)
              currentList = { type: 'ul', items: [item] }
            }
          } else if (/^\d+\.\s+/.test(trimmed)) {
            const item = trimmed.replace(/^\d+\.\s+/, '')
            if (currentList && currentList.type === 'ol') {
              currentList.items.push(item)
            } else {
              if (currentList) elements.push(currentList)
              currentList = { type: 'ol', items: [item] }
            }
          } else {
            if (currentList) {
              elements.push(currentList)
              currentList = null
            }
            elements.push({ type: 'p', content: line })
          }
        }

        if (currentList) {
          elements.push(currentList)
        }

        return (
          <div key={`text-${idx}`} className="space-y-2">
            {elements.map((el, elIdx) => {
              if (el.type === 'h1') {
                return (
                  <h1
                    key={elIdx}
                    className="font-mono text-lg font-bold tracking-tight text-white"
                  >
                    {renderInlineFormatted(el.content || '', accentColor)}
                  </h1>
                )
              }
              if (el.type === 'h2') {
                return (
                  <h2
                    key={elIdx}
                    className="font-mono text-base font-semibold tracking-tight text-white/95"
                  >
                    {renderInlineFormatted(el.content || '', accentColor)}
                  </h2>
                )
              }
              if (el.type === 'h3') {
                return (
                  <h3
                    key={elIdx}
                    className="font-mono text-sm font-semibold tracking-wide text-white/90"
                    style={{ color: accentColor }}
                  >
                    {renderInlineFormatted(el.content || '', accentColor)}
                  </h3>
                )
              }
              if (el.type === 'ul') {
                return (
                  <ul key={elIdx} className="list-inside list-disc space-y-1 pl-1">
                    {el.items?.map((item, itemIdx) => (
                      <li key={itemIdx} className="text-white/80">
                        {renderInlineFormatted(item, accentColor)}
                      </li>
                    ))}
                  </ul>
                )
              }
              if (el.type === 'ol') {
                return (
                  <ol key={elIdx} className="list-inside list-decimal space-y-1 pl-1">
                    {el.items?.map((item, itemIdx) => (
                      <li key={itemIdx} className="text-white/80">
                        {renderInlineFormatted(item, accentColor)}
                      </li>
                    ))}
                  </ol>
                )
              }
              return (
                <p key={elIdx} className="text-white/85">
                  {renderInlineFormatted(el.content || '', accentColor)}
                </p>
              )
            })}
          </div>
        )
      })}
    </div>
  )
})

function renderInlineFormatted(text: string, accentColor: string) {
  // Regex to split on bold (**text**), code (`code`), or links ([text](url))
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g)

  return tokens.map((token, i) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      )
    }
    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <code
          key={i}
          className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[13px] text-white/95"
        >
          {token.slice(1, -1)}
        </code>
      )
    }
    const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (linkMatch) {
      const url = safeUrl(linkMatch[2])
      return (
        <a
          key={i}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 transition hover:opacity-80"
          style={{ color: accentColor }}
        >
          {linkMatch[1]}
        </a>
      )
    }
    return token
  })
}
