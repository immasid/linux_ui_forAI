export type UISound =
  | 'hover'
  | 'click'
  | 'toggle'
  | 'newChat'
  | 'settings'
  | 'send'
  | 'typing'

export type SoundSettings = {
  master: boolean
  hover: boolean
  buttons: boolean
  navigation: boolean
  typing: boolean
  chat: boolean
}

export const defaultSettings: SoundSettings = {
  master: true,
  hover: true,
  buttons: true,
  navigation: true,
  typing: true,
  chat: true,
}

class UISoundEngine {
  private context: AudioContext | null = null
  private masterGain: GainNode | null = null
  private compressor: DynamicsCompressorNode | null = null
  private settings: SoundSettings = { ...defaultSettings }
  private typingIndex = 0

  private noiseBuffer: AudioBuffer | null = null

  setSettings(settings: SoundSettings) {
    this.settings = { ...settings }

    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        settings.master ? 0.45 : 0,
        this.context?.currentTime ?? 0,
        0.02,
      )
    }
  }

  private getNoiseBuffer(): AudioBuffer | null {
    if (!this.context) {
      return null
    }

    if (!this.noiseBuffer) {
      const sampleRate = this.context.sampleRate
      const buffer = this.context.createBuffer(1, sampleRate, sampleRate)
      const data = buffer.getChannelData(0)

      for (let index = 0; index < sampleRate; index += 1) {
        data[index] = Math.random() * 2 - 1
      }

      this.noiseBuffer = buffer
    }

    return this.noiseBuffer
  }

  private ensureContext(): boolean {
    if (typeof window === 'undefined') {
      return false
    }

    if (!this.context) {
      const AudioContextClass =
        window.AudioContext ??
        (
          window as unknown as {
            webkitAudioContext?: typeof AudioContext
          }
        ).webkitAudioContext

      if (!AudioContextClass) {
        return false
      }

      try {
        this.context = new AudioContextClass()

        this.masterGain = this.context.createGain()
        this.masterGain.gain.value = this.settings.master ? 0.45 : 0

        this.compressor = this.context.createDynamicsCompressor()
        this.compressor.threshold.value = -20
        this.compressor.knee.value = 8
        this.compressor.ratio.value = 5
        this.compressor.attack.value = 0.003
        this.compressor.release.value = 0.12

        this.masterGain.connect(this.compressor)
        this.compressor.connect(this.context.destination)
      } catch {
        return false
      }
    }

    if (this.context.state === 'suspended') {
      void this.context.resume()
    }

    return true
  }

  async unlock() {
    this.ensureContext()
    if (this.context && this.context.state === 'suspended') {
      try {
        await this.context.resume()
      } catch {
        // audio resume error
      }
    }
  }

  play(sound: UISound) {
    if (!this.settings.master || !this.isCategoryEnabled(sound)) {
      return
    }

    if (!this.ensureContext() || !this.context || !this.masterGain) {
      return
    }

    switch (sound) {
      case 'hover':
        this.tone(1760, 2080, 0.022, 'sine', 0.018)
        break

      case 'click':
        this.tone(720, 1180, 0.048, 'square', 0.030)
        this.tone(1480, 1120, 0.028, 'sine', 0.015, 0.017)
        this.noise(0.015, 0.009)
        break

      case 'toggle':
        this.tone(660, 290, 0.095, 'triangle', 0.048)
        this.tone(1110, 820, 0.062, 'sine', 0.020, 0.028)
        this.noise(0.022, 0.009, 0.02)
        break

      case 'newChat':
        this.tone(330, 410, 0.055, 'triangle', 0.035)
        this.tone(520, 680, 0.061, 'triangle', 0.035, 0.05)
        this.tone(780, 1180, 0.08, 'sine', 0.028, 0.11)
        this.noise(0.028, 0.008, 0.112)
        break

      case 'settings':
        this.tone(980, 720, 0.068, 'triangle', 0.032)
        this.tone(1260, 1030, 0.052, 'square', 0.018, 0.045)
        break

      case 'send':
        this.tone(690, 1040, 0.055, 'triangle', 0.038)
        this.tone(1040, 1680, 0.095, 'sine', 0.032, 0.038)
        this.tone(1680, 1360, 0.032, 'sine', 0.016, 0.108)
        this.noise(0.032, 0.009, 0.045)
        break

      case 'typing': {
        const pitches = [1180, 1300, 1420, 1260, 1480]
        const pitch = pitches[this.typingIndex % pitches.length]
        this.typingIndex += 1

        // Crisp, pleasant tactile mechanical key click
        this.tone(
          pitch,
          pitch * 0.9,
          0.032,
          'sine',
          0.050,
        )

        this.tone(
          pitch * 1.4,
          pitch * 0.6,
          0.018,
          'triangle',
          0.030,
        )

        this.noise(0.025, 0.012, 0.001)
        break
      }
    }
  }

  private isCategoryEnabled(sound: UISound) {
    switch (sound) {
      case 'hover':
        return this.settings.hover

      case 'click':
        return this.settings.buttons

      case 'toggle':
      case 'settings':
        return this.settings.navigation

      case 'newChat':
      case 'send':
        return this.settings.chat

      case 'typing':
        return this.settings.typing

      default:
        return true
    }
  }

  private tone(
    startFrequency: number,
    endFrequency: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    delay = 0,
  ) {
    if (!this.context || !this.masterGain) {
      return
    }

    const now = this.context.currentTime + delay

    const oscillator = this.context.createOscillator()
    const filter = this.context.createBiquadFilter()
    const gain = this.context.createGain()

    oscillator.type = type

    oscillator.frequency.setValueAtTime(
      startFrequency,
      now,
    )

    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(endFrequency, 20),
      now + duration,
    )

    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(5200, now)
    filter.frequency.exponentialRampToValueAtTime(
      2600,
      now + duration,
    )
    filter.Q.value = 0.9

    gain.gain.setValueAtTime(0.0001, now)

    gain.gain.exponentialRampToValueAtTime(
      volume,
      now + 0.003,
    )

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + duration,
    )

    oscillator.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)

    oscillator.start(now)
    oscillator.stop(now + duration)
  }

  private noise(
    duration: number,
    volume: number,
    delay = 0,
  ) {
    if (!this.context || !this.masterGain) {
      return
    }

    const buffer = this.getNoiseBuffer()
    if (!buffer) {
      return
    }

    const now = this.context.currentTime + delay

    const source = this.context.createBufferSource()
    const filter = this.context.createBiquadFilter()
    const gain = this.context.createGain()

    source.buffer = buffer

    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(2400, now)
    filter.Q.value = 1.4

    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(
      volume,
      now + 0.002,
    )
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + duration,
    )

    source.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)

    source.start(now)
    source.stop(now + duration)
  }
}

export const uiSounds = new UISoundEngine()
