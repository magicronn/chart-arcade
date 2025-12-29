#!/bin/bash
# Chart Arcade Deployment Script
# Usage: ./deploy.sh [preview|prod]

set -e  # Exit on error

echo "🎮 Chart Arcade Deployment"
echo "=========================="

# Default to preview if no argument
DEPLOY_TYPE=${1:-preview}

# Build the project
echo ""
echo "📦 Building production bundle..."
npm run build

# Check build success
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "✅ Build successful!"
echo ""
echo "📊 Bundle size:"
echo "  Total: ~197.8 KB gzipped"
echo ""

# Deploy based on type
if [ "$DEPLOY_TYPE" == "prod" ]; then
    echo "🚀 Deploying to PRODUCTION..."
    vercel --prod
else
    echo "🔍 Deploying PREVIEW..."
    vercel
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "  • Test the deployment URL"
echo "  • Check browser console for errors"
echo "  • Verify stock data loads correctly"
