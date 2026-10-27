import { memo } from 'react'
import { motion } from 'motion/react'

const beams = [
  [112, 94, 55, 48, 0.0],
  [121, 128, 44, 90, 0.18],
  [139, 180, 54, 174, 0.36],
  [161, 226, 74, 248, 0.54],
  [205, 318, 152, 376, 0.72],

  [388, 94, 445, 48, 0.09],
  [379, 128, 456, 90, 0.27],
  [361, 180, 446, 174, 0.45],
  [339, 226, 426, 248, 0.63],
  [295, 318, 348, 376, 0.81],
]

export const VMark = memo(function VMark() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 aspect-square w-[min(58vw,560px)] -translate-x-1/2 -translate-y-1/2 opacity-90">
      <svg
        viewBox="0 0 500 500"
        className="h-full w-full overflow-visible"
        aria-hidden="true"
      >
        {/* FILTERS OMITTED IN VARIANT C */}

        <motion.path
          d="M 108 88 L 250 402 L 392 88"
          fill="none"
          stroke="var(--accent)"
          strokeOpacity="0.18"
          strokeWidth="38"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{
            opacity: [0.22, 0.55, 0.22],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <motion.path
          d="M 108 88 L 250 402 L 392 88"
          fill="none"
          stroke="var(--accent)"
          strokeOpacity="0.85"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{
            opacity: [0.38, 1, 0.38],
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <path
          d="M 108 88 L 250 402 L 392 88"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {beams.map(([x1, y1, x2, y2, delay]) => (
          <motion.line
            key={`${x1}-${y1}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{
              opacity: 0.04,
              pathLength: 0.15,
            }}
            animate={{
              opacity: [0.04, 0.65, 0.04],
              pathLength: [0.2, 1, 0.2],
            }}
            transition={{
              duration: 2.5,
              delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

        <motion.circle
          cx="250"
          cy="402"
          r="7"
          fill="var(--accent)"
          animate={{
            opacity: [0.25, 1, 0.25],
            r: [5, 8, 5],
          }}
          transition={{
            duration: 2.1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </svg>
    </div>
  )
})
