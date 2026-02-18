#!/bin/bash

# TDA Events Deployment Script
# Builds and deploys to /var/www/tda-events/

set -e

echo "🚀 TDA Events Deployment"
echo "========================"
echo ""

# Check if in correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Run this script from /var/www/tda-events-source/"
    exit 1
fi

# Build
echo "📦 Building production build..."
npm run build

# Check if build succeeded
if [ ! -d "build" ]; then
    echo "❌ Build failed - build directory not found"
    exit 1
fi

# Deploy
echo ""
echo "🚀 Deploying to /var/www/tda-events/..."
cp -r build/* /var/www/tda-events/

# Verify deployment
if [ -f "/var/www/tda-events/index.html" ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "🌐 Site: https://events.tda-intl.org"
    echo "📂 Deployed to: /var/www/tda-events/"
    echo ""
    ls -lh /var/www/tda-events/ | head -10
else
    echo "❌ Deployment failed - index.html not found"
    exit 1
fi
