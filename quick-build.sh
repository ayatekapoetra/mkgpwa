#!/bin/bash

set -e

echo "⚡ Quick Rebuild - Incremental Build (Faster)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🧹 Cleaning Next.js only..."
rm -rf .next
rm -rf src-tauri/dist

echo ""
echo "📦 Building Next.js..."
export TAURI_BUILD=true
npm run build

echo ""
echo "📋 Preparing assets..."
npm run prepare:tauri

echo ""
echo "🦀 Building Tauri (incremental)..."
cd src-tauri
tauri build --bundles app

echo ""
echo "✅ Quick build complete!"
echo ""
echo "📍 Location: src-tauri/target/release/bundle/macos/MKG Desktop App.app"
echo ""

read -p "Install to /Applications? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    APP_NAME="MKG Desktop App.app"
    rm -rf "/Applications/$APP_NAME"
    cp -r "target/release/bundle/macos/$APP_NAME" /Applications/
    xattr -cr "/Applications/$APP_NAME"
    echo "✅ Installed!"
    
    read -p "Launch now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "/Applications/$APP_NAME"
    fi
fi
