import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  GameState,
  StockData,
  Position,
  Trade,
  TurnOutcome,
  SessionStats,
  Direction,
  StockMetadata,
} from '@/types'

// Constants
const INITIAL_CASH = 10000
const EPSILON = 0.0005 // 0.05% threshold for flat detection

interface GameActions {
  // Stock management
  loadStock: (stock: StockData, startIndex: number) => void
  switchStock: () => Promise<void>

  // Game actions
  skip: () => void
  buy: (percentage: number) => void
  sell: (percentage: number) => void

  // Internal helpers
  advanceBar: () => void
  calculateOutcome: () => TurnOutcome | null
  recordTurnOutcome: (outcome: TurnOutcome) => void

  // Session management
  resetSession: () => void
  resetAllStats: () => void

  // UI state
  setLoading: (loading: boolean) => void
  hideRevealCard: () => void
}

type GameStore = GameState & GameActions

const initialSessionStats: SessionStats = {
  totalTurns: 0,
  totalTrades: 0,
  wins: 0,
  losses: 0,
  flats: 0,
  currentStreak: 0,
  bestStreak: 0,
  worstStreak: 0,
  chartsViewed: 0,
  decisionTimes: [],
}

const initialState: GameState = {
  currentStock: null,
  currentBarIndex: 0,
  cash: INITIAL_CASH,
  position: null,
  trades: [],
  holdingPeriods: [],
  turnOutcomes: [],
  turnNumber: 0,
  turnStartTime: null,
  sessionStats: { ...initialSessionStats },
  isLoading: false,
  lastAction: null,
  lastOutcome: null,
  showRevealCard: false,
  revealedStock: null,
}

// Helper to determine direction
function getDirection(currentClose: number, nextClose: number): Direction {
  const change = (nextClose - currentClose) / currentClose
  if (change > EPSILON) return 'up'
  if (change < -EPSILON) return 'down'
  return 'flat'
}

// Helper to infer prediction from position state
function inferPrediction(position: Position | null): 'up' | 'down' {
  return position !== null && position.shares > 0 ? 'up' : 'down'
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      loadStock: (stock, startIndex) => {
        set({
          currentStock: stock,
          currentBarIndex: startIndex,
          position: null,
          trades: [],
          holdingPeriods: [],
          turnOutcomes: [],
          turnNumber: 0,
          turnStartTime: Date.now(),
          lastAction: null,
          lastOutcome: null,
          showRevealCard: false,
          revealedStock: null,
          sessionStats: {
            ...get().sessionStats,
            chartsViewed: get().sessionStats.chartsViewed + 1,
          },
        })
      },

      switchStock: async () => {
        const state = get()

        // If holding, sell all first
        if (state.position && state.position.shares > 0 && state.currentStock) {
          const currentBar = state.currentStock.bars[state.currentBarIndex]
          const sellPrice = currentBar.close

          // Record final trade
          const trade: Trade = {
            type: 'sell',
            barIndex: state.currentBarIndex,
            price: sellPrice,
            shares: state.position.shares,
            timestamp: Date.now(),
          }

          // Close holding period
          const updatedHoldingPeriods = state.holdingPeriods.map((hp, idx) => {
            if (idx === state.holdingPeriods.length - 1 && hp.exitBarIndex === null) {
              return { ...hp, exitBarIndex: state.currentBarIndex, exitPrice: sellPrice }
            }
            return hp
          })

          // Show reveal card
          const revealedStock: StockMetadata = {
            ticker: state.currentStock.ticker,
            name: state.currentStock.name,
            sector: state.currentStock.sector,
            startDate: state.currentStock.bars[0].time,
            endDate: state.currentStock.bars[state.currentStock.bars.length - 1].time,
            barCount: state.currentStock.bars.length,
          }

          set({
            cash: state.cash + state.position.shares * sellPrice,
            position: null,
            trades: [...state.trades, trade],
            holdingPeriods: updatedHoldingPeriods,
            showRevealCard: true,
            revealedStock,
            sessionStats: {
              ...state.sessionStats,
              totalTrades: state.sessionStats.totalTrades + 1,
            },
          })
        } else if (state.currentStock) {
          // No position, just show reveal
          const revealedStock: StockMetadata = {
            ticker: state.currentStock.ticker,
            name: state.currentStock.name,
            sector: state.currentStock.sector,
            startDate: state.currentStock.bars[0].time,
            endDate: state.currentStock.bars[state.currentStock.bars.length - 1].time,
            barCount: state.currentStock.bars.length,
          }

          set({
            showRevealCard: true,
            revealedStock,
          })
        }

        // TODO: Load next random stock
      },

      skip: () => {
        const state = get()
        if (!state.currentStock) return

        // Record decision time
        const decisionTime = state.turnStartTime ? Date.now() - state.turnStartTime : 0

        set({ lastAction: 'skip' })

        // Calculate outcome before advancing
        const outcome = get().calculateOutcome()

        // Advance the chart
        get().advanceBar()

        // Record outcome
        if (outcome) {
          get().recordTurnOutcome({
            ...outcome,
            action: 'skip',
          })
        }

        // Update stats
        set((s) => ({
          sessionStats: {
            ...s.sessionStats,
            totalTurns: s.sessionStats.totalTurns + 1,
            decisionTimes: [...s.sessionStats.decisionTimes, decisionTime],
          },
          turnStartTime: Date.now(),
        }))
      },

      buy: (percentage) => {
        const state = get()
        if (!state.currentStock || percentage <= 0 || percentage > 100) return
        if (state.cash <= 0) return

        const currentBar = state.currentStock.bars[state.currentBarIndex]
        const price = currentBar.close
        const amountToSpend = state.cash * (percentage / 100)
        const sharesToBuy = amountToSpend / price

        // Record decision time
        const decisionTime = state.turnStartTime ? Date.now() - state.turnStartTime : 0

        // Create trade
        const trade: Trade = {
          type: 'buy',
          barIndex: state.currentBarIndex,
          price,
          shares: sharesToBuy,
          timestamp: Date.now(),
        }

        // Update position
        const existingShares = state.position?.shares ?? 0
        const existingCost = state.position?.averageCost ?? 0
        const newShares = existingShares + sharesToBuy
        const newAverageCost =
          (existingShares * existingCost + sharesToBuy * price) / newShares

        const newPosition: Position = {
          shares: newShares,
          averageCost: newAverageCost,
          entryBarIndex: state.position?.entryBarIndex ?? state.currentBarIndex,
        }

        // Start new holding period if we weren't holding
        let holdingPeriods = state.holdingPeriods
        if (!state.position || state.position.shares === 0) {
          holdingPeriods = [
            ...holdingPeriods,
            {
              entryBarIndex: state.currentBarIndex,
              exitBarIndex: null,
              entryPrice: price,
              exitPrice: null,
            },
          ]
        }

        set({
          cash: state.cash - amountToSpend,
          position: newPosition,
          trades: [...state.trades, trade],
          holdingPeriods,
          lastAction: 'buy',
        })

        // Calculate outcome before advancing
        const outcome = get().calculateOutcome()

        // Advance the chart
        get().advanceBar()

        // Record outcome
        if (outcome) {
          get().recordTurnOutcome({
            ...outcome,
            action: 'buy',
          })
        }

        // Update stats
        set((s) => ({
          sessionStats: {
            ...s.sessionStats,
            totalTurns: s.sessionStats.totalTurns + 1,
            totalTrades: s.sessionStats.totalTrades + 1,
            decisionTimes: [...s.sessionStats.decisionTimes, decisionTime],
          },
          turnStartTime: Date.now(),
        }))
      },

      sell: (percentage) => {
        const state = get()
        if (!state.currentStock || percentage <= 0 || percentage > 100) return
        if (!state.position || state.position.shares <= 0) return

        const currentBar = state.currentStock.bars[state.currentBarIndex]
        const price = currentBar.close
        const sharesToSell = state.position.shares * (percentage / 100)
        const proceeds = sharesToSell * price

        // Record decision time
        const decisionTime = state.turnStartTime ? Date.now() - state.turnStartTime : 0

        // Create trade
        const trade: Trade = {
          type: 'sell',
          barIndex: state.currentBarIndex,
          price,
          shares: sharesToSell,
          timestamp: Date.now(),
        }

        // Update position
        const remainingShares = state.position.shares - sharesToSell
        const newPosition: Position | null =
          remainingShares > 0.0001 // Small epsilon for floating point
            ? { ...state.position, shares: remainingShares }
            : null

        // Close holding period if fully sold
        let holdingPeriods = state.holdingPeriods
        if (!newPosition) {
          holdingPeriods = holdingPeriods.map((hp, idx) => {
            if (idx === holdingPeriods.length - 1 && hp.exitBarIndex === null) {
              return { ...hp, exitBarIndex: state.currentBarIndex, exitPrice: price }
            }
            return hp
          })
        }

        set({
          cash: state.cash + proceeds,
          position: newPosition,
          trades: [...state.trades, trade],
          holdingPeriods,
          lastAction: 'sell',
        })

        // Calculate outcome before advancing
        const outcome = get().calculateOutcome()

        // Advance the chart
        get().advanceBar()

        // Record outcome
        if (outcome) {
          get().recordTurnOutcome({
            ...outcome,
            action: 'sell',
          })
        }

        // Update stats
        set((s) => ({
          sessionStats: {
            ...s.sessionStats,
            totalTurns: s.sessionStats.totalTurns + 1,
            totalTrades: s.sessionStats.totalTrades + 1,
            decisionTimes: [...s.sessionStats.decisionTimes, decisionTime],
          },
          turnStartTime: Date.now(),
        }))
      },

      advanceBar: () => {
        set((state) => ({
          currentBarIndex: state.currentBarIndex + 1,
          turnNumber: state.turnNumber + 1,
        }))
      },

      calculateOutcome: () => {
        const state = get()
        if (!state.currentStock) return null

        const currentBar = state.currentStock.bars[state.currentBarIndex]
        const nextBar = state.currentStock.bars[state.currentBarIndex + 1]
        if (!nextBar) return null

        const direction = getDirection(currentBar.close, nextBar.close)
        const prediction = inferPrediction(state.position)

        let isWin: boolean | null = null
        if (direction !== 'flat') {
          isWin = prediction === direction
        }

        return {
          turnNumber: state.turnNumber,
          barIndex: state.currentBarIndex,
          action: state.lastAction ?? 'skip',
          positionBeforeAction: state.position,
          positionAfterAction: state.position,
          inferredPrediction: prediction,
          actualDirection: direction,
          isWin,
          priceAtAction: currentBar.close,
          priceNextBar: nextBar.close,
        }
      },

      recordTurnOutcome: (outcome) => {
        set((state) => {
          const stats = { ...state.sessionStats }

          if (outcome.isWin === true) {
            stats.wins += 1
            stats.currentStreak = stats.currentStreak > 0 ? stats.currentStreak + 1 : 1
            stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak)
          } else if (outcome.isWin === false) {
            stats.losses += 1
            stats.currentStreak = stats.currentStreak < 0 ? stats.currentStreak - 1 : -1
            stats.worstStreak = Math.min(stats.worstStreak, stats.currentStreak)
          } else {
            stats.flats += 1
          }

          return {
            turnOutcomes: [...state.turnOutcomes, outcome],
            lastOutcome: outcome,
            sessionStats: stats,
          }
        })
      },

      resetSession: () => {
        set({
          ...initialState,
          sessionStats: { ...initialSessionStats },
        })
      },

      resetAllStats: () => {
        set({
          ...initialState,
          sessionStats: { ...initialSessionStats },
        })
      },

      setLoading: (loading) => set({ isLoading: loading }),

      hideRevealCard: () => set({ showRevealCard: false, revealedStock: null }),
    }),
    {
      name: 'chart-arcade-game',
      // Only persist session stats across refreshes
      // Cash and position reset with each new stock since stock data isn't persisted
      partialize: (state) => ({
        sessionStats: state.sessionStats,
      }),
    }
  )
)
