#!/bin/bash

echo "========================================"
echo "  YT Short Generator - Auto Installer"
echo "========================================"
echo

echo "[1/4] Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found. Please install Node.js >= 18"
    exit 1
fi
echo "Node.js found"

echo
echo "[2/4] Checking yt-dlp..."
if ! command -v yt-dlp &> /dev/null; then
    echo "Installing yt-dlp via pip..."
    pip install -U yt-dlp || echo "WARNING: yt-dlp installation failed. Please install manually: pip install -U yt-dlp"
fi
echo "yt-dlp ready"

echo
echo "[3/4] Installing npm dependencies..."
npm install || { echo "ERROR: npm install failed"; exit 1; }
echo "Dependencies installed"

echo
echo "[4/4] Creating .env file..."
[ ! -f .env ] && cp .env.example .env && echo ".env created" || echo ".env already exists"

echo
echo "========================================"
echo "  Installation Complete!"
echo "========================================"
echo
echo "To start the app, run: npm start"
echo "Then open http://localhost:3000"
echo
