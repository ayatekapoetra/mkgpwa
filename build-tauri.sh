#!/bin/bash

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 MKG Desktop App - Tauri Build Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📋 Build Options:"
echo "  1) .app Bundle (Recommended)"
echo "  2) DMG Installer"
echo "  3) Both .app + DMG"
echo "  4) Quick Dev Test (no optimization)"
echo ""
read -p "Pilih option (1-4): " BUILD_OPTION

if [[ ! "$BUILD_OPTION" =~ ^[1-4]$ ]]; then
    echo "❌ Invalid option!"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧹 Step 1: Cleaning old builds..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npm run clean
rm -rf .next
rm -rf src-tauri/dist
rm -rf src-tauri/target/release/bundle

if [ "$BUILD_OPTION" = "4" ]; then
    echo "⚡ Skipping release clean for dev build..."
else
    rm -rf src-tauri/target/release
fi

echo "✅ Clean complete!"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Step 2: Building Next.js..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
export TAURI_BUILD=true
export NODE_OPTIONS="--max-old-space-size=4096"

npm run build

if [ $? -ne 0 ]; then
    echo "❌ Next.js build failed!"
    exit 1
fi

echo "✅ Next.js build complete!"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Step 3: Preparing Tauri assets..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npm run prepare:tauri

if [ $? -ne 0 ]; then
    echo "❌ Prepare failed!"
    exit 1
fi

echo "✅ Assets prepared!"
echo ""

cd src-tauri

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🦀 Step 4: Building Tauri app..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

BUILD_START=$(date +%s)

case $BUILD_OPTION in
    1)
        echo "Building .app bundle..."
        tauri build --bundles app
        ;;
    2)
        echo "Building DMG installer..."
        tauri build --bundles dmg
        ;;
    3)
        echo "Building both .app and DMG..."
        tauri build
        ;;
    4)
        echo "Building debug version..."
        cargo build
        ;;
esac

BUILD_END=$(date +%s)
BUILD_TIME=$((BUILD_END - BUILD_START))

if [ $? -ne 0 ]; then
    echo "❌ Tauri build failed!"
    exit 1
fi

echo "✅ Tauri build complete in ${BUILD_TIME}s!"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Build Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$BUILD_OPTION" = "4" ]; then
    echo "📍 Debug binary:"
    ls -lh target/debug/femkgpwa | awk '{print "   " $9 " - " $5}'
else
    if [ -d "target/release/bundle/macos" ]; then
        echo "📦 .app Bundle:"
        du -sh target/release/bundle/macos/*.app | awk '{print "   " $2 " - " $1}'
    fi
    
    if [ -d "target/release/bundle/dmg" ]; then
        echo "💿 DMG Files:"
        ls -lh target/release/bundle/dmg/*.dmg | awk '{print "   " $9 " - " $5}'
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 Next Steps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$BUILD_OPTION" = "4" ]; then
    echo "Run debug version:"
    echo "  ./target/debug/femkgpwa"
else
    echo "Install to /Applications?"
    echo "  Option 1: Manual drag & drop from Finder"
    echo "  Option 2: Auto-install (see below)"
    echo ""
    
    if [ -d "target/release/bundle/macos" ]; then
        read -p "🚀 Auto-install to /Applications now? (y/n) " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            APP_NAME="MKG Desktop App.app"
            
            if [ -d "/Applications/$APP_NAME" ]; then
                echo "🗑️  Removing old version..."
                rm -rf "/Applications/$APP_NAME"
            fi
            
            echo "📦 Installing new version..."
            cp -r "target/release/bundle/macos/$APP_NAME" /Applications/
            
            echo "🔓 Removing quarantine attribute..."
            xattr -cr "/Applications/$APP_NAME"
            
            echo ""
            echo "✅ Installation complete!"
            echo ""
            echo "Launch app:"
            echo "  open \"/Applications/$APP_NAME\""
            echo ""
            
            read -p "🚀 Launch now? (y/n) " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                open "/Applications/$APP_NAME"
            fi
        else
            echo ""
            echo "Manual installation:"
            echo "  cp -r \"target/release/bundle/macos/MKG Desktop App.app\" /Applications/"
            echo "  xattr -cr \"/Applications/MKG Desktop App.app\""
        fi
    fi
    
    if [ -d "target/release/bundle/dmg" ]; then
        echo ""
        read -p "📀 Open DMG file? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            open target/release/bundle/dmg/*.dmg
        fi
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Build Script Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
