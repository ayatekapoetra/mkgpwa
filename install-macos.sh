#!/bin/bash

echo "📦 Installing MKG-Desktop..."

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

# Find the volume name (might vary)
VOLUME_NAME=$(ls /Volumes | grep -i "mkg")

if [ -z "$VOLUME_NAME" ]; then
    echo "❌ Cannot find MKG volume"
    exit 1
fi

# Copy to Applications
echo "Copying to /Applications..."
cp -R "/Volumes/$VOLUME_NAME/MKG-Desktop.app" /Applications/

# Unmount DMG
echo "Unmounting DMG..."
hdiutil detach "/Volumes/$VOLUME_NAME" -quiet

# Remove quarantine
echo "Removing quarantine attribute..."
xattr -cr "/Applications/MKG-Desktop.app"

# Re-sign with ad-hoc signature
echo "Re-signing app..."
codesign --force --deep --sign - "/Applications/MKG-Desktop.app" 2>/dev/null

echo "✅ Installation complete!"
echo ""
echo "Launch application:"
echo "  open -a MKG-Desktop"
echo ""
echo "Or double-click MKG-Desktop in Applications folder"
