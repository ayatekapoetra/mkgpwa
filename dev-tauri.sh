#!/bin/bash

echo "🔧 MKG Desktop App - Development Mode"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

function cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    pkill -f "next dev"
    pkill -f "tauri dev"
    exit 0
}

trap cleanup SIGINT SIGTERM

echo "📋 Choose mode:"
echo "  1) Browser only (http://localhost:3006)"
echo "  2) Tauri Desktop App"
echo "  3) Both (recommended for testing)"
echo ""
read -p "Select (1-3): " DEV_MODE

if [[ ! "$DEV_MODE" =~ ^[1-3]$ ]]; then
    echo "❌ Invalid option!"
    exit 1
fi

echo ""

if [ "$DEV_MODE" = "1" ] || [ "$DEV_MODE" = "3" ]; then
    echo "🌐 Starting Next.js dev server on port 3006..."
    
    lsof -ti:3006 | xargs kill -9 2>/dev/null || true
    
    npm run dev:tauri > /tmp/nextjs-dev.log 2>&1 &
    NEXTJS_PID=$!
    
    echo "⏳ Waiting for Next.js to start..."
    sleep 5
    
    if ! lsof -i:3006 > /dev/null 2>&1; then
        echo "❌ Next.js failed to start!"
        echo "Check logs: tail -f /tmp/nextjs-dev.log"
        exit 1
    fi
    
    echo "✅ Next.js running at http://localhost:3006"
fi

if [ "$DEV_MODE" = "2" ] || [ "$DEV_MODE" = "3" ]; then
    echo ""
    echo "🦀 Starting Tauri dev..."
    cd src-tauri
    
    if [ "$DEV_MODE" = "2" ]; then
        npm run dev:tauri > /tmp/nextjs-dev.log 2>&1 &
        sleep 5
    fi
    
    tauri dev
    
    cd ..
fi

if [ "$DEV_MODE" = "1" ]; then
    echo ""
    echo "✅ Development server running!"
    echo "   URL: http://localhost:3006/timesheet"
    echo ""
    echo "Press Ctrl+C to stop"
    
    tail -f /tmp/nextjs-dev.log
fi

cleanup
