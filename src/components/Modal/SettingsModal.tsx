import { Modal } from './Modal'
import { useSettingsStore } from '@/stores/settingsStore'
import { useGameStore } from '@/stores/gameStore'
import { useState } from 'react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const {
    darkMode,
    toggleDarkMode,
    chartType,
    setChartType,
    soundEnabled,
    setSoundEnabled,
    soundVolume,
    setSoundVolume,
    showVolume,
    toggleShowVolume,
    showSector,
    setShowSector,
    revealTickerOnSwitch,
    setRevealTickerOnSwitch,
  } = useSettingsStore()

  const { resetAllStats } = useGameStore()
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const handleResetStats = () => {
    if (showResetConfirm) {
      resetAllStats()
      setShowResetConfirm(false)
    } else {
      setShowResetConfirm(true)
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowResetConfirm(false), 3000)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-6">
        {/* Appearance Section */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Appearance</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm">Theme</span>
            <button
              onClick={toggleDarkMode}
              className="px-4 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>
        </div>

        {/* Chart Section */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Chart</h3>

          {/* Chart Type */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm">Chart Type</span>
            <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setChartType('candlestick')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  chartType === 'candlestick'
                    ? 'bg-arcade-blue text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Candle
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-gray-200 dark:border-gray-700 ${
                  chartType === 'line'
                    ? 'bg-arcade-blue text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Line
              </button>
              <button
                onClick={() => setChartType('area')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-gray-200 dark:border-gray-700 ${
                  chartType === 'area'
                    ? 'bg-arcade-blue text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Area
              </button>
            </div>
          </div>

          {/* Show Volume */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm">Show Volume</span>
            <button
              onClick={toggleShowVolume}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showVolume ? 'bg-arcade-blue' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showVolume ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Stock Info Section */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Stock Info</h3>

          {/* Reveal Ticker */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <span className="text-sm">Reveal Ticker on Switch</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Show stock symbol in reveal card</span>
            </div>
            <button
              onClick={() => setRevealTickerOnSwitch(!revealTickerOnSwitch)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                revealTickerOnSwitch ? 'bg-arcade-blue' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  revealTickerOnSwitch ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Show Sector */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm">Show Sector</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Display sector in reveal card</span>
            </div>
            <button
              onClick={() => setShowSector(!showSector)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showSector ? 'bg-arcade-blue' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showSector ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Audio Section */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Audio</h3>

          {/* Sound Toggle */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm">Sound Effects</span>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                soundEnabled ? 'bg-arcade-blue' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Volume Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Volume</span>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {Math.round(soundVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={soundVolume * 100}
              onChange={(e) => setSoundVolume(Number(e.target.value) / 100)}
              disabled={!soundEnabled}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed slider"
            />
          </div>
        </div>

        {/* Data Section */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Data</h3>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm">Reset Stats</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Clear all session statistics</span>
            </div>
            <button
              onClick={handleResetStats}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                showResetConfirm
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {showResetConfirm ? 'Click to Confirm' : 'Reset'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default SettingsModal
