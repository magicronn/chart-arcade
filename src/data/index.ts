import type { StockData, StockMetadata, OHLCVBar, TimeScaleOption } from '@/types'
import { TIME_SCALE_OPTIONS } from '@/types'

// Stock metadata index - populated after data preprocessing
const stockIndex: StockMetadata[] = []

// Stocks that are bundled (instant load)
const BUNDLED_STOCKS = ['SPY', 'IWM', 'TSLA', 'T', 'AAPL']

// Cache for loaded stocks (both bundled and fetched)
const stockDataCache = new Map<string, StockData>()

// Currently preloading stock (to avoid duplicate fetches)
let preloadingTicker: string | null = null

// Constants for game logic - now dynamic based on time scale
const getMinBars = (timeScale: TimeScaleOption) => {
  const config = TIME_SCALE_OPTIONS.find(t => t.id === timeScale)
  if (!config) return { lookback: 60, forward: 100 }

  // For weekly bars, we need fewer bars
  if (config.barWidth === 'weekly') {
    return { lookback: 30, forward: 50 } // ~30 weeks lookback, 50 weeks forward
  }

  // For daily bars, scale based on window
  switch (config.windowMonths) {
    case 1: return { lookback: 20, forward: 20 } // 1 month daily
    case 6: return { lookback: 60, forward: 100 } // 6 months daily
    case 12: return { lookback: 120, forward: 150 } // 1 year daily
    default: return { lookback: 60, forward: 100 }
  }
}

/**
 * Gets list of all available stocks
 */
export function getAvailableStocks(): StockMetadata[] {
  return stockIndex
}

/**
 * Loads stock data by ticker
 * Handles both bundled stocks (dynamic import) and fetched stocks (from public/)
 * Implements caching to avoid redundant loads
 */
export async function loadStockData(ticker: string): Promise<StockData | null> {
  const upperTicker = ticker.toUpperCase()

  // Check cache first
  if (stockDataCache.has(upperTicker)) {
    return stockDataCache.get(upperTicker)!
  }

  try {
    let data: StockData

    if (BUNDLED_STOCKS.includes(upperTicker)) {
      // Load from bundled source (dynamic import)
      const module = await import(`./stocks/${ticker.toLowerCase()}.json`)
      data = module.default as StockData
    } else {
      // Load from public directory (fetch)
      const response = await fetch(`/stocks/${ticker.toLowerCase()}.json`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      data = await response.json()
    }

    // Cache for future use
    stockDataCache.set(upperTicker, data)
    return data

  } catch (error) {
    console.error(`Failed to load stock data for ${ticker}:`, error)
    return null
  }
}

/**
 * Loads a random stock from the available universe
 * @param preferBundled - If true, prefer bundled stocks for instant loading
 */
export async function loadRandomStock(preferBundled = false): Promise<StockData | null> {
  if (stockIndex.length === 0) {
    console.error('No stocks available in index')
    return null
  }

  let ticker: string

  if (preferBundled) {
    // For first load, prefer bundled stocks for instant start
    const bundledStocks = stockIndex.filter(
      s => BUNDLED_STOCKS.includes(s.ticker.toUpperCase())
    )
    if (bundledStocks.length > 0) {
      const randomIndex = Math.floor(Math.random() * bundledStocks.length)
      ticker = bundledStocks[randomIndex].ticker
    } else {
      // Fallback to any stock
      const randomIndex = Math.floor(Math.random() * stockIndex.length)
      ticker = stockIndex[randomIndex].ticker
    }
  } else {
    // Normal random selection from all stocks
    const randomIndex = Math.floor(Math.random() * stockIndex.length)
    ticker = stockIndex[randomIndex].ticker
  }

  return loadStockData(ticker)
}

/**
 * Preloads a random stock in the background
 * Prioritizes fetched (non-bundled) stocks that aren't yet cached
 * This ensures zero-latency stock switching
 */
export async function preloadNextStock(): Promise<void> {
  if (stockIndex.length === 0) return

  // Pick a random stock that's not bundled (to preload from public/)
  const fetchedStocks = stockIndex.filter(
    s => !BUNDLED_STOCKS.includes(s.ticker.toUpperCase())
  )

  if (fetchedStocks.length === 0) {
    // All stocks are bundled, pick any random one to cache
    const randomIndex = Math.floor(Math.random() * stockIndex.length)
    const ticker = stockIndex[randomIndex].ticker

    // Don't preload if already cached
    if (stockDataCache.has(ticker.toUpperCase())) return

    preloadingTicker = ticker
    await loadStockData(ticker)
    preloadingTicker = null
    return
  }

  // Pick random fetched stock
  const randomIndex = Math.floor(Math.random() * fetchedStocks.length)
  const ticker = fetchedStocks[randomIndex].ticker

  // Don't preload if already cached or currently preloading
  if (stockDataCache.has(ticker.toUpperCase()) || preloadingTicker === ticker) {
    return
  }

  preloadingTicker = ticker
  await loadStockData(ticker)
  preloadingTicker = null
}

/**
 * Selects a random starting index for gameplay
 * Ensures enough bars for lookback context and forward gameplay
 */
export function selectRandomStartIndex(barCount: number, timeScale: TimeScaleOption = '6m-daily'): number {
  const { lookback, forward } = getMinBars(timeScale)

  // Minimum start index ensures we have lookback context
  const minStart = lookback

  // Maximum start index ensures we have enough bars for gameplay
  const maxStart = barCount - forward - 1

  if (maxStart <= minStart) {
    // Not enough bars, return minimum lookback
    console.warn('Stock has insufficient bars for ideal start range')
    return minStart
  }

  // Random index between minStart and maxStart (inclusive)
  return minStart + Math.floor(Math.random() * (maxStart - minStart + 1))
}

/**
 * Aggregates daily bars into weekly bars
 * Each week runs Monday-Friday, with the bar dated on the Friday (or last trading day)
 */
export function aggregateToWeekly(dailyBars: OHLCVBar[]): OHLCVBar[] {
  if (dailyBars.length === 0) return []

  const weeklyBars: OHLCVBar[] = []
  let weekBars: OHLCVBar[] = []
  let currentWeek = -1

  for (const bar of dailyBars) {
    const date = new Date(bar.time)
    // Get ISO week number
    const startOfYear = new Date(date.getFullYear(), 0, 1)
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7)
    const yearWeek = date.getFullYear() * 100 + weekNumber

    if (yearWeek !== currentWeek && weekBars.length > 0) {
      // Close out the previous week
      weeklyBars.push(createWeeklyBar(weekBars))
      weekBars = []
    }

    currentWeek = yearWeek
    weekBars.push(bar)
  }

  // Don't forget the last week
  if (weekBars.length > 0) {
    weeklyBars.push(createWeeklyBar(weekBars))
  }

  return weeklyBars
}

/**
 * Creates a single weekly bar from a set of daily bars
 */
function createWeeklyBar(dailyBars: OHLCVBar[]): OHLCVBar {
  return {
    time: dailyBars[dailyBars.length - 1].time, // Use last day as the bar date
    open: dailyBars[0].open,
    high: Math.max(...dailyBars.map(b => b.high)),
    low: Math.min(...dailyBars.map(b => b.low)),
    close: dailyBars[dailyBars.length - 1].close,
    volume: dailyBars.reduce((sum, b) => sum + b.volume, 0),
  }
}

/**
 * Processes stock data based on the selected time scale
 * Returns a new StockData object with appropriately transformed bars
 */
export function processStockForTimeScale(stock: StockData, timeScale: TimeScaleOption): StockData {
  const config = TIME_SCALE_OPTIONS.find(t => t.id === timeScale)
  if (!config) return stock

  let bars = stock.bars

  // Aggregate to weekly if needed
  if (config.barWidth === 'weekly') {
    bars = aggregateToWeekly(bars)
  }

  return {
    ...stock,
    bars,
  }
}

/**
 * Parses raw CSV data into OHLCVBar array
 * Utility for preprocessing scripts
 */
export function parseCSVData(csvContent: string): OHLCVBar[] {
  const lines = csvContent.trim().split('\n')
  const headers = lines[0].toLowerCase().split(',')

  // Find column indices
  const dateIdx = headers.findIndex((h) => h.includes('date'))
  const openIdx = headers.findIndex((h) => h === 'open')
  const highIdx = headers.findIndex((h) => h === 'high')
  const lowIdx = headers.findIndex((h) => h === 'low')
  const closeIdx = headers.findIndex((h) => h.includes('close') && !h.includes('adj'))
  const adjCloseIdx = headers.findIndex((h) => h.includes('adj'))
  const volumeIdx = headers.findIndex((h) => h === 'volume')

  // Use adjusted close if available, otherwise regular close
  const priceIdx = adjCloseIdx !== -1 ? adjCloseIdx : closeIdx

  const bars: OHLCVBar[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',')
    if (values.length < 6) continue

    const bar: OHLCVBar = {
      time: values[dateIdx],
      open: parseFloat(values[openIdx]),
      high: parseFloat(values[highIdx]),
      low: parseFloat(values[lowIdx]),
      close: parseFloat(values[priceIdx]),
      volume: parseInt(values[volumeIdx], 10),
    }

    // Validate bar data
    if (
      !isNaN(bar.open) &&
      !isNaN(bar.high) &&
      !isNaN(bar.low) &&
      !isNaN(bar.close) &&
      !isNaN(bar.volume) &&
      bar.time
    ) {
      bars.push(bar)
    }
  }

  // Sort by date ascending
  bars.sort((a, b) => a.time.localeCompare(b.time))

  return bars
}

/**
 * Initializes the stock index from a metadata file
 * Tries to load from public/stocks/metadata.json first (for dynamic updates),
 * then falls back to bundled src/data/metadata.json
 */
export async function initializeStockIndex(): Promise<void> {
  try {
    // Try fetching from public directory first (allows updates without rebuild)
    const response = await fetch('/stocks/metadata.json')
    if (response.ok) {
      const metadata = await response.json() as StockMetadata[]
      stockIndex.length = 0
      stockIndex.push(...metadata)
      console.log(`Loaded ${stockIndex.length} stocks from public metadata`)
      return
    }
  } catch (error) {
    console.log('Public metadata not found, using bundled metadata')
  }

  // Fallback to bundled metadata
  try {
    const module = await import('./metadata.json')
    stockIndex.length = 0
    stockIndex.push(...(module.default as StockMetadata[]))
    console.log(`Loaded ${stockIndex.length} stocks from bundled metadata`)
  } catch (error) {
    console.warn('Stock metadata not found. Run data preprocessing script first.')
  }
}
