#!/bin/bash

# Script untuk menjalankan aplikasi MKG Desktop
# Start Next.js server di background
cd "$(dirname "$0")"

echo "Starting Next.js server..."
PORT=3006 npm run start &
SERVER_PID=$!

# Tunggu server ready
sleep 3

echo "Opening Tauri application..."
cd src-tauri
tauri dev

# Cleanup ketika Tauri ditutup
kill $SERVER_PID
