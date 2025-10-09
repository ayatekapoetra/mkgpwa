#!/bin/bash

echo "📦 Installing MKG Desktop..."

# Check if DMG is provided
if [ -z "$1" ]; then
    echo "Usage: ./install-macos.sh /path/to/MKG-Desktop-*.dmg"
    exit 1
fi

DMG_PATH="$1"

if [ ! -f "$DMG_PATH" ]; then
    echo "❌ DMG file not found: $DMG_PATH"
    exit 1
fi

# Mount DMG
echo "Mounting DMG..."
hdiutil attach "$DMG_PATH" -nobrowse -quiet

# Copy to Applications
echo "Copying to /Applications..."
cp -R "/Volumes/MKG Desktop"/*.app /Applications/

# Unmount DMG
hdiutil detach "/Volumes/MKG Desktop" -quiet

# Remove quarantine
echo "Removing quarantine attribute..."
xattr -cr "/Applications/MKG Desktop.app"

echo "✅ Installation complete!"
echo "Launch: open -a 'MKG Desktop'"
