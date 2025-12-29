#!/bin/bash
echo "Clearing Next.js cache..."
rm -rf .next
echo "Clearing node_modules/.cache..."
rm -rf node_modules/.cache
echo "Cache cleared! Please restart dev server."
