import { useEffect, useState } from 'react'
import { Modal } from './Modal'
import type { StockMetadata } from '@/types'
import { useSettingsStore } from '@/stores/settingsStore'

interface RevealCardProps {
  isOpen: boolean
  onClose: () => void
  stock: StockMetadata | null
}

export function RevealCard({ isOpen, onClose, stock }: RevealCardProps) {
  const { revealTickerOnSwitch, showSector } = useSettingsStore()
  const [revealed, setRevealed] = useState(false)

  // Reset revealed state when modal opens
  useEffect(() => {
    if (isOpen) {
      setRevealed(false)
      // Auto-reveal after a short delay for dramatic effect
      const timer = setTimeout(() => setRevealed(true), 500)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!stock) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false}>
      <div className="text-center space-y-6 select-none">
        <div className="text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">
          Stock Revealed
        </div>

        <div className={`transition-all duration-500 ${revealed ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          {revealTickerOnSwitch ? (
            <>
              <div className="text-4xl font-bold text-arcade-blue mb-2">
                {stock.ticker}
              </div>
              {stock.name && (
                <div className="text-lg text-gray-700 dark:text-gray-300">
                  {stock.name}
                </div>
              )}
              {showSector && stock.sector && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {stock.sector}
                </div>
              )}
            </>
          ) : (
            <div className="text-2xl text-gray-500 dark:text-gray-400">
              (Ticker hidden by settings)
            </div>
          )}
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          Date range: {stock.startDate} to {stock.endDate}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-lg bg-arcade-green hover:bg-green-600 text-white font-semibold transition-colors"
        >
          Continue to Next Stock
        </button>
      </div>
    </Modal>
  )
}

export default RevealCard
