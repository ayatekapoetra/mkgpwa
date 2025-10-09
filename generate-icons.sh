#!/bin/bash

# Generate icon files for Electron build
echo "Generating icon files..."

# Create ICO file for Windows
convert public/logo.png -resize 256x256 public/icon.ico

# Create ICNS file for macOS
# Create different sizes for ICNS
mkdir -p public/icons
convert public/logo.png -resize 16x16 public/icons/icon_16x16.png
convert public/logo.png -resize 32x32 public/icons/icon_32x32.png
convert public/logo.png -resize 64x64 public/icons/icon_64x64.png
convert public/logo.png -resize 128x128 public/icons/icon_128x128.png
convert public/logo.png -resize 256x256 public/icons/icon_256x256.png
convert public/logo.png -resize 512x512 public/icons/icon_512x512.png

# Create ICNS file
iconutil -c icns public/icons -o public/icon.icns

# Create PNG for Linux
cp public/logo.png public/icon.png

echo "Icon files generated successfully!"