#!/bin/bash

# Uninstall Script for MKG Desktop App (macOS)
# This script will completely remove the application and all its data

APP_NAME="MKG Desktop App"
BUNDLE_ID="com.makkuragatama.femkgpwa"
PROCESS_NAME="femkgpwa"

echo "========================================"
echo "  MKG Desktop App Uninstaller (macOS)"
echo "========================================"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo "⚠️  Please do not run this script as root/sudo"
   exit 1
fi

# Function to check if app is running
check_running() {
    if pgrep -f "$PROCESS_NAME" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Step 1: Close the application if running
echo "Step 1: Checking if application is running..."
if check_running; then
    echo "⚠️  Application is currently running"
    read -p "Do you want to close it now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Closing application..."
        pkill -f "$APP_NAME" 2>/dev/null
        pkill -f "$PROCESS_NAME" 2>/dev/null
        
        # Wait for processes to terminate
        sleep 2
        
        # Force kill if still running
        if check_running; then
            echo "Force closing application..."
            pkill -9 -f "$PROCESS_NAME" 2>/dev/null
            sleep 1
        fi
        
        echo "✓ Application closed"
    else
        echo "❌ Cannot uninstall while application is running. Please close it manually."
        exit 1
    fi
else
    echo "✓ Application is not running"
fi

# Step 2: Remove the application
echo ""
echo "Step 2: Removing application..."

APP_PATHS=(
    "/Applications/$APP_NAME.app"
    "$HOME/Applications/$APP_NAME.app"
)

FOUND=false
for APP_PATH in "${APP_PATHS[@]}"; do
    if [ -d "$APP_PATH" ]; then
        echo "Found application at: $APP_PATH"
        rm -rf "$APP_PATH"
        if [ $? -eq 0 ]; then
            echo "✓ Removed: $APP_PATH"
            FOUND=true
        else
            echo "❌ Failed to remove: $APP_PATH"
        fi
    fi
done

if [ "$FOUND" = false ]; then
    echo "⚠️  Application not found in common locations"
fi

# Step 3: Remove application data
echo ""
echo "Step 3: Removing application data..."

DATA_PATHS=(
    "$HOME/Library/Application Support/$BUNDLE_ID"
    "$HOME/Library/Caches/$BUNDLE_ID"
    "$HOME/Library/Preferences/$BUNDLE_ID.plist"
    "$HOME/Library/Saved Application State/$BUNDLE_ID.savedState"
    "$HOME/Library/WebKit/$BUNDLE_ID"
    "$HOME/Library/HTTPStorages/$BUNDLE_ID"
    "$HOME/Library/Cookies/$BUNDLE_ID.binarycookies"
)

for DATA_PATH in "${DATA_PATHS[@]}"; do
    if [ -e "$DATA_PATH" ]; then
        rm -rf "$DATA_PATH"
        if [ $? -eq 0 ]; then
            echo "✓ Removed: $DATA_PATH"
        else
            echo "❌ Failed to remove: $DATA_PATH"
        fi
    fi
done

# Step 4: Kill any remaining Node.js processes on port 3006
echo ""
echo "Step 4: Checking for Node.js server on port 3006..."
NODE_PID=$(lsof -ti:3006 2>/dev/null)
if [ ! -z "$NODE_PID" ]; then
    echo "Found Node.js server (PID: $NODE_PID)"
    kill -9 $NODE_PID 2>/dev/null
    echo "✓ Stopped Node.js server"
else
    echo "✓ No Node.js server running"
fi

# Step 5: Summary
echo ""
echo "========================================"
echo "  Uninstallation Complete!"
echo "========================================"
echo ""
echo "The following items have been removed:"
echo "  • Application bundle"
echo "  • Application data and caches"
echo "  • User preferences"
echo "  • Background processes"
echo ""
echo "Thank you for using MKG Desktop App!"
echo ""
