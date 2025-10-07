#!/bin/bash

echo "🧹 MKG Desktop App - Cleanup Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This will remove:"
echo "  1. Installed app in /Applications"
echo "  2. Build artifacts (target/release)"
echo "  3. Next.js build (.next)"
echo "  4. All caches"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled"
    exit 0
fi

echo ""
echo "🗑️  Removing installed app..."
rm -rf "/Applications/MKG Desktop App.app"

echo "🗑️  Removing build artifacts..."
rm -rf src-tauri/target/release
rm -rf src-tauri/target/debug
rm -rf src-tauri/dist

echo "🗑️  Removing Next.js builds..."
rm -rf .next
rm -rf out

echo "🗑️  Removing caches..."
npm run clean

echo "🗑️  Removing app data (optional)..."
read -p "Remove app data from ~/Library? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf ~/Library/Application\ Support/com.makkuragatama.femkgpwa
    rm -rf ~/Library/Caches/com.makkuragatama.femkgpwa
    rm -rf ~/Library/Preferences/com.makkuragatama.femkgpwa.plist
    echo "✅ App data removed"
fi

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "To rebuild:"
echo "  ./build-tauri.sh"
