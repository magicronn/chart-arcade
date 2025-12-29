# 🎮 Chart Arcade

A gamified stock chart trading simulator built with React, TypeScript, and Lightweight Charts.

## 🎯 Features

- **Instant Loading:** First chart loads instantly from bundled data
- **Smart Preloading:** Background preloading ensures zero-latency stock switching
- **Technical Indicators:** RSI, MACD, and more
- **Audio Feedback:** Sound effects for actions and outcomes
- **Dark Mode:** Full light/dark theme support
- **Statistics Tracking:** Session stats, streaks, and fun achievements
- **Responsive Design:** Works on desktop and mobile

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Visit `http://localhost:5173`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📦 Bundle Size

Current production bundle: **~197.8 KB gzipped** (under 200 KB target!)

- Main bundle: 116.11 KB
- CSS: 4.53 KB
- 5 bundled stocks: 76.92 KB
- Metadata: 0.34 KB

Additional stocks load on-demand and don't affect bundle size.

## 🎲 How to Play

1. **View the chart** - A random stock chart appears with historical data hidden
2. **Make decisions:**
   - **Skip** - Advance without trading
   - **Buy** - Purchase shares (betting price will go up)
   - **Sell** - Sell shares (betting price will go down)
3. **Watch the reveal** - See if your prediction was correct
4. **Switch stocks** - Press "N" or click "Next Stock" for a new chart
5. **Track stats** - View your accuracy, streaks, and achievements

### Keyboard Shortcuts

- `Space` - Skip
- `B` - Buy
- `S` - Sell
- `N` - Next Stock
- `I` - Toggle Indicators
- `1-5` - Set amount (10%, 25%, 50%, 75%, 100%)

## 📊 Adding Stock Data

The app supports dynamic stock loading without rebuilding:

1. Add stock JSON files to `public/stocks/`
2. Update `public/stocks/metadata.json` with new entries
3. Deploy - users get new stocks on next session!

See [DEPLOYMENT.md](./DEPLOYMENT.md) for details.

## 🛠️ Tech Stack

- **Framework:** React 18 + TypeScript
- **Charts:** Lightweight Charts (TradingView)
- **State Management:** Zustand
- **Styling:** Tailwind CSS
- **Build Tool:** Vite
- **Deployment:** Vercel

## 📁 Project Structure

```
chart-arcade/
├── public/
│   └── stocks/           # Fetched stock data (dynamic loading)
├── src/
│   ├── components/       # React components
│   ├── data/
│   │   └── stocks/       # Bundled stock data (instant load)
│   ├── stores/           # Zustand state management
│   ├── types/            # TypeScript types
│   └── utils/            # Helper functions
├── scripts/              # Data fetching scripts
└── docs/                 # Documentation
```

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

**Quick deploy to Vercel:**

```bash
# First time
vercel

# Production
vercel --prod

# Or use the script
./deploy.bat prod    # Windows
./deploy.sh prod     # Mac/Linux
```

## 🎨 Customization

### Adding Indicators

Edit `src/components/Indicators/IndicatorsPanel.tsx` to add new technical indicators.

### Changing Bundled Stocks

1. Edit `BUNDLED_STOCKS` in `src/data/index.ts`
2. Move stock files between `src/data/stocks/` and `public/stocks/`
3. Rebuild and deploy

### Theme Colors

Edit `tailwind.config.js` to customize the color scheme.

## 📝 License

MIT

## 🙏 Acknowledgments

- [TradingView Lightweight Charts](https://tradingview.github.io/lightweight-charts/)
- Stock data from Yahoo Finance
- Built with [Vite](https://vitejs.dev/)

---

**Built with ❤️ for traders and gamers**
