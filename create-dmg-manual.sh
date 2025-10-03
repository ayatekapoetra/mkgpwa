#!/bin/bash

# Manual DMG Creator for MKG Desktop App
# Use this script if automatic DMG creation fails

APP_NAME="MKG Desktop App"
APP_PATH="src-tauri/target/release/bundle/macos/$APP_NAME.app"
DMG_OUTPUT="src-tauri/target/release/bundle/dmg"
DMG_NAME="MKG Desktop App_1.0.0_aarch64.dmg"
VOLUME_NAME="MKG Desktop App"

echo "========================================"
echo "  Manual DMG Creator"
echo "========================================"
echo ""

# Check if .app exists
if [ ! -d "$APP_PATH" ]; then
    echo "❌ Error: $APP_PATH not found"
    echo "Please run 'npm run build:tauri' first"
    exit 1
fi

echo "✓ Found: $APP_PATH"

# Create DMG output directory if needed
mkdir -p "$DMG_OUTPUT"

# Remove old DMG if exists
if [ -f "$DMG_OUTPUT/$DMG_NAME" ]; then
    echo "Removing old DMG..."
    rm "$DMG_OUTPUT/$DMG_NAME"
fi

echo ""
echo "Creating DMG..."
echo "This may take a few minutes..."
echo ""

# Create DMG using hdiutil
hdiutil create \
    -volname "$VOLUME_NAME" \
    -srcfolder "$APP_PATH" \
    -ov \
    -format UDZO \
    "$DMG_OUTPUT/$DMG_NAME"

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "  ✅ DMG Created Successfully!"
    echo "========================================"
    echo ""
    echo "Location: $DMG_OUTPUT/$DMG_NAME"
    echo "Size: $(du -h "$DMG_OUTPUT/$DMG_NAME" | cut -f1)"
    echo ""
    echo "You can now distribute this DMG to users."
else
    echo ""
    echo "❌ Failed to create DMG"
    echo ""
    echo "Alternative: You can distribute the .app directly"
    echo "Location: $APP_PATH"
    echo ""
    echo "To package as ZIP:"
    echo "  cd src-tauri/target/release/bundle/macos"
    echo "  zip -r '$APP_NAME.zip' '$APP_NAME.app'"
fi
