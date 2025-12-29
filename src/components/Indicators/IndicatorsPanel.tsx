import { useState, useRef, useEffect } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { IndicatorConfigModal } from './IndicatorConfigModal'
import { ColorPicker } from './ColorPicker'
import type { IndicatorConfig, IndicatorType } from '@/types'

// Quick add presets
const QUICK_ADD_PRESETS: { type: IndicatorType; label: string; params: Record<string, number> }[] = [
  { type: 'sma', label: 'SMA', params: { period: 20 } },
  { type: 'ema', label: 'EMA', params: { period: 12 } },
  { type: 'vwap', label: 'VWAP', params: {} },
  { type: 'bollinger', label: 'BB', params: { period: 20, stdDev: 2 } },
  { type: 'rsi', label: 'RSI', params: { period: 14 } },
  { type: 'macd', label: 'MACD', params: { fast: 12, slow: 26, signal: 9 } },
]

// Indicator colors for quick add (cycle through these)
const QUICK_ADD_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#22c55e', '#ec4899', '#14b8a6', '#f97316']

// Get display name for an indicator
function getIndicatorDisplayName(indicator: IndicatorConfig): string {
  const { type, params } = indicator
  switch (type) {
    case 'sma':
      return `SMA ${params.period || 20}`
    case 'ema':
      return `EMA ${params.period || 12}`
    case 'vwap':
      return 'VWAP'
    case 'bollinger':
      return `BB ${params.period || 20}`
    case 'rsi':
      return `RSI ${params.period || 14}`
    case 'macd':
      return `MACD ${params.fast || 12}/${params.slow || 26}`
    default:
      return type.toUpperCase()
  }
}

interface IndicatorsPanelProps {
  isOpen: boolean
  onClose: () => void
  anchorRef: React.RefObject<HTMLButtonElement>
}

export function IndicatorsPanel({ isOpen, onClose, anchorRef }: IndicatorsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const { indicators, addIndicator, removeIndicator, updateIndicator } = useSettingsStore()
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [editingIndicator, setEditingIndicator] = useState<IndicatorConfig | null>(null)
  const [colorPickerId, setColorPickerId] = useState<string | null>(null)

  // Close panel when clicking outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node

      // Don't close if clicking inside a modal
      const modalElements = document.querySelectorAll('[role="dialog"]')
      for (const modal of modalElements) {
        if (modal.contains(target)) {
          return
        }
      }

      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        anchorRef.current &&
        !anchorRef.current.contains(target)
      ) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose, anchorRef])

  // Close color picker when clicking elsewhere (but not in modal)
  useEffect(() => {
    if (!colorPickerId) return

    const handleClick = (e: MouseEvent) => {
      // Don't close if clicking inside a modal
      const target = e.target as Node
      const modalElements = document.querySelectorAll('[role="dialog"], .modal')
      for (const modal of modalElements) {
        if (modal.contains(target)) {
          return
        }
      }
      setColorPickerId(null)
    }

    // Delay to prevent immediate close
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClick)
    }, 0)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleClick)
    }
  }, [colorPickerId])

  if (!isOpen) return null

  const enabledIndicators = indicators.filter((i) => i.enabled)
  const colorIndex = enabledIndicators.length % QUICK_ADD_COLORS.length

  const handleQuickAdd = (preset: typeof QUICK_ADD_PRESETS[0]) => {
    const color = QUICK_ADD_COLORS[(colorIndex + enabledIndicators.length) % QUICK_ADD_COLORS.length]
    addIndicator(preset.type, preset.params, color)
  }

  const handleEdit = (indicator: IndicatorConfig) => {
    setEditingIndicator(indicator)
    setShowConfigModal(true)
  }

  const handleConfigSave = (type: IndicatorType, params: Record<string, number>, color: string) => {
    if (editingIndicator) {
      // Update existing
      updateIndicator(editingIndicator.id, { params, color })
    } else {
      // Add new
      addIndicator(type, params, color)
    }
    setEditingIndicator(null)
  }

  const handleColorChange = (id: string, color: string) => {
    updateIndicator(id, { color })
    setColorPickerId(null)
  }

  return (
    <>
      <div
        ref={panelRef}
        className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-arcade-dark rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-fadeIn"
      >
        {/* Quick Add Section */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">QUICK ADD</h3>
          <div className="flex flex-wrap gap-2">
            {QUICK_ADD_PRESETS.map((preset) => (
              <button
                key={preset.type}
                onClick={() => handleQuickAdd(preset)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active Indicators Section */}
        <div className="p-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">
            ACTIVE ({enabledIndicators.length})
          </h3>
          {enabledIndicators.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic">
              No indicators active. Use Quick Add above.
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {enabledIndicators.map((indicator) => (
                <div
                  key={indicator.id}
                  className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                >
                  {/* Color Swatch */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setColorPickerId(colorPickerId === indicator.id ? null : indicator.id)
                      }}
                      className="w-4 h-4 rounded-full ring-1 ring-gray-300 dark:ring-gray-600 hover:ring-2 transition-all"
                      style={{ backgroundColor: indicator.color }}
                      title="Change color"
                    />
                    {colorPickerId === indicator.id && (
                      <div
                        className="absolute top-6 left-0 z-10 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ColorPicker
                          selectedColor={indicator.color || '#3b82f6'}
                          onChange={(color) => handleColorChange(indicator.id, color)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <span className="flex-1 text-sm font-medium truncate">
                    {getIndicatorDisplayName(indicator)}
                  </span>

                  {/* Edit Button */}
                  <button
                    onClick={() => handleEdit(indicator)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeIndicator(indicator.id)}
                    className="p-1 text-gray-400 hover:text-arcade-red transition-colors"
                    title="Remove"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Custom Button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              setEditingIndicator(null)
              setShowConfigModal(true)
            }}
            className="w-full px-4 py-2 text-sm font-medium rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-arcade-blue hover:text-arcade-blue transition-colors"
          >
            + Add Custom Indicator
          </button>
        </div>
      </div>

      {/* Config Modal */}
      <IndicatorConfigModal
        isOpen={showConfigModal}
        onClose={() => {
          setShowConfigModal(false)
          setEditingIndicator(null)
        }}
        onSave={handleConfigSave}
        editingIndicator={editingIndicator}
      />
    </>
  )
}

export default IndicatorsPanel
