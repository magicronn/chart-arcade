# Chart Arcade - Technical Specification

**Version:** 1.0
**Last Updated:** December 2024

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Implementation Phases](#3-implementation-phases)
4. [Component Specifications](#4-component-specifications)
5. [Data Layer](#5-data-layer)
6. [State Management](#6-state-management)
7. [Charting System](#7-charting-system)
8. [Game Engine](#8-game-engine)
9. [Audio System](#9-audio-system)
10. [Testing Strategy](#10-testing-strategy)
11. [Deployment](#11-deployment)
12. [Appendix](#appendix)

---

## 1. Overview

### 1.1 Purpose

This document provides the complete technical specification for implementing Chart Arcade, a browser-based game that tests users' ability to predict short-term stock price direction using anonymized historical charts.

### 1.2 Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend Framework | React | 18.3.x |
| Language | TypeScript | 5.6.x |
| Build Tool | Vite | 6.0.x |
| State Management | Zustand | 5.0.x |
| Charting | Lightweight Charts | 4.2.x |
| Styling | Tailwind CSS | 3.4.x |
| Hosting | Vercel | Latest |

### 1.3 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser Client                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   React     │  │   Zustand   │  │   Lightweight Charts    │  │
│  │ Components  │◄─┤   Stores    │◄─┤   (Chart Rendering)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│         │               │                    ▲                   │
│         ▼               ▼                    │                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Game Engine                               ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    ││
│  │  │  Turn    │  │ Position │  │  Stats   │  │  Audio   │    ││
│  │  │ Manager  │  │ Manager  │  │ Tracker  │  │ Manager  │    ││
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    ││
│  └─────────────────────────────────────────────────────────────┘│
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Data Layer                                ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  ││
│  │  │ Stock Loader │  │ LocalStorage │  │ Indicator Calc   │  ││
│  │  │ (JSON files) │  │ (Persistence)│  │ (SMA, RSI, etc.) │  ││
│  │  └──────────────┘  └──────────────┘  └──────────────────┘  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Static Assets (Vercel)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  JS Bundle  │  │ Stock JSON  │  │    Sound Assets         │  │
│  │  (< 200KB)  │  │  (per file) │  │    (Audio Sprites)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Directory Structure

```
chart-arcade/
├── public/
│   ├── sounds/                    # Audio files
│   │   ├── buy.mp3
│   │   ├── sell.mp3
│   │   ├── skip.mp3
│   │   ├── win.mp3
│   │   ├── loss.mp3
│   │   └── switch.mp3
│   └── chart-arcade.svg           # Favicon
├── src/
│   ├── components/
│   │   ├── Chart/
│   │   │   ├── Chart.tsx          # Main chart wrapper
│   │   │   ├── ChartControls.tsx  # Zoom, chart type toggles
│   │   │   ├── IndicatorPanel.tsx # Indicator configuration
│   │   │   └── HoldingOverlay.tsx # Holding period visualization
│   │   ├── Controls/
│   │   │   ├── ActionBar.tsx      # Skip/Buy/Sell buttons
│   │   │   ├── PercentageSlider.tsx
│   │   │   └── TradePreview.tsx   # Real-time trade preview
│   │   ├── Stats/
│   │   │   ├── SessionStats.tsx   # Current session stats
│   │   │   ├── StatsModal.tsx     # Full stats view
│   │   │   └── StreakIndicator.tsx
│   │   ├── Position/
│   │   │   ├── PositionPanel.tsx  # Cash, holdings, P/L
│   │   │   └── UnrealizedPL.tsx
│   │   ├── Settings/
│   │   │   ├── SettingsModal.tsx
│   │   │   ├── ThemeToggle.tsx
│   │   │   └── IndicatorSettings.tsx
│   │   ├── Modals/
│   │   │   ├── RevealCard.tsx     # Stock reveal on switch
│   │   │   ├── SwitchConfirm.tsx  # Confirm switch with position
│   │   │   └── WelcomeModal.tsx   # First-time user intro
│   │   └── Layout/
│   │       ├── Header.tsx
│   │       ├── GameLayout.tsx
│   │       └── MobileLayout.tsx
│   ├── hooks/
│   │   ├── useChart.ts            # Chart instance management
│   │   ├── useGameActions.ts      # Game action handlers
│   │   ├── useKeyboardShortcuts.ts
│   │   └── useResponsive.ts       # Mobile/desktop detection
│   ├── stores/
│   │   ├── gameStore.ts           # Game state (Zustand)
│   │   └── settingsStore.ts       # User settings (Zustand)
│   ├── utils/
│   │   ├── indicators.ts          # Technical indicator calculations
│   │   ├── gameLogic.ts           # Core game logic functions
│   │   ├── audio.ts               # Audio manager
│   │   └── formatters.ts          # Number/currency formatters
│   ├── types/
│   │   └── index.ts               # TypeScript interfaces
│   ├── data/
│   │   ├── index.ts               # Data loading utilities
│   │   ├── metadata.json          # Stock index (generated)
│   │   └── stocks/                # Stock JSON files (generated)
│   │       ├── tsla.json
│   │       ├── rcl.json
│   │       ├── spy.json
│   │       └── iwm.json
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── scripts/
│   ├── fetch_stock_data.py        # Data fetching script
│   └── requirements.txt
├── docs/
│   └── TECHNICAL_SPEC.md          # This document
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── vercel.json
```

---

## 3. Implementation Phases

### Phase 1: Foundation (Steps 1-5)

| Step | Task | Validation |
|------|------|------------|
| 1.1 | Install dependencies (`npm install`) | `npm run dev` starts without errors |
| 1.2 | Run data fetch script | JSON files created in `src/data/stocks/` |
| 1.3 | Verify Tailwind configuration | Styles apply correctly in App.tsx |
| 1.4 | Test path aliases (@/) | Imports resolve correctly |
| 1.5 | Verify dark mode toggle | Theme switches correctly |

**Validation Checkpoint:** App runs, displays placeholder UI, dark mode works.

---

### Phase 2: Chart Integration (Steps 6-12)

| Step | Task | Validation |
|------|------|------------|
| 2.1 | Create `Chart.tsx` component | Chart container renders |
| 2.2 | Initialize Lightweight Charts | Empty chart displays |
| 2.3 | Load and display candlestick data | OHLC bars visible |
| 2.4 | Implement chart type switching | Line/Area/Candlestick toggle works |
| 2.5 | Add volume histogram | Volume bars display below chart |
| 2.6 | Implement zoom controls | Mouse wheel/pinch zoom works |
| 2.7 | Add pan controls (historical only) | Can scroll back, not forward |

**Validation Checkpoint:** Chart displays data, zoom/pan works, chart types switch.

---

### Phase 3: Indicators (Steps 13-19)

| Step | Task | Validation |
|------|------|------------|
| 3.1 | Implement SMA calculation | SMA line overlays correctly |
| 3.2 | Implement EMA calculation | EMA line overlays correctly |
| 3.3 | Implement Bollinger Bands | Upper/middle/lower bands display |
| 3.4 | Implement RSI (separate pane) | RSI oscillator displays 0-100 |
| 3.5 | Implement MACD (separate pane) | MACD line, signal, histogram display |
| 3.6 | Create IndicatorPanel UI | Toggles enable/disable indicators |
| 3.7 | Persist indicator settings | Settings survive page refresh |

**Validation Checkpoint:** All indicators calculate correctly and display on chart.

---

### Phase 4: Game Engine Core (Steps 20-28)

| Step | Task | Validation |
|------|------|------------|
| 4.1 | Implement stock loading | Random stock loads on start |
| 4.2 | Implement random start selection | Game starts at valid index |
| 4.3 | Implement Skip action | Chart advances, no position change |
| 4.4 | Implement Buy action | Position opens, cash decreases |
| 4.5 | Implement Sell action | Position closes, cash increases |
| 4.6 | Implement bar advancement | Next bar reveals after action |
| 4.7 | Implement direction detection | Up/Down/Flat calculated correctly |
| 4.8 | Implement win/loss detection | Outcomes recorded in store |
| 4.9 | Implement position state inference | Holding = Up prediction |

**Validation Checkpoint:** Full game loop works - Skip/Buy/Sell advance chart, outcomes recorded.

---

### Phase 5: Trading UI (Steps 29-35)

| Step | Task | Validation |
|------|------|------------|
| 5.1 | Create ActionBar component | Skip/Buy/Sell buttons display |
| 5.2 | Create percentage preset buttons | 10/25/50/75/100% buttons work |
| 5.3 | Create TradePreview component | Shows "Buy $X → Y shares" |
| 5.4 | Create PositionPanel component | Displays cash, holdings, price |
| 5.5 | Create UnrealizedPL component | Shows P/L when holding |
| 5.6 | Implement keyboard shortcuts | B=Buy, S=Sell, Space=Skip |
| 5.7 | Add mobile-responsive layout | Bottom bar on mobile |

**Validation Checkpoint:** Complete trading UI, keyboard shortcuts work, responsive on mobile.

---

### Phase 6: Holding Visualization (Steps 36-39)

| Step | Task | Validation |
|------|------|------------|
| 6.1 | Create HoldingOverlay component | Shaded region on chart |
| 6.2 | Track holding periods in store | Entry/exit indices recorded |
| 6.3 | Render historical holding periods | Past positions visible |
| 6.4 | Style holding period overlay | Translucent, non-obstructive |

**Validation Checkpoint:** Holding periods visually marked on chart history.

---

### Phase 7: Stock Switching (Steps 40-45)

| Step | Task | Validation |
|------|------|------------|
| 7.1 | Create Switch button | Button triggers switch flow |
| 7.2 | Create SwitchConfirm modal | Confirmation if holding position |
| 7.3 | Implement forced liquidation | Position sold on switch |
| 7.4 | Create RevealCard component | Shows ticker/name/sector |
| 7.5 | Implement reveal toggle setting | Setting controls reveal display |
| 7.6 | Load new random stock | Fresh chart loads after switch |

**Validation Checkpoint:** Stock switching works with confirmation and reveal.

---

### Phase 8: Stats & Feedback (Steps 46-52)

| Step | Task | Validation |
|------|------|------------|
| 8.1 | Create SessionStats component | Wins/losses/accuracy display |
| 8.2 | Implement streak tracking | Current/best/worst streaks update |
| 8.3 | Create StreakIndicator component | Visual streak feedback |
| 8.4 | Create StatsModal with full stats | All stats viewable |
| 8.5 | Implement fun stats tracking | Diamond Hands, Paper Hands, etc. |
| 8.6 | Add win/loss flash animations | Green/red flashes on outcome |
| 8.7 | Implement decision time tracking | Average time calculated |

**Validation Checkpoint:** All stats tracked and displayed, visual feedback works.

---

### Phase 9: Audio (Steps 53-57)

| Step | Task | Validation |
|------|------|------------|
| 9.1 | Create AudioManager class | Audio context initializes |
| 9.2 | Generate/load sound effects | All 6 sounds playable |
| 9.3 | Integrate sounds with actions | Sounds play on Buy/Sell/Skip |
| 9.4 | Add win/loss sounds | Sounds play on outcome |
| 9.5 | Implement volume control | Slider adjusts volume |
| 9.6 | Implement mute toggle | Sound can be muted |

**Validation Checkpoint:** All sounds play at appropriate times, mute works.

---

### Phase 10: Settings & Persistence (Steps 58-63)

| Step | Task | Validation |
|------|------|------------|
| 10.1 | Create SettingsModal component | Modal opens/closes |
| 10.2 | Implement theme persistence | Dark mode survives refresh |
| 10.3 | Implement indicator persistence | Indicator config persists |
| 10.4 | Implement stats persistence | Stats survive refresh |
| 10.5 | Add reset stats option | Stats can be cleared |
| 10.6 | Implement default chart settings | Chart type/zoom persist |

**Validation Checkpoint:** All settings persist in localStorage correctly.

---

### Phase 11: Polish & Performance (Steps 64-70)

| Step | Task | Validation |
|------|------|------------|
| 11.1 | Add loading states | Spinners during data load |
| 11.2 | Add error boundaries | Graceful error handling |
| 11.3 | Optimize bundle size | < 200KB gzipped |
| 11.4 | Add bar reveal animation | Smooth next-bar transition |
| 11.5 | Test on mobile devices | Touch interactions work |
| 11.6 | Cross-browser testing | Works on all target browsers |
| 11.7 | Add welcome modal | First-time user onboarding |

**Validation Checkpoint:** App polished, performant, works everywhere.

---

### Phase 12: Deployment (Steps 71-75)

| Step | Task | Validation |
|------|------|------------|
| 12.1 | Create vercel.json config | Deployment config ready |
| 12.2 | Build production bundle | `npm run build` succeeds |
| 12.3 | Deploy to Vercel | Live URL accessible |
| 12.4 | Test production build | All features work in production |
| 12.5 | Configure custom domain (optional) | Domain routes correctly |

**Validation Checkpoint:** App deployed and accessible.

---

## 4. Component Specifications

### 4.1 Chart Component

**File:** `src/components/Chart/Chart.tsx`

```typescript
interface ChartProps {
  data: OHLCVBar[]
  visibleRange: { from: number; to: number }
  chartType: 'line' | 'area' | 'candlestick'
  showVolume: boolean
  indicators: IndicatorConfig[]
  holdingPeriods: HoldingPeriod[]
  onBarClick?: (index: number) => void
}
```

**Responsibilities:**
- Initialize and manage Lightweight Charts instance
- Render price series (candlestick, line, or area)
- Render volume histogram
- Render technical indicators
- Render holding period overlays
- Handle zoom/pan interactions
- Prevent viewing future data

**Key Implementation Notes:**
- Use `useRef` to hold chart instance
- Use `useEffect` for data updates
- Implement custom price formatter to hide actual values (anonymization)
- Time scale must be locked to prevent future scrolling

### 4.2 ActionBar Component

**File:** `src/components/Controls/ActionBar.tsx`

```typescript
interface ActionBarProps {
  onSkip: () => void
  onBuy: (percentage: number) => void
  onSell: (percentage: number) => void
  canBuy: boolean
  canSell: boolean
  selectedPercentage: number
  onPercentageChange: (pct: number) => void
}
```

**Responsibilities:**
- Display Skip, Buy, Sell action buttons
- Display percentage presets (10%, 25%, 50%, 75%, 100%)
- Show real-time trade preview
- Disable Buy when no cash
- Disable Sell when no position
- Handle keyboard shortcuts

**Layout:**
- Desktop: Vertical sidebar
- Mobile: Horizontal bottom bar with percentage drawer

### 4.3 PositionPanel Component

**File:** `src/components/Position/PositionPanel.tsx`

```typescript
interface PositionPanelProps {
  cash: number
  position: Position | null
  currentPrice: number
}
```

**Displays:**
- Cash balance (formatted currency)
- Holdings (shares with 2-4 decimal precision)
- Current price
- Unrealized P/L (amount and percentage, color-coded)

### 4.4 RevealCard Component

**File:** `src/components/Modals/RevealCard.tsx`

```typescript
interface RevealCardProps {
  stock: StockMetadata
  onDismiss: () => void
  showTicker: boolean
  showSector: boolean
}
```

**Behavior:**
- Animated entrance (slide up + fade)
- Auto-dismiss after 3 seconds or on click
- Displays ticker, company name, sector (based on settings)

---

## 5. Data Layer

### 5.1 Stock Data Format

**File:** `src/data/stocks/{ticker}.json`

```json
{
  "ticker": "TSLA",
  "name": "Tesla, Inc.",
  "sector": "Consumer Cyclical",
  "bars": [
    {
      "time": "2022-01-03",
      "open": 382.58,
      "high": 399.93,
      "low": 379.79,
      "close": 399.93,
      "volume": 103931400
    }
  ]
}
```

### 5.2 Metadata Index

**File:** `src/data/metadata.json`

```json
[
  {
    "ticker": "TSLA",
    "name": "Tesla, Inc.",
    "sector": "Consumer Cyclical",
    "startDate": "2022-01-03",
    "endDate": "2024-12-20",
    "barCount": 752
  }
]
```

### 5.3 Data Loading Strategy

1. **On App Load:**
   - Load `metadata.json` to populate stock index
   - No stock data loaded yet

2. **On Game Start / Stock Switch:**
   - Dynamically import stock JSON: `import('./stocks/tsla.json')`
   - Select random starting index
   - Initialize game state

3. **Memory Management:**
   - Only one stock's data in memory at a time
   - Previous stock data garbage collected on switch

---

## 6. State Management

### 6.1 Game Store (`gameStore.ts`)

**State Shape:**

```typescript
interface GameState {
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
```

**Actions:**

| Action | Description |
|--------|-------------|
| `loadStock(stock, startIndex)` | Initialize new stock |
| `switchStock()` | Switch to new random stock |
| `skip()` | Execute Skip action |
| `buy(percentage)` | Execute Buy action |
| `sell(percentage)` | Execute Sell action |
| `resetSession()` | Reset current session |
| `resetAllStats()` | Clear all persisted stats |

### 6.2 Settings Store (`settingsStore.ts`)

**State Shape:**

```typescript
interface Settings {
  darkMode: boolean
  soundEnabled: boolean
  soundVolume: number
  defaultChartType: ChartType
  defaultZoomWindow: ZoomWindow
  showVolume: boolean
  showSector: boolean
  revealTickerOnSwitch: boolean
  indicators: IndicatorConfig[]
}
```

**Persistence:**
- All settings persisted to `localStorage` via Zustand `persist` middleware
- Key: `chart-arcade-settings`

---

## 7. Charting System

### 7.1 Lightweight Charts Configuration

```typescript
const chartOptions: ChartOptions = {
  layout: {
    background: { type: ColorType.Solid, color: 'transparent' },
    textColor: '#d1d5db',
  },
  grid: {
    vertLines: { color: '#374151' },
    horzLines: { color: '#374151' },
  },
  crosshair: {
    mode: CrosshairMode.Normal,
  },
  rightPriceScale: {
    borderColor: '#374151',
    visible: true,
  },
  timeScale: {
    borderColor: '#374151',
    timeVisible: true,
    secondsVisible: false,
    rightOffset: 5,
    lockVisibleTimeRangeOnResize: true,
  },
  handleScroll: {
    mouseWheel: true,
    pressedMouseMove: true,
    horzTouchDrag: true,
    vertTouchDrag: false,
  },
  handleScale: {
    axisPressedMouseMove: true,
    mouseWheel: true,
    pinch: true,
  },
}
```

### 7.2 Preventing Future Data Visibility

```typescript
// After each action, update time scale range
const visibleRange = {
  from: bars[0].time,
  to: bars[currentBarIndex].time,
}
chart.timeScale().setVisibleRange(visibleRange)

// Lock right edge
chart.timeScale().scrollToPosition(0, false)
```

### 7.3 Holding Period Overlay

Use `createPriceLine` or custom drawing plugin:

```typescript
// Option 1: Background rectangles via primitives plugin
// Option 2: Colored price lines for entry/exit points
// Option 3: Series markers for visual indication

const holdingMarkers = holdingPeriods.map(hp => ({
  time: bars[hp.entryBarIndex].time,
  position: 'belowBar',
  color: '#22c55e',
  shape: 'arrowUp',
  text: 'BUY'
}))
```

---

## 8. Game Engine

### 8.1 Turn Flow Algorithm

```
1. User takes action (Skip/Buy/Sell)
   ├─ Skip: No position change
   ├─ Buy: Calculate shares, update position, deduct cash
   └─ Sell: Calculate proceeds, update position, add cash

2. Record turn start state
   └─ Capture: position state, bar index, timestamp

3. Advance chart by 1 bar
   └─ Increment currentBarIndex

4. Calculate outcome
   ├─ Get close prices: current bar, next bar
   ├─ Calculate direction: (next - current) / current
   ├─ Apply epsilon threshold: ±0.05%
   └─ Determine: Up | Down | Flat

5. Determine win/loss
   ├─ If holding (shares > 0): prediction = Up
   └─ If flat (shares = 0): prediction = Down

   Win if prediction matches direction
   Loss if prediction does not match direction
   Null if direction is Flat

6. Update stats
   ├─ Increment wins/losses/flats
   ├─ Update streak
   └─ Record decision time

7. Play sound effect
   └─ win.mp3 | loss.mp3

8. Reset turn timer
   └─ turnStartTime = Date.now()
```

### 8.2 Position Calculations

**Buy:**
```typescript
const amountToSpend = cash * (percentage / 100)
const sharesToBuy = amountToSpend / currentPrice
const newShares = existingShares + sharesToBuy
const newAverageCost = (existingShares * existingCost + sharesToBuy * currentPrice) / newShares
```

**Sell:**
```typescript
const sharesToSell = position.shares * (percentage / 100)
const proceeds = sharesToSell * currentPrice
const remainingShares = position.shares - sharesToSell
```

**Unrealized P/L:**
```typescript
const currentValue = shares * currentPrice
const costBasis = shares * averageCost
const unrealizedPL = currentValue - costBasis
const unrealizedPLPercent = (unrealizedPL / costBasis) * 100
```

---

## 9. Audio System

### 9.1 Sound Effects Specification

| Sound | Trigger | Duration | Character |
|-------|---------|----------|-----------|
| `buy` | Buy action executed | 150ms | Rising tone, positive |
| `sell` | Sell action executed | 150ms | Falling tone, neutral |
| `skip` | Skip action executed | 100ms | Short click |
| `win` | Correct prediction | 200ms | Bright, rewarding |
| `loss` | Incorrect prediction | 200ms | Dull, non-punishing |
| `switch` | New stock loaded | 250ms | Transition swoosh |

### 9.2 Audio Manager Implementation

```typescript
class AudioManager {
  private audioContext: AudioContext
  private sounds: Map<SoundType, AudioBuffer>
  private enabled: boolean
  private volume: number

  async init(): Promise<void>
  play(sound: SoundType): void
  setEnabled(enabled: boolean): void
  setVolume(volume: number): void
}
```

**Browser Considerations:**
- AudioContext must be created after user interaction (autoplay policy)
- Initialize on first Skip/Buy/Sell action
- Handle suspended context state

---

## 10. Testing Strategy

### 10.1 Unit Tests

| Module | Test Cases |
|--------|------------|
| `indicators.ts` | SMA, EMA, RSI, MACD calculations with known inputs |
| `gameLogic.ts` | Direction detection, win/loss logic, formatters |
| `gameStore.ts` | State transitions for all actions |

### 10.2 Integration Tests

| Flow | Validation |
|------|------------|
| Game loop | Skip → Buy → Skip → Sell → verify stats |
| Stock switch | Switch with position → verify liquidation |
| Persistence | Set settings → reload → verify restoration |

### 10.3 E2E Tests (Optional)

Use Playwright or Cypress:
- Complete game session
- Mobile touch interactions
- Keyboard shortcuts

### 10.4 Manual Testing Checklist

- [ ] Chart renders all types (line, area, candlestick)
- [ ] Zoom works (mouse wheel, pinch)
- [ ] Pan works (historical only)
- [ ] All indicators display correctly
- [ ] Buy/Sell/Skip execute correctly
- [ ] Stats update correctly
- [ ] Sounds play at correct times
- [ ] Dark/light mode works
- [ ] Settings persist after refresh
- [ ] Mobile layout works
- [ ] Touch gestures work on mobile

---

## 11. Deployment

### 11.1 Vercel Configuration

**File:** `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/data/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=86400" }
      ]
    }
  ]
}
```

### 11.2 Build Optimization

- Vite automatically chunks vendor dependencies
- Stock JSON files are dynamically imported (code splitting)
- Tailwind purges unused CSS
- Target bundle size: < 200KB gzipped (excluding stock data)

### 11.3 Deployment Steps

```bash
# 1. Build locally to verify
npm run build
npm run preview

# 2. Deploy to Vercel
vercel

# 3. Promote to production
vercel --prod
```

---

## Appendix

### A. Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Skip |
| `B` | Buy (with selected %) |
| `S` | Sell (with selected %) |
| `1-5` | Select percentage (10/25/50/75/100) |
| `N` | Switch to new stock |
| `Esc` | Close modals |
| `?` | Show help |

### B. Color Palette

```css
/* Brand Colors */
--arcade-green: #22c55e;
--arcade-red: #ef4444;
--arcade-blue: #3b82f6;
--arcade-purple: #8b5cf6;

/* Dark Theme */
--dark-bg: #0f172a;
--darker-bg: #020617;
--dark-border: #1e293b;

/* Light Theme */
--light-bg: #f8fafc;
--light-border: #e2e8f0;
```

### C. LocalStorage Keys

| Key | Data |
|-----|------|
| `chart-arcade-settings` | User settings (Zustand persist) |
| `chart-arcade-game` | Partial game state (session stats) |

### D. Error Codes

| Code | Description | User Message |
|------|-------------|--------------|
| `E001` | Stock data failed to load | "Unable to load chart data. Please try again." |
| `E002` | No stocks available | "No charts available. Please check data files." |
| `E003` | Invalid action | "Unable to complete action. Please try again." |

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 2024 | Initial specification |

---

*End of Technical Specification*
