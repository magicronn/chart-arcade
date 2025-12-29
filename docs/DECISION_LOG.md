# Chart Arcade - Decision Log

This document tracks architectural and implementation decisions made during development.

---

## Decision Log

### DEC-001: Shell Environment for Commands
**Date:** 2024-12-26
**Context:** The development environment is Windows, but the shell commands need to work properly.
**Decision:** Use PowerShell with full paths for all npm/node commands to ensure consistent execution.
**Rationale:** Windows cmd and bash emulation had issues finding npm in PATH. PowerShell with explicit paths is more reliable.

### DEC-002: Node.js Path Configuration
**Date:** 2024-12-26
**Context:** Node.js/npm not found in default shell PATH.
**Decision:** Will attempt to locate Node.js installation and use explicit paths, or provide clear instructions for manual execution if automated commands fail.
**Rationale:** Rather than blocking on environment issues, provide fallback instructions so development can proceed.

### DEC-003: Synthetic Audio vs Audio Files
**Date:** 2024-12-26
**Context:** Need sound effects for game actions (buy, sell, win, loss, etc.)
**Decision:** Start with Web Audio API synthetic sounds; replace with proper audio files later.
**Rationale:**
- Synthetic sounds work immediately without needing audio assets
- Reduces initial bundle size
- Can be replaced with professional audio files in a future phase
- Good enough for development and testing

### DEC-004: Initial Cash Amount
**Date:** 2024-12-26
**Context:** PRD doesn't specify starting cash amount.
**Decision:** Use $10,000 as initial cash balance.
**Rationale:**
- Round number that's easy to work with mentally
- Large enough to buy meaningful positions in most stocks
- Standard amount used in many paper trading simulators

### DEC-005: Epsilon Threshold for Flat Detection
**Date:** 2024-12-26
**Context:** PRD mentions epsilon ~0.05% but leaves it as implementation decision.
**Decision:** Use 0.0005 (0.05%) as the epsilon threshold.
**Rationale:**
- Matches PRD suggestion
- Small enough to catch meaningful moves
- Large enough to filter out noise/rounding errors

### DEC-006: Minimum Lookback and Forward Bars
**Date:** 2024-12-26
**Context:** Need to define how much historical context to show and how many bars must remain for gameplay.
**Decision:**
- MIN_LOOKBACK_BARS = 60 (approximately 3 months of trading days)
- MIN_FORWARD_BARS = 100 (approximately 5 months of gameplay)
**Rationale:**
- 60 bars provides enough context for technical analysis
- 100 forward bars ensures a meaningful gameplay session
- Combined, requires minimum ~160 bars which all our 3-year datasets easily satisfy

### DEC-007: Dark Mode Default
**Date:** 2024-12-26
**Context:** Need to choose default theme.
**Decision:** Default to dark mode enabled.
**Rationale:**
- Most trading/charting platforms use dark themes
- Easier on eyes for extended sessions
- Matches the "arcade" aesthetic better
- User can toggle to light mode if preferred

### DEC-008: TypeScript Strict Mode
**Date:** 2024-12-26
**Context:** TypeScript configuration strictness level.
**Decision:** Enable full strict mode with noUnusedLocals and noUnusedParameters.
**Rationale:**
- Catches more bugs at compile time
- Enforces better code quality
- Industry best practice for new projects

### DEC-009: Node.js Version and Location
**Date:** 2024-12-26
**Context:** Node.js is not installed in standard location or PATH on this Windows system.
**Decision:** Use Visual Studio 2022's bundled Node.js (v16.14.0, npm 8.3.1) located at:
`C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Microsoft\VisualStudio\NodeJs\`
**Rationale:**
- Node 16.14 supports all required features (ES2020, ESM)
- npm 8.3.1 is sufficient for package management
- Avoids requiring user to install additional software
- Visual Studio is already installed on the system
**Note:** For production development, recommend installing Node.js LTS (v20+) via nvm-windows or direct installer.

### DEC-010: Package Version Compatibility for Node 16
**Date:** 2024-12-26
**Context:** Vite 5/6 and ESLint 9 require Node 18+, but system has Node 16.
**Decision:** Use Vite 4.5.x, ESLint 8.x, and TypeScript-ESLint 6.x for Node 16 compatibility.
**Rationale:**
- Vite 4.5 is stable and works with Node 16
- ESLint 8 has all required functionality
- No significant feature loss vs newer versions
- Ensures the project builds and runs on available infrastructure

### DEC-011: Stock Data Source
**Date:** 2024-12-26
**Context:** Need historical OHLCV data for testing.
**Decision:** Use Yahoo Finance via `yfinance` Python library for initial test data.
**Data Fetched:**
- TSLA, RCL, SPY, IWM (4 symbols)
- 3 years of daily data (752 bars each)
- Date range: 2022-12-27 to 2025-12-24
**Rationale:**
- Free and reliable data source
- Sufficient data for development and testing
- Production data can be purchased separately later

---

## Pending Decisions

*Decisions to be made in future phases:*

- Exact visual treatment for holding period overlay (Phase 6)
- Whether flat outcomes count as losses, ignores, or separate bucket (Phase 4)
- Audio file format and compression (Phase 9)

---

## Revision History

| Date | Changes |
|------|---------|
| 2024-12-26 | Initial decision log created with DEC-001 through DEC-008 |
| 2024-12-26 | Added DEC-009 through DEC-011 after Phase 1 implementation |
