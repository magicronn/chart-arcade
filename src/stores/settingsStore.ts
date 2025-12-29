import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Settings, ChartType, ZoomWindow, TimeScaleOption, IndicatorConfig } from '@/types'

interface SettingsState extends Settings {
  // Current session chart type (may differ from default)
  chartType: ChartType
  // Actions
  setDarkMode: (enabled: boolean) => void
  toggleDarkMode: () => void
  setSoundEnabled: (enabled: boolean) => void
  setSoundVolume: (volume: number) => void
  setChartType: (type: ChartType) => void
  setDefaultChartType: (type: ChartType) => void
  setDefaultZoomWindow: (window: ZoomWindow) => void
  setTimeScale: (timeScale: TimeScaleOption) => void
  setShowVolume: (show: boolean) => void
  toggleShowVolume: () => void
  setShowSector: (show: boolean) => void
  setRevealTickerOnSwitch: (reveal: boolean) => void
  addIndicator: (type: IndicatorConfig['type'], params: Record<string, number>, color: string) => string
  removeIndicator: (id: string) => void
  updateIndicator: (id: string, updates: Partial<IndicatorConfig>) => void
  toggleIndicator: (id: string) => void
  resetToDefaults: () => void
}

// Generate a short unique ID for indicators
function generateIndicatorId(type: string): string {
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `${type}-${randomPart}`
}

const defaultIndicators: IndicatorConfig[] = [
  { id: 'sma-20', type: 'sma', enabled: false, params: { period: 20 }, color: '#3b82f6' },
  { id: 'sma-50', type: 'sma', enabled: false, params: { period: 50 }, color: '#8b5cf6' },
  { id: 'ema-12', type: 'ema', enabled: false, params: { period: 12 }, color: '#f59e0b' },
  { id: 'ema-26', type: 'ema', enabled: false, params: { period: 26 }, color: '#ef4444' },
  { id: 'bollinger', type: 'bollinger', enabled: false, params: { period: 20, stdDev: 2 }, color: '#6366f1' },
  { id: 'rsi', type: 'rsi', enabled: false, params: { period: 14 }, color: '#ec4899' },
  { id: 'macd', type: 'macd', enabled: false, params: { fast: 12, slow: 26, signal: 9 }, color: '#14b8a6' },
  { id: 'vwap', type: 'vwap', enabled: false, params: {}, color: '#f97316' },
]

const defaultSettings: Settings = {
  darkMode: true,
  soundEnabled: true,
  soundVolume: 0.7,
  defaultChartType: 'candlestick',
  defaultZoomWindow: '6m',
  timeScale: '6m-daily',
  showVolume: true,
  showSector: false,
  revealTickerOnSwitch: true,
  indicators: defaultIndicators,
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      chartType: defaultSettings.defaultChartType,

      setDarkMode: (enabled) => set({ darkMode: enabled }),

      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

      setSoundVolume: (volume) => set({ soundVolume: Math.max(0, Math.min(1, volume)) }),

      setChartType: (type) => set({ chartType: type }),

      setDefaultChartType: (type) => set({ defaultChartType: type }),

      setDefaultZoomWindow: (window) => set({ defaultZoomWindow: window }),

      setTimeScale: (timeScale) => set({ timeScale }),

      setShowVolume: (show) => set({ showVolume: show }),

      toggleShowVolume: () => set((state) => ({ showVolume: !state.showVolume })),

      setShowSector: (show) => set({ showSector: show }),

      setRevealTickerOnSwitch: (reveal) => set({ revealTickerOnSwitch: reveal }),

      addIndicator: (type, params, color) => {
        const id = generateIndicatorId(type)
        set((state) => ({
          indicators: [
            ...state.indicators,
            { id, type, enabled: true, params, color },
          ],
        }))
        return id
      },

      removeIndicator: (id) =>
        set((state) => ({
          indicators: state.indicators.filter((ind) => ind.id !== id),
        })),

      updateIndicator: (id, updates) =>
        set((state) => ({
          indicators: state.indicators.map((ind) =>
            ind.id === id ? { ...ind, ...updates } : ind
          ),
        })),

      toggleIndicator: (id) =>
        set((state) => ({
          indicators: state.indicators.map((ind) =>
            ind.id === id ? { ...ind, enabled: !ind.enabled } : ind
          ),
        })),

      resetToDefaults: () => set(defaultSettings),
    }),
    {
      name: 'chart-arcade-settings',
    }
  )
)
