# Chart Arcade - Implementation Plan

**Created:** 2024-12-26
**Status:** Phase 1 Complete, Phase 2-12 Pending

---

## Overview

This plan breaks down the Chart Arcade implementation into 12 phases with 85 granular, testable steps. Each step is designed to be independently verifiable before proceeding.

---

## Phase 2: Chart Integration (8 steps)

| # | Task | Validation |
|---|------|------------|
| 2.1 | Create Chart.tsx component with container div and ref | Component renders empty container |
| 2.2 | Initialize Lightweight Charts instance in useEffect | Empty chart canvas appears |
| 2.3 | Load stock data and display candlestick series | OHLC candles visible on chart |
| 2.4 | Create ChartControls with chart type switcher | Line/Area/Candlestick buttons toggle correctly |
| 2.5 | Add volume histogram series below price chart | Volume bars appear below candles |
| 2.6 | Implement zoom controls (mouse wheel, pinch) | Zoom in/out works |
| 2.7 | Implement pan controls - restrict to historical only | Can pan left, cannot pan past current bar |
| 2.8 | Connect chart to game store currentBarIndex | Chart respects visible range from store |

**Checkpoint:** Chart displays data correctly with all controls working.

---

## Phase 3: Indicators (7 steps)

| # | Task | Validation |
|---|------|------------|
| 3.1 | Add SMA line series to chart | SMA line overlays price correctly |
| 3.2 | Add EMA line series to chart | EMA line overlays price correctly |
| 3.3 | Add Bollinger Bands (upper/middle/lower) | Three band lines display |
| 3.4 | Add RSI in separate pane below chart | RSI oscillator 0-100 displays |
| 3.5 | Add MACD in separate pane | MACD line, signal line, histogram display |
| 3.6 | Create IndicatorPanel UI with toggles | Checkboxes enable/disable each indicator |
| 3.7 | Wire indicator toggles to settings store | Indicator state persists after refresh |

**Checkpoint:** All indicators calculate and render correctly, settings persist.

---

## Phase 4: Game Engine Core (12 steps)

| # | Task | Validation |
|---|------|------------|
| 4.1 | Implement loadRandomStock() | Random stock selected from metadata |
| 4.2 | Implement selectRandomStartIndex() | Start index respects min lookback/forward |
| 4.3 | Auto-load first stock on app mount | Chart shows data immediately on load |
| 4.4 | Wire Skip button to gameStore.skip() | Console logs skip action |
| 4.5 | Verify chart advances by 1 bar on Skip | New candle appears after Skip |
| 4.6 | Wire Buy button to gameStore.buy() | Console logs buy action |
| 4.7 | Verify position opens on Buy | Holdings > 0, cash decreases |
| 4.8 | Wire Sell button to gameStore.sell() | Console logs sell action |
| 4.9 | Verify position closes on Sell | Holdings = 0, cash increases |
| 4.10 | Implement direction detection | Direction logged after each action |
| 4.11 | Implement win/loss calculation | Win/loss determined correctly |
| 4.12 | Update sessionStats on each turn | Stats reflect wins/losses/turns |

**Checkpoint:** Complete game loop works - actions advance chart and track outcomes.

---

## Phase 5: Trading UI (9 steps)

| # | Task | Validation |
|---|------|------------|
| 5.1 | Create ActionBar component | Skip/Buy/Sell buttons visible |
| 5.2 | Add percentage preset buttons | 10/25/50/75/100% buttons functional |
| 5.3 | Create TradePreview component | Shows "Buy $X → Y shares" preview |
| 5.4 | Create PositionPanel component | Cash, holdings, price displayed |
| 5.5 | Add UnrealizedPL display | P/L shows green/red when holding |
| 5.6 | Disable Buy when cash=0, Sell when flat | Buttons correctly disabled |
| 5.7 | Implement keyboard shortcuts | Space/B/S trigger actions |
| 5.8 | Add 1-5 keys for percentage | Number keys change selection |
| 5.9 | Create mobile responsive layout | Bottom bar on small screens |

**Checkpoint:** Full trading UI with keyboard support and mobile layout.

---

## Phase 6: Holding Visualization (5 steps)

| # | Task | Validation |
|---|------|------------|
| 6.1 | Track holding periods in gameStore | Entry/exit indices recorded |
| 6.2 | Create HoldingOverlay component | Component renders on chart |
| 6.3 | Render shaded region for active holding | Translucent overlay visible |
| 6.4 | Render historical holding periods | Past holds show on scroll back |
| 6.5 | Add entry/exit markers | Arrow/dot markers at buy/sell points |

**Checkpoint:** Holding periods visually marked on chart.

---

## Phase 7: Stock Switching (7 steps)

| # | Task | Validation |
|---|------|------------|
| 7.1 | Create SwitchConfirmModal | Modal displays on switch attempt |
| 7.2 | Wire Switch button with position check | Modal shows only if holding |
| 7.3 | Implement forced liquidation | Position sold on confirm |
| 7.4 | Create RevealCard component | Shows ticker/name/sector |
| 7.5 | Show RevealCard after switch | Card displays then dismisses |
| 7.6 | Add 'N' keyboard shortcut | N key triggers switch |
| 7.7 | Load new random stock | Fresh chart after switch |

**Checkpoint:** Stock switching works with confirmation and reveal.

---

## Phase 8: Stats & Feedback (7 steps)

| # | Task | Validation |
|---|------|------------|
| 8.1 | Create SessionStats component | Wins/losses/accuracy visible |
| 8.2 | Implement streak tracking | Current/best/worst update |
| 8.3 | Create StreakIndicator component | Visual streak display |
| 8.4 | Add win/loss flash animation | Green/red flash on outcome |
| 8.5 | Create StatsModal full view | All stats displayed in modal |
| 8.6 | Implement fun stats | Diamond Hands, Paper Hands tracked |
| 8.7 | Track average decision time | Time shown in stats |

**Checkpoint:** All stats tracked and displayed with visual feedback.

---

## Phase 9: Audio System (9 steps)

| # | Task | Validation |
|---|------|------------|
| 9.1 | Initialize AudioManager on interaction | Audio context created |
| 9.2 | Play buy sound | Sound on Buy action |
| 9.3 | Play sell sound | Sound on Sell action |
| 9.4 | Play skip sound | Sound on Skip action |
| 9.5 | Play win sound | Sound on correct prediction |
| 9.6 | Play loss sound | Sound on incorrect prediction |
| 9.7 | Play switch sound | Sound on new stock |
| 9.8 | Add volume slider | Volume adjustable |
| 9.9 | Add mute toggle | Sound can be muted |

**Checkpoint:** All sounds play correctly with volume/mute controls.

---

## Phase 10: Settings & Persistence (8 steps)

| # | Task | Validation |
|---|------|------------|
| 10.1 | Create SettingsModal component | Modal opens/closes |
| 10.2 | Add theme toggle | Dark/light switch works |
| 10.3 | Add default chart type setting | Preference saved |
| 10.4 | Add show volume toggle | Volume visibility saved |
| 10.5 | Add reveal ticker toggle | Setting controls reveal |
| 10.6 | Add sector visibility toggle | Sector shown/hidden |
| 10.7 | Verify persistence | All settings survive refresh |
| 10.8 | Add reset stats button | Stats can be cleared |

**Checkpoint:** All settings persist correctly in localStorage.

---

## Phase 11: Polish & Performance (7 steps)

| # | Task | Validation |
|---|------|------------|
| 11.1 | Add loading spinner | Spinner during data load |
| 11.2 | Add error boundary | Errors handled gracefully |
| 11.3 | Add bar reveal animation | Smooth bar transition |
| 11.4 | Create WelcomeModal | First-time onboarding |
| 11.5 | Test mobile touch | Touch gestures work |
| 11.6 | Cross-browser testing | Works on all browsers |
| 11.7 | Verify bundle size | < 200KB gzipped |

**Checkpoint:** App polished and performant on all platforms.

---

## Phase 12: Deployment (5 steps)

| # | Task | Validation |
|---|------|------------|
| 12.1 | Create vercel.json | Config file ready |
| 12.2 | Run production build | Build succeeds |
| 12.3 | Deploy to Vercel | Live URL accessible |
| 12.4 | Test production | All features work |
| 12.5 | Configure domain | Domain routes correctly |

**Checkpoint:** App deployed and accessible.

---

## Summary

| Phase | Steps | Focus Area |
|-------|-------|------------|
| 2 | 8 | Chart Integration |
| 3 | 7 | Technical Indicators |
| 4 | 12 | Game Engine Core |
| 5 | 9 | Trading UI |
| 6 | 5 | Holding Visualization |
| 7 | 7 | Stock Switching |
| 8 | 7 | Stats & Feedback |
| 9 | 9 | Audio System |
| 10 | 8 | Settings & Persistence |
| 11 | 7 | Polish & Performance |
| 12 | 5 | Deployment |
| **Total** | **84** | **Full Implementation** |

---

## Execution Notes

1. **Incremental Progress**: Complete each step before moving to the next
2. **Validation First**: Each step has clear validation criteria
3. **Phase Checkpoints**: Verify phase completeness before proceeding
4. **Decision Logging**: Document decisions in DECISION_LOG.md
5. **Testing**: Run `npm run dev` frequently to catch issues early

---

## Dependencies Between Phases

```
Phase 2 (Chart) ──┬──> Phase 3 (Indicators)
                  │
                  └──> Phase 4 (Game Engine) ──┬──> Phase 5 (Trading UI)
                                               │
                                               ├──> Phase 6 (Holdings)
                                               │
                                               └──> Phase 7 (Switching)
                                                         │
                                                         v
                                               Phase 8 (Stats) ──> Phase 9 (Audio)
                                                         │
                                                         v
                                               Phase 10 (Settings) ──> Phase 11 (Polish)
                                                                              │
                                                                              v
                                                                    Phase 12 (Deploy)
```

---

*End of Implementation Plan*
