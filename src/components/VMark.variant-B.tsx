import { memo } from 'react'

const beams = [
  [112, 94, 55, 48],
  [121, 128, 44, 90],
  [139, 180, 54, 174],
  [161, 226, 74, 248],
  [205, 318, 152, 376],

  [388, 94, 445, 48],
  [379, 128, 456, 90],
  [361, 180, 446, 174],
  [339, 226, 426, 248],
  [295, 318, 348, 376],
]

export const VMark = memo(function VMark() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 aspect-square w-[min(58vw,560px)] -translate-x-1/2 -translate-y-1/2 opacity-90">
      <svg
        viewBox="0 0 500 500"
        className="h-full w-full overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <filter
            id="vSoftGlow"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur stdDeviation="18" />
          </filter>

          <filter
            id="vGlow"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur
              stdDeviation="6"
              result="glow"
            />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* STATIC PATH 1 WITH SOFT GLOW */}
        <path
          d="M 108 88 L 250 402 L 392 88"
          fill="none"
          stroke="var(--accent)"
          strokeOpacity="0.18"
          strokeWidth="38"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#vSoftGlow)"
          opacity="0.38"
        />

        {/* STATIC PATH 2 WITH CRISP GLOW */}
        <path
          d="M 108 88 L 250 402 L 392 88"
          fill="none"
          stroke="var(--accent)"
          strokeOpacity="0.85"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#vGlow)"
          opacity="0.75"
        />

        {/* STATIC CENTER LINE */}
        <path
          d="M 108 88 L 250 402 L 392 88"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#vGlow)"
        />

        {/* STATIC BEAMS */}
        {beams.map(([x1, y1, x2, y2]) => (
          <line
            key={`${x1}-${y1}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
            filter="url(#vGlow)"
            opacity="0.35"
          />
        ))}

        {/* STATIC VERTEX CIRCLE */}
        <circle
          cx="250"
          cy="402"
          r="7"
          fill="var(--accent)"
          filter="url(#vGlow)"
          opacity="0.65"
        />
      </svg>
    </div>
  )
})
