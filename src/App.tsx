import {
  memo,
  useEffect,
  useState,
} from 'react'
import type {
  CSSProperties,
  ReactNode,
} from 'react'
import {
  AnimatePresence,
  motion,
} from 'motion/react'
import {
  ChevronLeft,
  ChevronRight,
  MessageSquarePlus,
  Settings,
} from 'lucide-react'
import { SettingsPanel } from './components/SettingsPanel'
import { ChatViewport } from './components/ChatViewport'
import { Composer } from './components/Composer'
import {
  defaultAccentTheme,
  getAccentTheme,
  isValidAccentThemeId,
  type AccentTheme,
  type AccentThemeId,
} from './lib/themes'
import {
  defaultSettings,
  uiSounds,
  type SoundSettings,
} from './lib/uiSounds'
import { useChat } from './lib/chat/chatStore'
import {
  WindowActivityProvider,
  useWindowActivity,
} from './lib/windowActivity'

const spring = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 32,
  mass: 0.7,
}

function loadSoundSettings(): SoundSettings {
  try {
    const saved = localStorage.getItem('ai-ui-sound-settings')
    if (!saved) return { ...defaultSettings }

    const parsed: unknown = JSON.parse(saved)
    if (!parsed || typeof parsed !== 'object') return { ...defaultSettings }

    const record = parsed as Record<string, unknown>
    return {
      master:
        typeof record.master === 'boolean'
          ? record.master
          : defaultSettings.master,
      hover:
        typeof record.hover === 'boolean'
          ? record.hover
          : defaultSettings.hover,
      buttons:
        typeof record.buttons === 'boolean'
          ? record.buttons
          : defaultSettings.buttons,
      navigation:
        typeof record.navigation === 'boolean'
          ? record.navigation
          : defaultSettings.navigation,
      typing:
        typeof record.typing === 'boolean'
          ? record.typing
          : defaultSettings.typing,
      chat:
        typeof record.chat === 'boolean'
          ? record.chat
          : defaultSettings.chat,
    }
  } catch {
    return { ...defaultSettings }
  }
}

function loadAccentTheme(): AccentThemeId {
  try {
    const saved = localStorage.getItem('ai-ui-accent-theme')
    return isValidAccentThemeId(saved) ? saved : defaultAccentTheme
  } catch {
    return defaultAccentTheme
  }
}

function MainApp() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [soundSettings, setSoundSettings] = useState<SoundSettings>(loadSoundSettings)
  const [accentThemeId, setAccentThemeId] = useState<AccentThemeId>(loadAccentTheme)

  const { activity, isActive } = useWindowActivity()
  const { messages, isStreaming, sendMessage, stopGeneration, clearChat } = useChat()

  const accentTheme = getAccentTheme(accentThemeId)

  useEffect(() => {
    uiSounds.setSettings(soundSettings)
    localStorage.setItem('ai-ui-sound-settings', JSON.stringify(soundSettings))
  }, [soundSettings])

  useEffect(() => {
    localStorage.setItem('ai-ui-accent-theme', accentThemeId)
  }, [accentThemeId])

  useEffect(() => {
    const unlock = () => {
      void uiSounds.unlock()
    }

    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })

    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  const handleToggle = () => {
    void uiSounds.unlock()
    uiSounds.play('toggle')
    setSidebarExpanded((value) => !value)
  }

  const handleNewChat = () => {
    void uiSounds.unlock()
    uiSounds.play('newChat')
    clearChat()
    setSettingsOpen(false)
  }

  const handleSettings = () => {
    void uiSounds.unlock()
    uiSounds.play('settings')
    setSettingsOpen((value) => !value)
  }

  const themeStyle: CSSProperties & Record<`--${string}`, string> = {
    '--accent': accentTheme.primary,
    '--accent-border': accentTheme.border,
    '--accent-soft': accentTheme.soft,
    '--accent-glow': accentTheme.glow,
    '--accent-glow-strong': accentTheme.glowStrong,
  }

  return (
    <main
      className="relative flex h-screen w-screen overflow-hidden bg-[#020509] p-3 text-white sm:p-5"
      style={themeStyle}
    >
      {/* BACKGROUND GRID & RADIAL GLOW */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 42%, ${accentTheme.glow}, transparent 42%)`,
          }}
        />

        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `linear-gradient(${accentTheme.soft} 1px, transparent 1px), linear-gradient(90deg, ${accentTheme.soft} 1px, transparent 1px)`,
            backgroundSize: '46px 46px',
          }}
        />
      </div>

      <div className="relative z-10 flex h-full w-full gap-3 sm:gap-5">
        {/* SIDEBAR */}
        <motion.aside
          animate={{
            width: sidebarExpanded ? 256 : 76,
          }}
          transition={spring}
          className="relative flex h-full shrink-0 flex-col overflow-hidden rounded-[26px] border bg-[#071016]/85 backdrop-blur-2xl"
          style={{
            borderColor: accentTheme.border,
            boxShadow: `0 0 35px ${accentTheme.glow}`,
          }}
        >
          {/* DECORATIVE AMBIENT BORDER RING (PAUSES ON AMBIENT/SUSPENDED) */}
          {isActive ? (
            <motion.div
              animate={{
                opacity: [0.18, 0.42, 0.18],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="pointer-events-none absolute inset-0 rounded-[26px] ring-1 ring-inset"
              style={{
                boxShadow: `inset 0 0 0 1px ${accentTheme.border}`,
              }}
            />
          ) : (
            <div
              className="pointer-events-none absolute inset-0 rounded-[26px] ring-1 ring-inset opacity-25"
              style={{
                boxShadow: `inset 0 0 0 1px ${accentTheme.border}`,
              }}
            />
          )}

          {/* SIDEBAR TOGGLE */}
          <div className="flex items-center justify-center p-3 sm:p-4">
            <motion.button
              whileHover={{ scale: 1.025 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onMouseEnter={() => uiSounds.play('hover')}
              onClick={handleToggle}
              className={[
                'flex h-12 items-center justify-center rounded-xl',
                'border bg-white/[0.025] transition-colors',
                sidebarExpanded ? 'w-12' : 'w-full',
              ].join(' ')}
              style={{
                borderColor: 'rgba(255,255,255,0.10)',
                color: 'rgba(255,255,255,0.65)',
              }}
              aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <motion.div
                animate={{
                  rotate: sidebarExpanded ? 0 : 180,
                }}
                transition={spring}
              >
                {sidebarExpanded ? (
                  <ChevronLeft size={18} strokeWidth={1.7} />
                ) : (
                  <ChevronRight size={18} strokeWidth={1.7} />
                )}
              </motion.div>
            </motion.button>
          </div>

          {/* SIDEBAR ACTIONS */}
          <nav className="flex flex-col gap-2 px-3">
            <SidebarButton
              icon={<MessageSquarePlus size={19} strokeWidth={1.7} />}
              label="New Chat"
              expanded={sidebarExpanded}
              onClick={handleNewChat}
              accent={accentTheme}
            />

            <SidebarButton
              icon={<Settings size={19} strokeWidth={1.7} />}
              label="Settings"
              expanded={sidebarExpanded}
              active={settingsOpen}
              onClick={handleSettings}
              accent={accentTheme}
            />
          </nav>

          {/* SIDEBAR FOOTER */}
          <motion.div
            animate={{
              opacity: sidebarExpanded ? 1 : 0,
            }}
            transition={{
              duration: 0.18,
            }}
            className="mt-auto px-4 pb-4"
          >
            <div className="border-t border-white/5 pt-4">
              <div className="text-[9px] uppercase tracking-[0.28em] text-white/40">
                Interface Subsystem
              </div>

              <div className="mt-2 flex items-center gap-2">
                {isActive ? (
                  <motion.span
                    animate={{
                      opacity: [0.35, 1, 0.35],
                      scale: [0.9, 1, 0.9],
                    }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      background: accentTheme.primary,
                      boxShadow: `0 0 9px ${accentTheme.glowStrong}`,
                    }}
                  />
                ) : (
                  <span
                    className="h-1.5 w-1.5 rounded-full opacity-60"
                    style={{
                      background: accentTheme.primary,
                    }}
                  />
                )}

                <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                  {activity === 'active'
                    ? 'Online'
                    : activity === 'ambient'
                    ? 'Standby'
                    : 'Suspended'}
                </span>
              </div>
            </div>
          </motion.div>
        </motion.aside>

        {/* MAIN CHAT & CANVAS WINDOW */}
        <motion.section
          layout
          className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-[26px] border bg-[#071016]/75 backdrop-blur-2xl"
          style={{
            borderColor: accentTheme.border,
            boxShadow: `0 0 45px ${accentTheme.glow}`,
          }}
        >
          {isActive ? (
            <motion.div
              animate={{
                opacity: [0.15, 0.35, 0.15],
              }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="pointer-events-none absolute inset-0 rounded-[26px]"
              style={{
                boxShadow: `inset 0 0 0 1px ${accentTheme.border}`,
              }}
            />
          ) : (
            <div
              className="pointer-events-none absolute inset-0 rounded-[26px] opacity-20"
              style={{
                boxShadow: `inset 0 0 0 1px ${accentTheme.border}`,
              }}
            />
          )}

          {/* VIEWPORT (MESSAGES OR CENTRAL VMARK) */}
          <ChatViewport
            messages={messages}
            theme={accentTheme}
            isStreaming={isStreaming}
          />

          {/* COMPOSER */}
          <Composer
            onSend={(text) => void sendMessage(text)}
            onStop={stopGeneration}
            isStreaming={isStreaming}
            theme={accentTheme}
          />

          {/* SETTINGS MODAL */}
          <AnimatePresence>
            {settingsOpen && (
              <SettingsPanel
                settings={soundSettings}
                onChange={setSoundSettings}
                accentThemeId={accentThemeId}
                onAccentChange={(id) => {
                  void uiSounds.unlock()
                  uiSounds.play('click')
                  setAccentThemeId(id)
                }}
                onClose={() => setSettingsOpen(false)}
              />
            )}
          </AnimatePresence>
        </motion.section>
      </div>
    </main>
  )
}

export default function App() {
  return (
    <WindowActivityProvider>
      <MainApp />
    </WindowActivityProvider>
  )
}

type SidebarButtonProps = {
  icon: ReactNode
  label: string
  expanded: boolean
  active?: boolean
  onClick: () => void
  accent: AccentTheme
}

const SidebarButton = memo(function SidebarButton({
  icon,
  label,
  expanded,
  active = false,
  onClick,
  accent,
}: SidebarButtonProps) {
  return (
    <motion.button
      whileHover={{
        scale: 1.015,
        x: expanded ? 2 : 0,
      }}
      whileTap={{
        scale: 0.96,
      }}
      type="button"
      aria-label={label}
      onMouseEnter={() => uiSounds.play('hover')}
      onClick={onClick}
      className={[
        'flex h-12 items-center rounded-xl border',
        expanded ? 'gap-3 px-3' : 'justify-center',
      ].join(' ')}
      style={{
        borderColor: active ? accent.border : 'rgba(255,255,255,0.07)',
        background: active ? accent.soft : 'rgba(255,255,255,0.025)',
        color: active ? accent.primary : 'rgba(255,255,255,0.75)',
      }}
    >
      {icon}

      <motion.span
        animate={{
          opacity: expanded ? 1 : 0,
          width: expanded ? 'auto' : 0,
        }}
        transition={spring}
        className="overflow-hidden whitespace-nowrap text-sm font-medium"
      >
        {label}
      </motion.span>
    </motion.button>
  )
})
