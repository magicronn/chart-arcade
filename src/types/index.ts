// ============================================================================
// OHLCV Data Types
// ============================================================================

export interface OHLCVBar {
  time: string // ISO date string YYYY-MM-DD
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface StockData {
  ticker: string
  name?: string
  sector?: string
  bars: OHLCVBar[]
}

export interface StockMetadata {
  ticker: string
  name?: string
  sector?: string
  startDate: string
  endDate: string
  barCount: number
}

// ============================================================================
// Game State Types
// ============================================================================

export type ActionType = 'skip' | 'buy' | 'sell'

export type Direction = 'up' | 'down' | 'flat'

export interface Position {
  shares: number
  averageCost: number
  entryBarIndex: number
}

export interface Trade {
  type: 'buy' | 'sell'
  barIndex: number
  price: number
  shares: number
  timestamp: number
}

export interface HoldingPeriod {
  entryBarIndex: number
  exitBarIndex: number | null // null if still holding
  entryPrice: number
  exitPrice: number | null
}

export interface TurnOutcome {
  turnNumber: number
  barIndex: number
  action: ActionType
  positionBeforeAction: Position | null
  positionAfterAction: Position | null
  inferredPrediction: 'up' | 'down'
  actualDirection: Direction
  isWin: boolean | null // null for flat outcomes
  priceAtAction: number
  priceNextBar: number
}

// ============================================================================
// Stats Types
// ============================================================================

export interface SessionStats {
  totalTurns: number
  totalTrades: number
  wins: number
  losses: number
  flats: number
  currentStreak: number
  bestStreak: number
  worstStreak: number
  chartsViewed: number
  decisionTimes: number[] // milliseconds per decision
}

export interface FunStats {
  diamondHands: {
    maxUnrealizedGain: number
    barIndex: number | null
  }
  paperHands: {
    maxGainSoldEarly: number
    potentialGain: number
  }
  longestHold: number // number of bars
  fastestCorrectDecision: number // milliseconds
  biggestReversalSurvived: number // percentage
}

export interface AllTimeStats extends SessionStats {
  totalSessions: number
  funStats: FunStats
}

// ============================================================================
// Settings Types
// ============================================================================

export type ChartType = 'line' | 'area' | 'candlestick'

// Legacy zoom window (may be used elsewhere)
export type ZoomWindow = '1m' | '3m' | '6m' | '1y' | 'all'

// Time-scale options: defines both the window length and bar width
export type TimeScaleOption = '3y-weekly' | '1y-daily' | '6m-daily' | '1m-daily'

export interface TimeScaleConfig {
  id: TimeScaleOption
  label: string
  windowMonths: number
  barWidth: 'daily' | 'weekly'
}

export const TIME_SCALE_OPTIONS: TimeScaleConfig[] = [
  { id: '3y-weekly', label: '3Y Weekly', windowMonths: 36, barWidth: 'weekly' },
  { id: '1y-daily', label: '1Y Daily', windowMonths: 12, barWidth: 'daily' },
  { id: '6m-daily', label: '6M Daily', windowMonths: 6, barWidth: 'daily' },
  { id: '1m-daily', label: '1M Daily', windowMonths: 1, barWidth: 'daily' },
]

export interface IndicatorConfig {
  id: string
  type: IndicatorType
  enabled: boolean
  params: Record<string, number>
  color?: string
}

export type IndicatorType =
  | 'sma'
  | 'ema'
  | 'vwap'
  | 'bollinger'
  | 'macd'
  | 'rsi'
  | 'iv'

export interface Settings {
  darkMode: boolean
  soundEnabled: boolean
  soundVolume: number
  defaultChartType: ChartType
  defaultZoomWindow: ZoomWindow
  timeScale: TimeScaleOption
  showVolume: boolean
  showSector: boolean
  revealTickerOnSwitch: boolean
  indicators: IndicatorConfig[]
}

// ============================================================================
// Game Engine Types
// ============================================================================

export interface GameState {
  // Stock data
  currentStock: StockData | null
  currentBarIndex: number

  // Player state
  cash: number
  position: Position | null

  // History
  trades: Trade[]
  holdingPeriods: HoldingPeriod[]
  turnOutcomes: TurnOutcome[]

  // Turn tracking
  turnNumber: number
  turnStartTime: number | null

  // Session stats
  sessionStats: SessionStats

  // UI state
  isLoading: boolean
  lastAction: ActionType | null
  lastOutcome: TurnOutcome | null
  showRevealCard: boolean
  revealedStock: StockMetadata | null
}

// ============================================================================
// Chart Types (for Lightweight Charts)
// ============================================================================

export interface CandlestickData {
  time: string
  open: number
  high: number
  low: number
  close: number
}

export interface LineData {
  time: string
  value: number
}

export interface VolumeData {
  time: string
  value: number
  color: string
}

export interface HistogramData {
  time: string
  value: number
  color: string
}
