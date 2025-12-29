import type { OHLCVBar, LineData, HistogramData } from '@/types'

/**
 * Simple Moving Average (SMA)
 */
export function calculateSMA(bars: OHLCVBar[], period: number): LineData[] {
  const result: LineData[] = []

  for (let i = period - 1; i < bars.length; i++) {
    let sum = 0
    for (let j = 0; j < period; j++) {
      sum += bars[i - j].close
    }
    result.push({
      time: bars[i].time,
      value: sum / period,
    })
  }

  return result
}

/**
 * Exponential Moving Average (EMA)
 */
export function calculateEMA(bars: OHLCVBar[], period: number): LineData[] {
  const result: LineData[] = []
  const multiplier = 2 / (period + 1)

  // Start with SMA for first value
  let sum = 0
  for (let i = 0; i < period; i++) {
    sum += bars[i].close
  }
  let ema = sum / period
  result.push({ time: bars[period - 1].time, value: ema })

  // Calculate EMA for remaining bars
  for (let i = period; i < bars.length; i++) {
    ema = (bars[i].close - ema) * multiplier + ema
    result.push({ time: bars[i].time, value: ema })
  }

  return result
}

/**
 * Bollinger Bands
 */
export function calculateBollingerBands(
  bars: OHLCVBar[],
  period: number = 20,
  stdDevMultiplier: number = 2
): { upper: LineData[]; middle: LineData[]; lower: LineData[] } {
  const middle: LineData[] = []
  const upper: LineData[] = []
  const lower: LineData[] = []

  for (let i = period - 1; i < bars.length; i++) {
    // Calculate SMA
    let sum = 0
    for (let j = 0; j < period; j++) {
      sum += bars[i - j].close
    }
    const sma = sum / period

    // Calculate standard deviation
    let squaredDiffSum = 0
    for (let j = 0; j < period; j++) {
      squaredDiffSum += Math.pow(bars[i - j].close - sma, 2)
    }
    const stdDev = Math.sqrt(squaredDiffSum / period)

    middle.push({ time: bars[i].time, value: sma })
    upper.push({ time: bars[i].time, value: sma + stdDev * stdDevMultiplier })
    lower.push({ time: bars[i].time, value: sma - stdDev * stdDevMultiplier })
  }

  return { upper, middle, lower }
}

/**
 * Relative Strength Index (RSI)
 */
export function calculateRSI(bars: OHLCVBar[], period: number = 14): LineData[] {
  const result: LineData[] = []
  const gains: number[] = []
  const losses: number[] = []

  // Calculate price changes
  for (let i = 1; i < bars.length; i++) {
    const change = bars[i].close - bars[i - 1].close
    gains.push(change > 0 ? change : 0)
    losses.push(change < 0 ? -change : 0)
  }

  // Calculate initial average gain/loss
  let avgGain = 0
  let avgLoss = 0
  for (let i = 0; i < period; i++) {
    avgGain += gains[i]
    avgLoss += losses[i]
  }
  avgGain /= period
  avgLoss /= period

  // First RSI value
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
  result.push({ time: bars[period].time, value: 100 - 100 / (1 + rs) })

  // Calculate RSI for remaining bars using smoothed averages
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period

    const currentRs = avgLoss === 0 ? 100 : avgGain / avgLoss
    result.push({ time: bars[i + 1].time, value: 100 - 100 / (1 + currentRs) })
  }

  return result
}

/**
 * MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(
  bars: OHLCVBar[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macdLine: LineData[]; signalLine: LineData[]; histogram: HistogramData[] } {
  const fastEMA = calculateEMA(bars, fastPeriod)
  const slowEMA = calculateEMA(bars, slowPeriod)

  // Align fast and slow EMAs (slow starts later)
  const offset = slowPeriod - fastPeriod
  const macdLine: LineData[] = []

  for (let i = 0; i < slowEMA.length; i++) {
    const fastValue = fastEMA[i + offset].value
    const slowValue = slowEMA[i].value
    macdLine.push({
      time: slowEMA[i].time,
      value: fastValue - slowValue,
    })
  }

  // Calculate signal line (EMA of MACD)
  const signalLine: LineData[] = []
  const multiplier = 2 / (signalPeriod + 1)

  let signalEMA = 0
  for (let i = 0; i < signalPeriod; i++) {
    signalEMA += macdLine[i].value
  }
  signalEMA /= signalPeriod
  signalLine.push({ time: macdLine[signalPeriod - 1].time, value: signalEMA })

  for (let i = signalPeriod; i < macdLine.length; i++) {
    signalEMA = (macdLine[i].value - signalEMA) * multiplier + signalEMA
    signalLine.push({ time: macdLine[i].time, value: signalEMA })
  }

  // Calculate histogram
  const histogram: HistogramData[] = []
  const histogramOffset = signalPeriod - 1

  for (let i = 0; i < signalLine.length; i++) {
    const macdValue = macdLine[i + histogramOffset].value
    const signalValue = signalLine[i].value
    const histValue = macdValue - signalValue
    histogram.push({
      time: signalLine[i].time,
      value: histValue,
      color: histValue >= 0 ? '#22c55e' : '#ef4444',
    })
  }

  return {
    macdLine: macdLine.slice(histogramOffset),
    signalLine,
    histogram,
  }
}

/**
 * VWAP (Volume Weighted Average Price) - Daily approximation
 * For daily data, this calculates cumulative VWAP from the start of available data
 */
export function calculateVWAP(bars: OHLCVBar[]): LineData[] {
  const result: LineData[] = []
  let cumulativeTPV = 0 // Cumulative Typical Price * Volume
  let cumulativeVolume = 0

  for (const bar of bars) {
    const typicalPrice = (bar.high + bar.low + bar.close) / 3
    cumulativeTPV += typicalPrice * bar.volume
    cumulativeVolume += bar.volume

    result.push({
      time: bar.time,
      value: cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : typicalPrice,
    })
  }

  return result
}
