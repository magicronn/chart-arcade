/**
 * Audio Manager - Handles all game sounds using Web Audio API
 * Generates sounds programmatically for minimal bundle size
 */

export type SoundType = 'buy' | 'sell' | 'sellProfit' | 'sellLoss' | 'skip' | 'skipQuiet' | 'win' | 'loss' | 'switch' | 'reveal'

class AudioManager {
  private audioContext: AudioContext | null = null
  private volume: number = 0.5
  private muted: boolean = false
  private initialized: boolean = false

  /**
   * Initialize audio context (must be called after user interaction)
   */
  initialize(): void {
    if (this.initialized) return

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.initialized = true
      console.log('AudioManager initialized')
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error)
    }
  }

  /**
   * Play a sound effect
   */
  play(soundType: SoundType): void {
    if (!this.initialized || !this.audioContext || this.muted) return

    switch (soundType) {
      case 'buy':
        this.playBuy()
        break
      case 'sell':
        this.playSell()
        break
      case 'sellProfit':
        this.playSellProfit()
        break
      case 'sellLoss':
        this.playSellLoss()
        break
      case 'skip':
        this.playSkip()
        break
      case 'skipQuiet':
        this.playSkipQuiet()
        break
      case 'win':
        this.playWin()
        break
      case 'loss':
        this.playLoss()
        break
      case 'switch':
        this.playSwitch()
        break
      case 'reveal':
        this.playReveal()
        break
    }
  }

  /**
   * Buy sound - ascending chirp
   */
  private playBuy(): void {
    const ctx = this.audioContext!
    const now = ctx.currentTime

    // Oscillator for tone
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    // Rising pitch
    osc.frequency.setValueAtTime(400, now)
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.1)

    // Envelope
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(this.volume * 0.3, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)

    osc.start(now)
    osc.stop(now + 0.15)
  }

  /**
   * Sell sound - descending chirp (neutral)
   */
  private playSell(): void {
    const ctx = this.audioContext!
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    // Falling pitch
    osc.frequency.setValueAtTime(600, now)
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.1)

    // Envelope
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(this.volume * 0.3, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)

    osc.start(now)
    osc.stop(now + 0.15)
  }

  /**
   * Sell with profit - celebratory chime
   */
  private playSellProfit(): void {
    const ctx = this.audioContext!
    const now = ctx.currentTime

    // Three note ascending scale with final high note
    const frequencies = [523.25, 659.25, 783.99, 1046.5] // C-E-G-C
    const noteDuration = 0.07

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      const startTime = now + i * noteDuration
      osc.frequency.setValueAtTime(freq, startTime)
      osc.type = 'sine'

      const volumeMultiplier = i === frequencies.length - 1 ? 0.35 : 0.25

      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(this.volume * volumeMultiplier, startTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration + 0.05)

      osc.start(startTime)
      osc.stop(startTime + noteDuration + 0.05)
    })
  }

  /**
   * Sell with loss - descending 4-note sequence (mirror of profit)
   */
  private playSellLoss(): void {
    const ctx = this.audioContext!
    const now = ctx.currentTime

    // Four note descending scale with final low note: C-G-E-C
    const frequencies = [523.25, 392.00, 329.63, 261.63] // C-G-E-C (descending)
    const noteDuration = 0.07

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      const startTime = now + i * noteDuration
      osc.frequency.setValueAtTime(freq, startTime)
      osc.type = 'triangle' // Slightly sadder timbre than sine

      const volumeMultiplier = i === frequencies.length - 1 ? 0.30 : 0.22

      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(this.volume * volumeMultiplier, startTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration + 0.05)

      osc.start(startTime)
      osc.stop(startTime + noteDuration + 0.05)
    })
  }

  /**
   * Skip sound - short blip (used when not holding)
   */
  private playSkip(): void {
    const ctx = this.audioContext!
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.frequency.setValueAtTime(300, now)

    // Short envelope
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(this.volume * 0.2, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06)

    osc.start(now)
    osc.stop(now + 0.06)
  }

  /**
   * Skip quiet sound - very subtle click (when flat/not holding)
   */
  private playSkipQuiet(): void {
    const ctx = this.audioContext!
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.frequency.setValueAtTime(250, now)
    osc.type = 'sine'

    // Very quiet and very short
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(this.volume * 0.08, now + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03)

    osc.start(now)
    osc.stop(now + 0.03)
  }

  /**
   * Win sound - happy ascending arpeggio
   */
  private playWin(): void {
    const ctx = this.audioContext!
    const now = ctx.currentTime

    // Three note arpeggio: C - E - G (major chord)
    const frequencies = [523.25, 659.25, 783.99]
    const noteDuration = 0.08

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      const startTime = now + i * noteDuration
      osc.frequency.setValueAtTime(freq, startTime)
      osc.type = 'sine'

      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(this.volume * 0.25, startTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration)

      osc.start(startTime)
      osc.stop(startTime + noteDuration)
    })
  }

  /**
   * Loss sound - sad descending tone
   */
  private playLoss(): void {
    const ctx = this.audioContext!
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    // Descending sad tone
    osc.frequency.setValueAtTime(400, now)
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.3)
    osc.type = 'triangle'

    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(this.volume * 0.2, now + 0.01)
    gain.gain.linearRampToValueAtTime(this.volume * 0.2, now + 0.2)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)

    osc.start(now)
    osc.stop(now + 0.3)
  }

  /**
   * Switch sound - whoosh/transition
   */
  private playSwitch(): void {
    const ctx = this.audioContext!
    const now = ctx.currentTime

    // White noise filtered sweep
    const bufferSize = ctx.sampleRate * 0.3
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const noise = ctx.createBufferSource()
    const filter = ctx.createBiquadFilter()
    const gain = ctx.createGain()

    noise.buffer = buffer
    noise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    // Sweeping lowpass filter
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(3000, now)
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.25)

    // Envelope
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(this.volume * 0.15, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25)

    noise.start(now)
    noise.stop(now + 0.3)
  }

  /**
   * Reveal sound - magical chime for stock reveal
   */
  private playReveal(): void {
    const ctx = this.audioContext!
    const now = ctx.currentTime

    // Three-note magical chime: G-B-D (ascending harmony)
    const frequencies = [783.99, 987.77, 1174.66] // G5-B5-D6
    const noteDuration = 0.12
    const spacing = 0.06 // Overlap notes slightly for shimmer effect

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      const startTime = now + i * spacing
      osc.frequency.setValueAtTime(freq, startTime)
      osc.type = 'sine'

      // Bell-like envelope with longer sustain
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(this.volume * 0.28, startTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration + 0.3)

      osc.start(startTime)
      osc.stop(startTime + noteDuration + 0.3)
    })
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.volume
  }

  /**
   * Mute/unmute audio
   */
  setMuted(muted: boolean): void {
    this.muted = muted
  }

  /**
   * Check if muted
   */
  isMuted(): boolean {
    return this.muted
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized
  }
}

// Export singleton instance
export const audioManager = new AudioManager()
