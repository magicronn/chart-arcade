# Chart Arcade - Deployment Guide

## Quick Deploy to Vercel

### Prerequisites
- Node.js 18+ installed
- Vercel account (free tier works)
- Vercel CLI installed: `npm install -g vercel`

### First Time Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

   On first run, Vercel will ask:
   - "Set up and deploy?" → **Yes**
   - "Which scope?" → Select your account
   - "Link to existing project?" → **No**
   - "What's your project's name?" → `chart-arcade` (or your choice)
   - "In which directory is your code located?" → `./` (press Enter)
   - Vercel will auto-detect settings from `vercel.json`

4. **Deploy to production**
   ```bash
   vercel --prod
   ```

### Subsequent Deployments

After initial setup, deploying is simple:

```bash
# Preview deployment (test before production)
vercel

# Production deployment
vercel --prod
```

## Alternative: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your Git repository
4. Vercel will auto-detect the Vite framework
5. Click "Deploy"

## Build Locally

Test the production build locally before deploying:

```bash
# Build for production
npm run build

# Preview the production build
npm run preview
```

The build output goes to `dist/` directory.

## Adding Stock Data Without Rebuilding

**Key Feature:** You can add new stocks to a deployed site without rebuilding!

1. **Prepare your stock data**
   - Format: JSON files matching the existing structure
   - Filename: `{ticker}.json` (lowercase)

2. **Update metadata**
   - Edit `public/stocks/metadata.json`
   - Add entry for each new stock:
   ```json
   {
     "ticker": "MSFT",
     "name": "Microsoft Corporation",
     "sector": "Technology",
     "startDate": "2022-12-28",
     "endDate": "2025-12-26",
     "barCount": 752
   }
   ```

3. **Upload to Vercel**
   - Via Vercel CLI:
     ```bash
     # Copy new files to public/stocks/
     cp your-new-stock.json public/stocks/

     # Deploy (only static files updated)
     vercel --prod
     ```

   - Or via Vercel Dashboard:
     - Go to your project → Storage
     - Upload files directly to production

## Project Structure

```
chart-arcade/
├── public/
│   └── stocks/              # Fetched stock data (not in bundle)
│       ├── metadata.json    # Stock index (loaded dynamically)
│       ├── axon.json
│       ├── rcl.json
│       └── ual.json
├── src/
│   ├── data/
│   │   ├── stocks/          # Bundled stock data (instant load)
│   │   │   ├── aapl.json
│   │   │   ├── iwm.json
│   │   │   ├── spy.json
│   │   │   ├── t.json
│   │   │   └── tsla.json
│   │   └── metadata.json    # Fallback bundled metadata
│   └── ...
├── dist/                    # Build output (auto-generated)
└── vercel.json             # Vercel configuration
```

## Configuration Details

### vercel.json

The `vercel.json` file configures:

1. **Build Settings**
   - Uses Vite framework detection
   - Output directory: `dist/`

2. **Routing**
   - SPA fallback: All routes serve `index.html`
   - Enables client-side routing

3. **Caching**
   - Stock data: 1 year cache (immutable)
   - Assets: 1 year cache (immutable)

### Environment Variables

No environment variables required for basic deployment!

## Bundle Size

Current production bundle:
- **Total: ~197.8 KB gzipped** ✅ Under 200 KB target
  - Main bundle: 116.11 KB
  - CSS: 4.53 KB
  - 5 bundled stocks: 76.92 KB
  - Metadata: 0.34 KB

Fetched assets (not in bundle):
- Stock data in `public/stocks/`: ~46.5 KB
- Additional stocks: unlimited, no bundle impact

## Troubleshooting

### Build fails with TypeScript errors
```bash
# Check for errors
npm run build

# Fix and try again
vercel --prod
```

### Stock data not loading
- Check `public/stocks/metadata.json` exists
- Verify JSON is valid
- Check browser console for fetch errors

### Old data cached
- Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Clear browser cache
- Check Vercel deployment logs

## Useful Commands

```bash
# Local development
npm run dev

# Type checking
npm run build

# Preview production build
npm run preview

# Vercel commands
vercel login          # Login to Vercel
vercel                # Deploy preview
vercel --prod         # Deploy to production
vercel ls             # List deployments
vercel inspect        # View deployment details
vercel logs           # View deployment logs
vercel domains        # Manage custom domains
```

## Custom Domain

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Vercel provides automatic HTTPS

## Monitoring

- **Analytics:** Enable in Vercel Dashboard → Analytics
- **Logs:** `vercel logs [deployment-url]`
- **Performance:** Vercel provides Web Vitals automatically

## Cost

- **Free tier:** Unlimited deployments, 100GB bandwidth/month
- **Hobby:** Free forever for personal projects
- **Pro:** $20/month for commercial use

---

**Questions?** Check [Vercel Documentation](https://vercel.com/docs)
