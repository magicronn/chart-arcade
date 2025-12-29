type SoundType = 'buy' | 'sell' | 'skip' | 'win' | 'loss' | 'switch'

class AudioManager {
  private audioContext: AudioContext | null = null
  private sounds: Map<SoundType, AudioBuffer> = new Map()
  private enabled: boolean = true
  private volume: number = 0.7

  async init(): Promise<void> {
    if (this.audioContext) return

    try {
      this.audioContext = new AudioContext()
      await this.loadSounds()
    } catch (error) {
      console.warn('Failed to initialize audio:', error)
    }
  }

  private async loadSounds(): Promise<void> {
    // In production, these would load from actual sound files
    // For now, we'll generate simple synthetic sounds
    const soundConfigs: Record<SoundType, { frequency: number; duration: number; type: OscillatorType }> = {
      buy: { frequency: 523.25, duration: 0.15, type: 'sine' }, // C5
      sell: { frequency: 392.0, duration: 0.15, type: 'sine' }, // G4
      skip: { frequency: 440.0, duration: 0.1, type: 'triangle' }, // A4
      win: { frequency: 659.25, duration: 0.2, type: 'sine' }, // E5
      loss: { frequency: 293.66, duration: 0.2, type: 'sawtooth' }, // D4
      switch: { frequency: 587.33, duration: 0.25, type: 'sine' }, // D5
    }

    for (const [soundType, config] of Object.entries(soundConfigs)) {
      const buffer = this.createSyntheticSound(config.frequency, config.duration, config.type)
      this.sounds.set(soundType as SoundType, buffer)
    }
  }

  private createSyntheticSound(
    frequency: number,
    duration: number,
    type: OscillatorType
  ): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized')

    const sampleRate = this.audioContext.sampleRate
    const length = sampleRate * duration
    const buffer = this.audioContext.createBuffer(1, length, sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate
      let sample = 0

      switch (type) {
        case 'sine':
          sample = Math.sin(2 * Math.PI * frequency * t)
          break
        case 'triangle':
          sample = 2 * Math.abs(2 * ((frequency * t) % 1) - 1) - 1
          break
        case 'sawtooth':
          sample = 2 * ((frequency * t) % 1) - 1
          break
        case 'square':
          sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1
          break
      }

      // Apply envelope (attack/decay)
      const envelope = Math.min(1, (length - i) / (sampleRate * 0.05)) * Math.min(1, i / (sampleRate * 0.01))
      data[i] = sample * envelope
    }

    return buffer
  }

  play(soundType: SoundType): void {
    if (!this.enabled || !this.audioContext) return

    const buffer = this.sounds.get(soundType)
    if (!buffer) return

    // Resume context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    const source = this.audioContext.createBufferSource()
    const gainNode = this.audioContext.createGain()

    source.buffer = buffer
    gainNode.gain.value = this.volume

    source.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    source.start()
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
  }

  isEnabled(): boolean {
    return this.enabled
  }

  getVolume(): number {
    return this.volume
  }
}

// Singleton instance
export const audioManager = new AudioManager()

// Hook for React components
export function useAudio() {
  return {
    play: (sound: SoundType) => audioManager.play(sound),
    setEnabled: (enabled: boolean) => audioManager.setEnabled(enabled),
    setVolume: (volume: number) => audioManager.setVolume(volume),
    isEnabled: () => audioManager.isEnabled(),
    getVolume: () => audioManager.getVolume(),
    init: () => audioManager.init(),
  }
}
