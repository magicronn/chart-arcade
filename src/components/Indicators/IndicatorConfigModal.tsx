import { useState, useEffect } from 'react'
import { Modal } from '../Modal'
import { ColorPicker, INDICATOR_COLORS } from './ColorPicker'
import type { IndicatorType, IndicatorConfig } from '@/types'

interface IndicatorConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (type: IndicatorType, params: Record<string, number>, color: string) => void
  editingIndicator?: IndicatorConfig | null
}

// Indicator type definitions with default params and labels
const INDICATOR_DEFINITIONS: Record<
  IndicatorType,
  {
    label: string
    params: { key: string; label: string; default: number; min: number; max: number }[]
  }
> = {
  sma: {
    label: 'SMA (Simple Moving Average)',
    params: [{ key: 'period', label: 'Period', default: 20, min: 2, max: 200 }],
  },
  ema: {
    label: 'EMA (Exponential Moving Average)',
    params: [{ key: 'period', label: 'Period', default: 12, min: 2, max: 200 }],
  },
  vwap: {
    label: 'VWAP (Volume Weighted Avg Price)',
    params: [],
  },
  bollinger: {
    label: 'Bollinger Bands',
    params: [
      { key: 'period', label: 'Period', default: 20, min: 2, max: 200 },
      { key: 'stdDev', label: 'Std Deviations', default: 2, min: 1, max: 4 },
    ],
  },
  rsi: {
    label: 'RSI (Relative Strength Index)',
    params: [{ key: 'period', label: 'Period', default: 14, min: 2, max: 50 }],
  },
  macd: {
    label: 'MACD',
    params: [
      { key: 'fast', label: 'Fast Period', default: 12, min: 2, max: 50 },
      { key: 'slow', label: 'Slow Period', default: 26, min: 2, max: 100 },
      { key: 'signal', label: 'Signal Period', default: 9, min: 2, max: 50 },
    ],
  },
  iv: {
    label: 'Implied Volatility',
    params: [],
  },
}

// Exclude IV since we don't have options data
const AVAILABLE_TYPES: IndicatorType[] = ['sma', 'ema', 'vwap', 'bollinger', 'rsi', 'macd']

export function IndicatorConfigModal({
  isOpen,
  onClose,
  onSave,
  editingIndicator,
}: IndicatorConfigModalProps) {
  const [selectedType, setSelectedType] = useState<IndicatorType>('sma')
  const [params, setParams] = useState<Record<string, number>>({})
  const [color, setColor] = useState(INDICATOR_COLORS[0])

  // Initialize state when modal opens or editing indicator changes
  useEffect(() => {
    if (isOpen) {
      if (editingIndicator) {
        setSelectedType(editingIndicator.type)
        setParams({ ...editingIndicator.params })
        setColor(editingIndicator.color || INDICATOR_COLORS[0])
      } else {
        // Reset to defaults for new indicator
        setSelectedType('sma')
        const def = INDICATOR_DEFINITIONS.sma
        const defaultParams: Record<string, number> = {}
        def.params.forEach((p) => {
          defaultParams[p.key] = p.default
        })
        setParams(defaultParams)
        // Pick a random color for variety
        setColor(INDICATOR_COLORS[Math.floor(Math.random() * INDICATOR_COLORS.length)])
      }
    }
  }, [isOpen, editingIndicator])

  // Update params when type changes
  const handleTypeChange = (type: IndicatorType) => {
    setSelectedType(type)
    const def = INDICATOR_DEFINITIONS[type]
    const newParams: Record<string, number> = {}
    def.params.forEach((p) => {
      newParams[p.key] = p.default
    })
    setParams(newParams)
  }

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    onSave(selectedType, params, color)
    onClose()
  }

  const definition = INDICATOR_DEFINITIONS[selectedType]
  const isEditing = !!editingIndicator

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Indicator' : 'Add Indicator'}>
      <div className="space-y-4">
        {/* Type Selector (only show when adding new) */}
        {!isEditing && (
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => handleTypeChange(e.target.value as IndicatorType)}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arcade-blue"
            >
              {AVAILABLE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {INDICATOR_DEFINITIONS[type].label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Show type label when editing */}
        {isEditing && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {definition.label}
          </div>
        )}

        {/* Parameters */}
        {definition.params.length > 0 && (
          <div className="space-y-3">
            {definition.params.map((param) => {
              const currentValue = params[param.key] ?? param.default

              const handleIncrement = () => {
                const newValue = Math.min(currentValue + 1, param.max)
                handleParamChange(param.key, newValue)
              }

              const handleDecrement = () => {
                const newValue = Math.max(currentValue - 1, param.min)
                handleParamChange(param.key, newValue)
              }

              const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value
                // Allow empty string while typing
                if (value === '') {
                  handleParamChange(param.key, param.min)
                  return
                }
                const numValue = parseInt(value)
                if (!isNaN(numValue)) {
                  // Clamp to min/max
                  const clampedValue = Math.max(param.min, Math.min(param.max, numValue))
                  handleParamChange(param.key, clampedValue)
                }
              }

              return (
                <div key={param.key}>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {param.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDecrement}
                      disabled={currentValue <= param.min}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <input
                      type="number"
                      value={currentValue}
                      onChange={handleInputChange}
                      min={param.min}
                      max={param.max}
                      className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-arcade-blue"
                    />
                    <button
                      type="button"
                      onClick={handleIncrement}
                      disabled={currentValue >= param.max}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Min: {param.min}, Max: {param.max}
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {/* No params message */}
        {definition.params.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            No configuration required for this indicator.
          </p>
        )}

        {/* Color Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Color
          </label>
          <ColorPicker selectedColor={color} onChange={setColor} />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-arcade-blue text-white hover:bg-blue-600 transition-colors"
          >
            {isEditing ? 'Save' : 'Add'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default IndicatorConfigModal
