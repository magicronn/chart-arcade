import { useEffect, useState, useCallback, useRef } from 'react'
import { useSettingsStore } from './stores/settingsStore'
import { useGameStore } from './stores/gameStore'
import { Chart, ChartControls } from './components/Chart'
import { SwitchConfirmModal, RevealCard, WelcomeModal, SettingsModal, StatsModal } from './components/Modal'
import { IndicatorsPanel } from './components/Indicators'
import { initializeStockIndex, loadRandomStock, selectRandomStartIndex, preloadNextStock } from './data'
import { formatCurrency, formatShares, calculateUnrealizedPL } from './utils/gameLogic'
import { audioManager } from './utils/audioManager'

function App() {
  const { darkMode, timeScale, soundEnabled, soundVolume } = useSettingsStore()
  const {
    currentStock,
    currentBarIndex,
    cash,
    position,
    isLoading,
    showRevealCard,
    revealedStock,
    lastOutcome,
    loadStock,
    switchStock,
    skip,
    buy,
    sell,
    setLoading,
    hideRevealCard,
  } = useGameStore()

  const [selectedPercentage, setSelectedPercentage] = useState(100)
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showIndicators, setShowIndicators] = useState(false)
  const [showWelcome, setShowWelcome] = useState(() => {
    // Show welcome modal only on first visit
    return !localStorage.getItem('chart-arcade-welcomed')
  })
  const indicatorsButtonRef = useRef<HTMLButtonElement>(null)

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Initialize audio manager on first user interaction
  useEffect(() => {
    const initAudio = () => {
      if (!audioManager.isInitialized()) {
        audioManager.initialize()
        audioManager.setVolume(soundVolume)
        audioManager.setMuted(!soundEnabled)
      }
    }

    // Initialize on any click or keypress
    window.addEventListener('click', initAudio, { once: true })
    window.addEventListener('keydown', initAudio, { once: true })

    return () => {
      window.removeEventListener('click', initAudio)
      window.removeEventListener('keydown', initAudio)
    }
  }, [])

  // Sync audio settings
  useEffect(() => {
    audioManager.setMuted(!soundEnabled)
  }, [soundEnabled])

  useEffect(() => {
    audioManager.setVolume(soundVolume)
  }, [soundVolume])

  // Initialize game on mount (Phase 4.3)
  // Always load raw daily data - Chart component handles time scale display
  useEffect(() => {
    async function initGame() {
      setLoading(true)
      try {
        // Initialize stock index
        await initializeStockIndex()

        // Load a random bundled stock for instant start
        const stock = await loadRandomStock(true) // preferBundled = true
        if (stock) {
          // Select a random start index with enough room for gameplay
          const startIndex = selectRandomStartIndex(stock.bars.length, timeScale)
          loadStock(stock, startIndex)

          // Preload next stock in background
          preloadNextStock().catch(err => console.warn('Preload failed:', err))
        }
      } catch (error) {
        console.error('Failed to initialize game:', error)
      } finally {
        setLoading(false)
      }
    }

    // Only init if we don't have a stock loaded
    if (!currentStock) {
      initGame()
    }
  }, [])

  // Play win/loss sounds
  useEffect(() => {
    if (lastOutcome?.isWin === true) {
      // Only play win sound if we were holding a position
      if (lastOutcome.positionBeforeAction && lastOutcome.positionBeforeAction.shares > 0) {
        audioManager.play('win')
      }
    } else if (lastOutcome?.isWin === false) {
      // Only play loss sound if we were holding a position
      if (lastOutcome.positionBeforeAction && lastOutcome.positionBeforeAction.shares > 0) {
        audioManager.play('loss')
      }
    }
  }, [lastOutcome])

  // Play reveal chime when reveal card appears
  useEffect(() => {
    if (showRevealCard) {
      audioManager.play('reveal')
    }
  }, [showRevealCard])

  // Get current price
  const currentPrice = currentStock?.bars[currentBarIndex]?.close ?? 0

  // Calculate unrealized P/L
  const unrealizedPL = position && currentPrice
    ? calculateUnrealizedPL(position.shares, position.averageCost, currentPrice)
    : null

  // Handlers for actions (Phase 4.4-4.9)
  const handleSkip = useCallback(() => {
    if (isLoading) return
    console.log('Skip action')
    // Use quiet skip sound when not holding position
    if (!position || position.shares <= 0) {
      audioManager.play('skipQuiet')
    }
    // Don't play skip sound when holding - win/loss sounds handle that
    skip()

    // Preload next stock in background
    preloadNextStock().catch(err => console.warn('Preload failed:', err))
  }, [isLoading, skip, position])

  const handleBuy = useCallback(() => {
    if (isLoading || cash <= 0) return
    console.log(`Buy action: ${selectedPercentage}%`)
    audioManager.play('buy')
    buy(selectedPercentage)

    // Preload next stock in background
    preloadNextStock().catch(err => console.warn('Preload failed:', err))
  }, [isLoading, cash, selectedPercentage, buy])

  const handleSell = useCallback(() => {
    if (isLoading || !position || position.shares <= 0) return
    console.log(`Sell action: ${selectedPercentage}%`)

    // Calculate P/L for this sell to determine sound
    const sellPrice = currentStock?.bars[currentBarIndex]?.close ?? 0
    const sharesToSell = position.shares * (selectedPercentage / 100)
    const costBasis = sharesToSell * position.averageCost
    const proceeds = sharesToSell * sellPrice
    const profitLoss = proceeds - costBasis

    // Play appropriate sell sound based on P/L
    if (profitLoss > 0) {
      audioManager.play('sellProfit')
    } else if (profitLoss < 0) {
      audioManager.play('sellLoss')
    } else {
      audioManager.play('sell') // Neutral for break-even
    }

    sell(selectedPercentage)

    // Preload next stock in background
    preloadNextStock().catch(err => console.warn('Preload failed:', err))
  }, [isLoading, position, selectedPercentage, sell, currentStock, currentBarIndex])

  // Handle switch stock (Phase 7)
  const handleSwitchClick = useCallback(() => {
    if (isLoading) return

    // If we have a position, show confirmation modal
    if (position && position.shares > 0) {
      setShowSwitchConfirm(true)
    } else {
      // No position, just switch directly
      handleSwitchConfirm()
    }
  }, [isLoading, position])

  const handleSwitchConfirm = useCallback(async () => {
    setShowSwitchConfirm(false)

    // This will sell any position and show reveal card
    audioManager.play('switch')
    await switchStock()
  }, [switchStock])

  // Handle welcome modal dismiss
  const handleWelcomeDismiss = useCallback(() => {
    localStorage.setItem('chart-arcade-welcomed', 'true')
    setShowWelcome(false)
  }, [])

  // Handle reveal card dismiss and load next stock
  const handleRevealDismiss = useCallback(async () => {
    hideRevealCard()
    setLoading(true)

    try {
      // Load random stock (may be from cache if preloaded)
      const stock = await loadRandomStock()
      if (stock) {
        const startIndex = selectRandomStartIndex(stock.bars.length, timeScale)
        loadStock(stock, startIndex)

        // Preload the next one for future use
        preloadNextStock().catch(err => console.warn('Preload failed:', err))
      }
    } catch (error) {
      console.error('Failed to load new stock:', error)
    } finally {
      setLoading(false)
    }
  }, [hideRevealCard, setLoading, loadStock, timeScale])

  // Keyboard shortcuts (Phase 5.7, 7.6)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or modal is open
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // If reveal card is showing, any key dismisses it
      if (showRevealCard) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleRevealDismiss()
        }
        return
      }

      // If switch confirm modal is open, handle escape
      if (showSwitchConfirm) {
        if (e.key === 'Escape') {
          setShowSwitchConfirm(false)
        }
        return
      }

      // If indicators panel is open, handle escape
      if (showIndicators) {
        if (e.key === 'Escape') {
          setShowIndicators(false)
        }
        return
      }

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault()
          handleSkip()
          break
        case 'b':
          handleBuy()
          break
        case 's':
          handleSell()
          break
        case 'n':
          handleSwitchClick()
          break
        case 'i':
          setShowIndicators((prev) => !prev)
          break
        case '1':
          setSelectedPercentage(10)
          break
        case '2':
          setSelectedPercentage(25)
          break
        case '3':
          setSelectedPercentage(50)
          break
        case '4':
          setSelectedPercentage(75)
          break
        case '5':
          setSelectedPercentage(100)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showRevealCard, showSwitchConfirm, showIndicators, handleSkip, handleBuy, handleSell, handleSwitchClick, handleRevealDismiss])

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-arcade-darker text-gray-900 dark:text-gray-100">
      {/* Modals */}
      <WelcomeModal
        isOpen={showWelcome}
        onClose={handleWelcomeDismiss}
      />
      <SwitchConfirmModal
        isOpen={showSwitchConfirm}
        onClose={() => setShowSwitchConfirm(false)}
        onConfirm={handleSwitchConfirm}
      />
      <RevealCard
        isOpen={showRevealCard}
        onClose={handleRevealDismiss}
        stock={revealedStock}
      />
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
      <StatsModal
        isOpen={showStats}
        onClose={() => setShowStats(false)}
      />

      {/* Header */}
      <header className="bg-white dark:bg-arcade-dark border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-xl font-bold text-arcade-blue">
            Chart Arcade
          </h1>
          <div className="flex items-center gap-4">
            <ChartControls />
            <div className="relative">
              <button
                ref={indicatorsButtonRef}
                onClick={() => setShowIndicators(!showIndicators)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  showIndicators
                    ? 'bg-arcade-blue text-white'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Indicators
              </button>
              <IndicatorsPanel
                isOpen={showIndicators}
                onClose={() => setShowIndicators(false)}
                anchorRef={indicatorsButtonRef}
              />
            </div>
            <button
              onClick={() => setShowStats(true)}
              className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Stats
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Settings
            </button>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex flex-col lg:flex-row h-[calc(100vh-57px)]">
        {/* Chart Container */}
        <div className="flex-1 p-4">
          <div className="h-full bg-white dark:bg-arcade-dark rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-arcade-blue mx-auto mb-4"></div>
                  <p>Loading chart data...</p>
                </div>
              </div>
            ) : (
              <Chart />
            )}
          </div>
        </div>

        {/* Side Panel (Desktop) / Bottom Panel (Mobile) */}
        <aside className="lg:w-80 bg-white dark:bg-arcade-dark border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-800 p-4">
          {/* Position Info */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">POSITION</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">Cash</p>
                <p className="text-lg font-semibold">{formatCurrency(cash)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">Holdings</p>
                <p className="text-lg font-semibold">
                  {position ? formatShares(position.shares) : '0 shares'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">Current Price</p>
                <p className="text-lg font-semibold">
                  {currentPrice > 0 ? formatCurrency(currentPrice) : '$—'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">Unrealized P/L</p>
                <p className={`text-lg font-semibold ${
                  unrealizedPL === null ? 'text-gray-400' :
                  unrealizedPL.amount >= 0 ? 'text-arcade-green' : 'text-arcade-red'
                }`}>
                  {unrealizedPL !== null ? formatCurrency(unrealizedPL.amount) : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Percentage Selector */}
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">AMOUNT</h2>
            <div className="flex gap-1">
              {[10, 25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setSelectedPercentage(pct)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                    selectedPercentage === pct
                      ? 'bg-arcade-blue text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">ACTIONS</h2>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleSkip}
                disabled={isLoading}
                className="py-3 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold transition-colors disabled:opacity-50"
              >
                Skip
              </button>
              <button
                onClick={handleBuy}
                disabled={isLoading || cash <= 0}
                className={`py-3 rounded-lg font-semibold transition-colors ${
                  isLoading || cash <= 0
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                    : 'bg-arcade-green hover:bg-green-600 text-white'
                }`}
              >
                Buy
              </button>
              <button
                onClick={handleSell}
                disabled={isLoading || !position || position.shares <= 0}
                className={`py-3 rounded-lg font-semibold transition-colors ${
                  isLoading || !position || position.shares <= 0
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                    : 'bg-arcade-red hover:bg-red-600 text-white'
                }`}
              >
                Sell
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
              Space=Skip, B=Buy, S=Sell, 1-5=Amt, I=Indicators
            </p>
          </div>

          {/* Switch Stock Button */}
          <button
            onClick={handleSwitchClick}
            disabled={isLoading}
            className="mt-6 w-full py-3 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold transition-colors disabled:opacity-50 text-sm"
          >
            Next Stock (N)
          </button>
        </aside>
      </main>
    </div>
  )
}

export default App
