#!/usr/bin/env bash
# সন্ধান (sandhan) Setup Script — Automated Setup
set -euo pipefail

echo "========================================="
echo "  সন্ধান (sandhan) — Search Engine Setup  "
echo "========================================="

echo "[1/3] Checking environment..."
command -v node >/dev/null 2>&1 || { echo "Error: Node.js is required."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "Error: npm is required."; exit 1; }

echo "[2/3] Installing web dependencies..."
cd apps/web
npm install

echo "[3/3] Running tests..."
npm test

echo "========================================="
echo "  Setup Complete! Start dev server with: "
echo "  cd apps/web && npm run dev             "
echo "========================================="
