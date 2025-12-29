import type { StockData, StockMetadata, OHLCVBar, Direction } from '@/types'

// Constants
export const EPSILON = 0.0005 // 0.05% threshold for flat detection
export const MIN_LOOKBACK_BARS = 60 // Minimum bars visible before starting point
export const MIN_FORWARD_BARS = 100 // Minimum bars remaining after starting point

/**
 * Determines the direction of price movement between two closes
 */
export function getDirection(currentClose: number, nextClose: number): Direction {
  const change = (nextClose - currentClose) / currentClose
  if (change > EPSILON) return 'up'
  if (change < -EPSILON) return 'down'
  return 'flat'
}

/**
 * Calculates percentage change between two prices
 */
export function calculatePercentChange(oldPrice: number, newPrice: number): number {
  return ((newPrice - oldPrice) / oldPrice) * 100
}

/**
 * Formats a number as currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Formats a number with commas and specified decimal places
 */
export function formatNumber(num: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

/**
 * Formats shares with appropriate precision
 */
export function formatShares(shares: number): string {
  if (shares === 0) return '0'
  if (shares < 0.01) return shares.toFixed(6)
  if (shares < 1) return shares.toFixed(4)
  return shares.toFixed(2)
}

/**
 * Calculates unrealized P/L for a position
 */
export function calculateUnrealizedPL(
  shares: number,
  averageCost: number,
  currentPrice: number
): { amount: number; percentage: number } {
  const costBasis = shares * averageCost
  const currentValue = shares * currentPrice
  const amount = currentValue - costBasis
  const percentage = (amount / costBasis) * 100

  return { amount, percentage }
}

/**
 * Validates a stock has sufficient data for gameplay
 */
export function validateStockData(stock: StockData): {
  valid: boolean
  reason?: string
} {
  if (!stock.bars || stock.bars.length === 0) {
    return { valid: false, reason: 'No price data available' }
  }

  const minBars = MIN_LOOKBACK_BARS + MIN_FORWARD_BARS
  if (stock.bars.length < minBars) {
    return {
      valid: false,
      reason: `Insufficient data: need ${minBars} bars, have ${stock.bars.length}`,
    }
  }

  // Check for data quality (no extreme gaps)
  const maxGapDays = 10
  for (let i = 1; i < stock.bars.length; i++) {
    const prevDate = new Date(stock.bars[i - 1].time)
    const currDate = new Date(stock.bars[i].time)
    const daysDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)

    if (daysDiff > maxGapDays) {
      return {
        valid: false,
        reason: `Data gap too large: ${daysDiff} days between ${stock.bars[i - 1].time} and ${stock.bars[i].time}`,
      }
    }
  }

  return { valid: true }
}

/**
 * Selects a random valid starting index for a stock
 */
export function selectRandomStartIndex(stock: StockData): number {
  const minStart = MIN_LOOKBACK_BARS
  const maxStart = stock.bars.length - MIN_FORWARD_BARS

  if (maxStart <= minStart) {
    return minStart
  }

  return Math.floor(Math.random() * (maxStart - minStart + 1)) + minStart
}

/**
 * Creates metadata from stock data
 */
export function createStockMetadata(stock: StockData): StockMetadata {
  return {
    ticker: stock.ticker,
    name: stock.name,
    sector: stock.sector,
    startDate: stock.bars[0].time,
    endDate: stock.bars[stock.bars.length - 1].time,
    barCount: stock.bars.length,
  }
}

/**
 * Gets visible bars up to current index (for chart display)
 */
export function getVisibleBars(bars: OHLCVBar[], currentIndex: number): OHLCVBar[] {
  return bars.slice(0, currentIndex + 1)
}

/**
 * Calculates win rate from wins and losses
 */
export function calculateWinRate(wins: number, losses: number): number {
  const total = wins + losses
  if (total === 0) return 0
  return (wins / total) * 100
}

/**
 * Formats time duration in milliseconds to human readable
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

/**
 * Calculates average decision time from array of times
 */
export function calculateAverageDecisionTime(times: number[]): number {
  if (times.length === 0) return 0
  return times.reduce((a, b) => a + b, 0) / times.length
}

/**
 * Generates a deterministic seed from stock and start index
 * Can be used for replay functionality
 */
export function generateGameSeed(ticker: string, startIndex: number): string {
  return `${ticker}-${startIndex}-${Date.now()}`
}

/**
 * Parses a game seed back into components
 */
export function parseGameSeed(seed: string): {
  ticker: string
  startIndex: number
  timestamp: number
} | null {
  const parts = seed.split('-')
  if (parts.length !== 3) return null

  return {
    ticker: parts[0],
    startIndex: parseInt(parts[1], 10),
    timestamp: parseInt(parts[2], 10),
  }
}
