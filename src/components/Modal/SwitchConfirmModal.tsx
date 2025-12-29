import { Modal } from './Modal'
import { useGameStore } from '@/stores/gameStore'
import { formatCurrency, formatShares, calculateUnrealizedPL } from '@/utils/gameLogic'

interface SwitchConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function SwitchConfirmModal({ isOpen, onClose, onConfirm }: SwitchConfirmModalProps) {
  const { position, currentStock, currentBarIndex } = useGameStore()

  if (!position || !currentStock) return null

  const currentPrice = currentStock.bars[currentBarIndex]?.close ?? 0
  const pl = calculateUnrealizedPL(position.shares, position.averageCost, currentPrice)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Switch Stock?">
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          You currently have an open position. Switching to a new stock will automatically sell all shares at the current price.
        </p>

        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Shares</span>
            <span className="font-medium">{formatShares(position.shares)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Avg Cost</span>
            <span className="font-medium">{formatCurrency(position.averageCost)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Current Price</span>
            <span className="font-medium">{formatCurrency(currentPrice)}</span>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Unrealized P/L</span>
            <span className={`font-semibold ${pl.amount >= 0 ? 'text-arcade-green' : 'text-arcade-red'}`}>
              {formatCurrency(pl.amount)} ({pl.percentage >= 0 ? '+' : ''}{pl.percentage.toFixed(2)}%)
            </span>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-lg bg-arcade-blue hover:bg-blue-600 text-white font-medium transition-colors"
          >
            Sell & Switch
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default SwitchConfirmModal
