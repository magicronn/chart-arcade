import { Modal } from './Modal'
import { useGameStore } from '@/stores/gameStore'

interface StatsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function StatsModal({ isOpen, onClose }: StatsModalProps) {
  const { sessionStats, holdingPeriods } = useGameStore()

  // Calculate accuracy
  const totalDecisions = sessionStats.wins + sessionStats.losses
  const accuracy = totalDecisions > 0
    ? ((sessionStats.wins / totalDecisions) * 100).toFixed(1)
    : '0.0'

  // Calculate average decision time
  const avgDecisionTime = sessionStats.decisionTimes.length > 0
    ? (sessionStats.decisionTimes.reduce((sum, time) => sum + time, 0) / sessionStats.decisionTimes.length / 1000).toFixed(1)
    : '0.0'

  // Calculate fun stats
  const longestHold = holdingPeriods.reduce((max, hp) => {
    const length = hp.exitBarIndex !== null
      ? hp.exitBarIndex - hp.entryBarIndex
      : 0
    return Math.max(max, length)
  }, 0)

  const profitableTrades = holdingPeriods.filter(hp => {
    if (hp.exitPrice !== null && hp.exitBarIndex !== null) {
      return hp.exitPrice > hp.entryPrice
    }
    return false
  }).length

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Statistics">
      <div className="space-y-6">
        {/* Session Stats Section */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">SESSION STATS</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Accuracy</p>
              <p className="text-2xl font-bold text-arcade-blue">{accuracy}%</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Turns</p>
              <p className="text-2xl font-bold">{sessionStats.totalTurns}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Wins</p>
              <p className="text-2xl font-bold text-arcade-green">{sessionStats.wins}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Losses</p>
              <p className="text-2xl font-bold text-arcade-red">{sessionStats.losses}</p>
            </div>
          </div>
        </div>

        {/* Streaks Section */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">STREAKS</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current</p>
              <p className={`text-xl font-bold ${
                sessionStats.currentStreak > 0 ? 'text-arcade-green' :
                sessionStats.currentStreak < 0 ? 'text-arcade-red' : ''
              }`}>
                {sessionStats.currentStreak > 0 ? '+' : ''}{sessionStats.currentStreak}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Best</p>
              <p className="text-xl font-bold text-arcade-green">
                {sessionStats.bestStreak > 0 ? '+' : ''}{sessionStats.bestStreak}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Worst</p>
              <p className="text-xl font-bold text-arcade-red">
                {sessionStats.worstStreak}
              </p>
            </div>
          </div>
        </div>

        {/* Fun Stats Section */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">FUN STATS</h3>
          <div className="space-y-3">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">💎 Diamond Hands</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Longest hold</p>
                </div>
                <p className="text-lg font-bold">{longestHold} bars</p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">📈 Trade Success</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Profitable trades</p>
                </div>
                <p className="text-lg font-bold">
                  {profitableTrades} / {holdingPeriods.filter(hp => hp.exitBarIndex !== null).length}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">⚡ Avg Decision Time</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Time per action</p>
                </div>
                <p className="text-lg font-bold">{avgDecisionTime}s</p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">📊 Charts Viewed</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total stocks played</p>
                </div>
                <p className="text-lg font-bold">{sessionStats.chartsViewed}</p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">🎯 Total Trades</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Buy/sell actions</p>
                </div>
                <p className="text-lg font-bold">{sessionStats.totalTrades}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trading Activity */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">TRADING ACTIVITY</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Flat outcomes</span>
              <span className="font-medium">{sessionStats.flats}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Total decisions</span>
              <span className="font-medium">{totalDecisions}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default StatsModal
