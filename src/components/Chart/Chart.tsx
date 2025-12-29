import { useRef, useEffect, useState } from 'react'
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  LineData,
  ColorType,
  CrosshairMode,
  Time,
  SeriesMarker,
} from 'lightweight-charts'
import { useSettingsStore } from '@/stores/settingsStore'
import { useGameStore } from '@/stores/gameStore'
import { OHLCVBar, Trade, HoldingPeriod, IndicatorConfig } from '@/types'
import { setChartZoomHandlers } from './ChartControls'
import {
  calculateSMA,
  calculateEMA,
  calculateVWAP,
  calculateBollingerBands,
  calculateRSI,
  calculateMACD,
} from '@/utils/indicators'

// Chart type options
export type ChartType = 'candlestick' | 'line' | 'area'

interface ChartProps {
  className?: string
}

// Convert our OHLCVBar to Lightweight Charts format
function toChartData(bars: OHLCVBar[]): CandlestickData<Time>[] {
  return bars.map(bar => ({
    time: bar.time as Time,
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
  }))
}

function toVolumeData(bars: OHLCVBar[]): HistogramData<Time>[] {
  return bars.map(bar => ({
    time: bar.time as Time,
    value: bar.volume,
    color: bar.close >= bar.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
  }))
}

function toLineData(bars: OHLCVBar[]): LineData<Time>[] {
  return bars.map(bar => ({
    time: bar.time as Time,
    value: bar.close,
  }))
}

// Create holding period background highlight data
function createHoldingHighlights(
  holdingPeriods: HoldingPeriod[],
  bars: OHLCVBar[],
  currentBarIndex: number
): HistogramData<Time>[] {
  const highlights: HistogramData<Time>[] = []

  holdingPeriods.forEach(hp => {
    const startIdx = hp.entryBarIndex
    const endIdx = hp.exitBarIndex !== null ? hp.exitBarIndex : currentBarIndex

    // Skip if this holding period hasn't started yet
    if (startIdx > currentBarIndex) return

    // Get current price for P/L calculation
    const currentPrice = bars[Math.min(endIdx, currentBarIndex)]?.close ?? hp.entryPrice
    const isProfit = currentPrice >= hp.entryPrice

    // Color based on overall P/L for this holding period
    const color = isProfit
      ? 'rgba(34, 197, 94, 0.15)'  // Green for profit
      : 'rgba(239, 68, 68, 0.15)'   // Red for loss

    // Add a bar for each day in the holding period
    for (let i = startIdx; i <= Math.min(endIdx, currentBarIndex); i++) {
      const bar = bars[i]
      if (bar) {
        highlights.push({
          time: bar.time as Time,
          value: 1, // Fixed value - we just want the color
          color,
        })
      }
    }
  })

  return highlights
}

// Create markers for trades (buy/sell points)
function createTradeMarkers(
  trades: Trade[],
  bars: OHLCVBar[],
  currentBarIndex: number
): SeriesMarker<Time>[] {
  return trades
    .filter(trade => trade.barIndex <= currentBarIndex)
    .map(trade => {
      const bar = bars[trade.barIndex]
      if (!bar) return null

      const isBuy = trade.type === 'buy'
      return {
        time: bar.time as Time,
        position: isBuy ? 'belowBar' : 'aboveBar',
        color: isBuy ? '#22c55e' : '#ef4444',
        shape: isBuy ? 'arrowUp' : 'arrowDown',
        text: isBuy ? 'BUY' : 'SELL',
      } as SeriesMarker<Time>
    })
    .filter((marker): marker is SeriesMarker<Time> => marker !== null)
}

// Type for tracking indicator series
interface IndicatorSeries {
  id: string
  type: IndicatorConfig['type']
  series: ISeriesApi<'Line'>[]
  histogram?: ISeriesApi<'Histogram'>
}

export function Chart({ className = '' }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const mainSeriesRef = useRef<ISeriesApi<'Candlestick' | 'Line' | 'Area'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const holdingSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const indicatorSeriesRef = useRef<Map<string, IndicatorSeries>>(new Map())
  const oscillatorPaneCreatedRef = useRef(false)

  const { darkMode, chartType, showVolume, indicators } = useSettingsStore()
  const { currentStock, currentBarIndex, trades, holdingPeriods, position } = useGameStore()

  const [isInitialized, setIsInitialized] = useState(false)

  // Get visible data (up to currentBarIndex)
  const visibleBars = currentStock?.bars.slice(0, currentBarIndex + 1) || []

  // Initialize chart (step 2.2)
  useEffect(() => {
    if (!chartContainerRef.current) return

    // Chart colors based on theme
    const backgroundColor = darkMode ? '#1a1a2e' : '#ffffff'
    const textColor = darkMode ? '#d1d5db' : '#374151'
    const gridColor = darkMode ? '#2a2a3e' : '#e5e7eb'

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor: textColor,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: gridColor,
        scaleMargins: {
          top: 0.1,
          bottom: 0.2, // Leave room for volume
        },
      },
      timeScale: {
        borderColor: gridColor,
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        mouseWheel: false, // Disable scroll - only zoom
        pressedMouseMove: false, // Disable drag to pan
        horzTouchDrag: false, // Disable touch pan
        vertTouchDrag: false,
      },
      handleScale: {
        axisPressedMouseMove: false, // Disable axis drag zoom
        mouseWheel: true, // Keep mouse wheel zoom
        pinch: true, // Keep pinch zoom
      },
    })

    chartRef.current = chart
    setIsInitialized(true)

    // Register zoom handlers for ChartControls buttons
    // All zoom operations anchor to the right edge (current bar)
    setChartZoomHandlers(
      // Zoom in - show fewer bars, anchored to right
      () => {
        const timeScale = chart.timeScale()
        const range = timeScale.getVisibleLogicalRange()
        if (range) {
          const currentWidth = range.to - range.from
          const newWidth = currentWidth / 2 // Show half as many bars
          const minWidth = 10 // Don't zoom in past 10 bars
          if (newWidth >= minWidth) {
            timeScale.setVisibleLogicalRange({
              from: range.to - newWidth,
              to: range.to,
            })
          }
        }
      },
      // Zoom out - show more bars, anchored to right
      () => {
        const timeScale = chart.timeScale()
        const range = timeScale.getVisibleLogicalRange()
        if (range) {
          const currentWidth = range.to - range.from
          const newWidth = currentWidth * 2 // Show twice as many bars
          timeScale.setVisibleLogicalRange({
            from: range.to - newWidth,
            to: range.to,
          })
        }
      },
      // Reset zoom - fit all data
      () => {
        chart.timeScale().fitContent()
      }
    )

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        })
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
      chartRef.current = null
      mainSeriesRef.current = null
      volumeSeriesRef.current = null
      holdingSeriesRef.current = null
      indicatorSeriesRef.current.clear()
      oscillatorPaneCreatedRef.current = false
      setIsInitialized(false)
    }
  }, []) // Only run once on mount

  // Update chart colors when theme changes
  useEffect(() => {
    if (!chartRef.current) return

    const backgroundColor = darkMode ? '#1a1a2e' : '#ffffff'
    const textColor = darkMode ? '#d1d5db' : '#374151'
    const gridColor = darkMode ? '#2a2a3e' : '#e5e7eb'

    chartRef.current.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor: textColor,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      rightPriceScale: { borderColor: gridColor },
      timeScale: { borderColor: gridColor },
    })
  }, [darkMode])

  // Create/update main price series based on chart type (step 2.3, 2.4)
  useEffect(() => {
    if (!chartRef.current || !isInitialized) return

    // Remove existing main series if any
    if (mainSeriesRef.current) {
      chartRef.current.removeSeries(mainSeriesRef.current)
      mainSeriesRef.current = null
    }

    // Create new series based on chart type
    if (chartType === 'candlestick') {
      mainSeriesRef.current = chartRef.current.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderUpColor: '#26a69a',
        borderDownColor: '#ef5350',
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      })
    } else if (chartType === 'line') {
      mainSeriesRef.current = chartRef.current.addLineSeries({
        color: '#2962FF',
        lineWidth: 2,
      })
    } else if (chartType === 'area') {
      mainSeriesRef.current = chartRef.current.addAreaSeries({
        topColor: 'rgba(41, 98, 255, 0.4)',
        bottomColor: 'rgba(41, 98, 255, 0.0)',
        lineColor: '#2962FF',
        lineWidth: 2,
      })
    }

    // Set data if available
    if (visibleBars.length > 0 && mainSeriesRef.current) {
      if (chartType === 'candlestick') {
        (mainSeriesRef.current as ISeriesApi<'Candlestick'>).setData(toChartData(visibleBars))
      } else {
        (mainSeriesRef.current as ISeriesApi<'Line' | 'Area'>).setData(toLineData(visibleBars))
      }
    }
  }, [chartType, isInitialized])

  // Create/update volume series (step 2.5)
  useEffect(() => {
    if (!chartRef.current || !isInitialized) return

    // Remove existing volume series
    if (volumeSeriesRef.current) {
      chartRef.current.removeSeries(volumeSeriesRef.current)
      volumeSeriesRef.current = null
    }

    // Add volume series if enabled
    if (showVolume) {
      volumeSeriesRef.current = chartRef.current.addHistogramSeries({
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
      })

      chartRef.current.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      })

      if (visibleBars.length > 0) {
        volumeSeriesRef.current.setData(toVolumeData(visibleBars))
      }
    }
  }, [showVolume, isInitialized])

  // Track previous bar count for animation
  const prevBarCountRef = useRef(0)

  // Update data when bars change (step 2.8 - connect to game store)
  useEffect(() => {
    if (!isInitialized || visibleBars.length === 0 || !currentStock) return

    const isNewBar = visibleBars.length > prevBarCountRef.current

    // Update main series
    if (mainSeriesRef.current) {
      if (isNewBar && prevBarCountRef.current > 0) {
        // Animate new bar by using update() for the latest bar
        const latestBar = visibleBars[visibleBars.length - 1]
        if (chartType === 'candlestick') {
          (mainSeriesRef.current as ISeriesApi<'Candlestick'>).update(toChartData([latestBar])[0])
        } else {
          (mainSeriesRef.current as ISeriesApi<'Line' | 'Area'>).update(toLineData([latestBar])[0])
        }
      } else {
        // Full data refresh (initial load or stock change)
        if (chartType === 'candlestick') {
          (mainSeriesRef.current as ISeriesApi<'Candlestick'>).setData(toChartData(visibleBars))
        } else {
          (mainSeriesRef.current as ISeriesApi<'Line' | 'Area'>).setData(toLineData(visibleBars))
        }
      }

      // Add trade markers (Phase 6.5)
      const markers = createTradeMarkers(trades, currentStock.bars, currentBarIndex)
      mainSeriesRef.current.setMarkers(markers)
    }

    // Update volume series
    if (volumeSeriesRef.current && showVolume) {
      if (isNewBar && prevBarCountRef.current > 0) {
        // Animate new volume bar
        const latestBar = visibleBars[visibleBars.length - 1]
        volumeSeriesRef.current.update(toVolumeData([latestBar])[0])
      } else {
        volumeSeriesRef.current.setData(toVolumeData(visibleBars))
      }
    }

    // Scroll to show latest bar
    if (chartRef.current) {
      chartRef.current.timeScale().scrollToRealTime()
    }

    // Update bar count tracker
    prevBarCountRef.current = visibleBars.length
  }, [visibleBars, chartType, showVolume, isInitialized, trades, currentBarIndex, currentStock])

  // Create/update holding period visualization (Phase 6.2-6.4)
  // Uses histogram bars as background highlights - doesn't affect price scale
  useEffect(() => {
    if (!chartRef.current || !isInitialized || !currentStock) return

    // Remove existing holding series if any
    if (holdingSeriesRef.current) {
      chartRef.current.removeSeries(holdingSeriesRef.current)
      holdingSeriesRef.current = null
    }

    // Only show if we have holding periods
    if (holdingPeriods.length === 0) return

    // Create a single histogram series for all holding period highlights
    // Use a separate price scale that spans the full chart height
    holdingSeriesRef.current = chartRef.current.addHistogramSeries({
      priceScaleId: 'holding',
      priceFormat: { type: 'volume' },
      lastValueVisible: false,
      priceLineVisible: false,
    })

    // Configure the holding price scale to fill the entire chart background
    chartRef.current.priceScale('holding').applyOptions({
      scaleMargins: {
        top: 0,
        bottom: 0,
      },
      visible: false, // Hide the scale itself
    })

    // Generate and set the highlight data
    const highlights = createHoldingHighlights(holdingPeriods, currentStock.bars, currentBarIndex)
    if (highlights.length > 0) {
      holdingSeriesRef.current.setData(highlights)
    }
  }, [holdingPeriods, position, currentBarIndex, isInitialized, currentStock])

  // Indicator rendering
  useEffect(() => {
    if (!chartRef.current || !isInitialized || visibleBars.length === 0) return

    const chart = chartRef.current
    const enabledIndicators = indicators.filter(i => i.enabled)
    const currentIndicatorIds = new Set(enabledIndicators.map(i => i.id))

    // Check if any oscillator indicators are enabled (RSI or MACD)
    const hasOscillators = enabledIndicators.some(i => i.type === 'rsi' || i.type === 'macd')

    // Remove series for indicators that are no longer enabled
    indicatorSeriesRef.current.forEach((indSeries, id) => {
      if (!currentIndicatorIds.has(id)) {
        // Remove all line series
        indSeries.series.forEach(s => {
          try { chart.removeSeries(s) } catch { /* already removed */ }
        })
        // Remove histogram if exists
        if (indSeries.histogram) {
          try { chart.removeSeries(indSeries.histogram) } catch { /* already removed */ }
        }
        indicatorSeriesRef.current.delete(id)
      }
    })

    // Setup oscillator pane if needed - adjust all scales to separate areas
    if (hasOscillators && !oscillatorPaneCreatedRef.current) {
      // Separate chart into 3 areas: price (top), volume (middle), oscillators (bottom)
      chart.priceScale('right').applyOptions({
        scaleMargins: {
          top: 0.02,
          bottom: 0.42, // Price uses top 56%
        },
      })
      // Move volume to middle band
      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.60,
          bottom: 0.28, // Volume uses 12% in middle
        },
      })
      oscillatorPaneCreatedRef.current = true
    } else if (!hasOscillators && oscillatorPaneCreatedRef.current) {
      // Reset main price scale margins
      chart.priceScale('right').applyOptions({
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      })
      // Reset volume to bottom
      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      })
      oscillatorPaneCreatedRef.current = false
    }

    // Create or update series for each enabled indicator
    enabledIndicators.forEach(indicator => {
      const existingSeries = indicatorSeriesRef.current.get(indicator.id)
      const color = indicator.color || '#3b82f6'

      // If indicator exists but params/color changed, remove and recreate
      if (existingSeries) {
        // Remove existing series
        existingSeries.series.forEach(s => {
          try { chart.removeSeries(s) } catch { /* already removed */ }
        })
        if (existingSeries.histogram) {
          try { chart.removeSeries(existingSeries.histogram) } catch { /* already removed */ }
        }
        indicatorSeriesRef.current.delete(indicator.id)
      }

      // Create new series (always, since we removed existing ones above)
      {
        const newSeries: IndicatorSeries = {
          id: indicator.id,
          type: indicator.type,
          series: [],
        }

        switch (indicator.type) {
          case 'sma':
          case 'ema':
          case 'vwap': {
            // Single line overlay on main price scale
            const lineSeries = chart.addLineSeries({
              color,
              lineWidth: 2,
              priceScaleId: 'right',
              lastValueVisible: false,
              priceLineVisible: false,
            })
            newSeries.series.push(lineSeries)
            break
          }

          case 'bollinger': {
            // Three lines: upper, middle, lower
            const upperLine = chart.addLineSeries({
              color,
              lineWidth: 1,
              lineStyle: 2, // Dashed
              priceScaleId: 'right',
              lastValueVisible: false,
              priceLineVisible: false,
            })
            const middleLine = chart.addLineSeries({
              color,
              lineWidth: 2,
              priceScaleId: 'right',
              lastValueVisible: false,
              priceLineVisible: false,
            })
            const lowerLine = chart.addLineSeries({
              color,
              lineWidth: 1,
              lineStyle: 2, // Dashed
              priceScaleId: 'right',
              lastValueVisible: false,
              priceLineVisible: false,
            })
            newSeries.series.push(upperLine, middleLine, lowerLine)
            break
          }

          case 'rsi': {
            // RSI line on oscillator pane (bottom area below volume)
            const rsiLine = chart.addLineSeries({
              color,
              lineWidth: 2,
              priceScaleId: 'oscillator',
              lastValueVisible: true,
              priceLineVisible: false,
            })
            // Configure oscillator scale - bottom 25% of chart
            chart.priceScale('oscillator').applyOptions({
              scaleMargins: {
                top: 0.75,
                bottom: 0.02,
              },
              borderVisible: true,
            })
            newSeries.series.push(rsiLine)
            break
          }

          case 'macd': {
            // MACD line, signal line, and histogram (bottom area below volume)
            const macdLine = chart.addLineSeries({
              color,
              lineWidth: 2,
              priceScaleId: 'macd',
              lastValueVisible: true,
              priceLineVisible: false,
            })
            const signalLine = chart.addLineSeries({
              color: '#ef4444', // Red for signal
              lineWidth: 1,
              priceScaleId: 'macd',
              lastValueVisible: false,
              priceLineVisible: false,
            })
            const histogram = chart.addHistogramSeries({
              priceScaleId: 'macd',
              lastValueVisible: false,
              priceLineVisible: false,
            })
            // Configure MACD scale - bottom 25% of chart
            chart.priceScale('macd').applyOptions({
              scaleMargins: {
                top: 0.75,
                bottom: 0.02,
              },
              borderVisible: true,
            })
            newSeries.series.push(macdLine, signalLine)
            newSeries.histogram = histogram
            break
          }
        }

        indicatorSeriesRef.current.set(indicator.id, newSeries)
      }

      // Update data for the newly created series
      const indSeries = indicatorSeriesRef.current.get(indicator.id)
      if (!indSeries) return

      switch (indicator.type) {
        case 'sma': {
          const period = indicator.params.period || 20
          const data = calculateSMA(visibleBars, period)
          if (indSeries.series[0] && data.length > 0) {
            indSeries.series[0].setData(data.map(d => ({ time: d.time as Time, value: d.value })))
          }
          break
        }

        case 'ema': {
          const period = indicator.params.period || 12
          const data = calculateEMA(visibleBars, period)
          if (indSeries.series[0] && data.length > 0) {
            indSeries.series[0].setData(data.map(d => ({ time: d.time as Time, value: d.value })))
          }
          break
        }

        case 'vwap': {
          const data = calculateVWAP(visibleBars)
          if (indSeries.series[0] && data.length > 0) {
            indSeries.series[0].setData(data.map(d => ({ time: d.time as Time, value: d.value })))
          }
          break
        }

        case 'bollinger': {
          const period = indicator.params.period || 20
          const stdDev = indicator.params.stdDev || 2
          const { upper, middle, lower } = calculateBollingerBands(visibleBars, period, stdDev)
          if (indSeries.series[0] && upper.length > 0) {
            indSeries.series[0].setData(upper.map(d => ({ time: d.time as Time, value: d.value })))
          }
          if (indSeries.series[1] && middle.length > 0) {
            indSeries.series[1].setData(middle.map(d => ({ time: d.time as Time, value: d.value })))
          }
          if (indSeries.series[2] && lower.length > 0) {
            indSeries.series[2].setData(lower.map(d => ({ time: d.time as Time, value: d.value })))
          }
          break
        }

        case 'rsi': {
          const period = indicator.params.period || 14
          const data = calculateRSI(visibleBars, period)
          if (indSeries.series[0] && data.length > 0) {
            indSeries.series[0].setData(data.map(d => ({ time: d.time as Time, value: d.value })))
          }
          break
        }

        case 'macd': {
          const fast = indicator.params.fast || 12
          const slow = indicator.params.slow || 26
          const signal = indicator.params.signal || 9
          const { macdLine, signalLine, histogram } = calculateMACD(visibleBars, fast, slow, signal)

          if (indSeries.series[0] && macdLine.length > 0) {
            indSeries.series[0].setData(macdLine.map(d => ({ time: d.time as Time, value: d.value })))
          }
          if (indSeries.series[1] && signalLine.length > 0) {
            indSeries.series[1].setData(signalLine.map(d => ({ time: d.time as Time, value: d.value })))
          }
          if (indSeries.histogram && histogram.length > 0) {
            indSeries.histogram.setData(histogram.map(d => ({
              time: d.time as Time,
              value: d.value,
              color: d.value >= 0 ? 'rgba(38, 166, 154, 0.7)' : 'rgba(239, 83, 80, 0.7)',
            })))
          }
          break
        }
      }
    })
  }, [indicators, visibleBars, isInitialized])

  // Keep the current bar anchored to the right edge
  // Any zoom or scroll operation will be corrected to maintain this anchor
  useEffect(() => {
    if (!chartRef.current || !isInitialized || visibleBars.length === 0) return

    const chart = chartRef.current
    const rightEdge = visibleBars.length - 1

    // Subscribe to visible time range changes to enforce right anchor
    const handleVisibleRangeChange = () => {
      const timeScale = chart.timeScale()
      const visibleRange = timeScale.getVisibleLogicalRange()

      if (visibleRange && Math.abs(visibleRange.to - rightEdge) > 0.5) {
        // The right edge has moved - snap it back to the current bar
        const currentWidth = visibleRange.to - visibleRange.from
        timeScale.setVisibleLogicalRange({
          from: rightEdge - currentWidth,
          to: rightEdge,
        })
      }
    }

    chart.timeScale().subscribeVisibleLogicalRangeChange(handleVisibleRangeChange)

    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleVisibleRangeChange)
    }
  }, [visibleBars.length, isInitialized])

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div
        ref={chartContainerRef}
        className="w-full h-full"
      />
      {!currentStock && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-arcade-dark/80">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-2">Loading chart data...</p>
            <p className="text-sm">Please wait</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Chart
