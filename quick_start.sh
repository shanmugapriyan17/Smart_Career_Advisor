#!/bin/bash

# Smart Career Advisor - Quick Start Script for macOS/Linux

echo ""
echo "========================================"
echo "Smart Career Advisor - Quick Start"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    exit 1
fi

echo "[1/4] Creating virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo ""
    echo "Virtual environment created!"
else
    echo "Virtual environment already exists."
fi

echo ""
echo "[2/4] Activating virtual environment and installing dependencies..."
source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1
echo "Dependencies installed!"

echo ""
echo "[3/4] Downloading NLTK data..."
python -c "import nltk; nltk.download('punkt', quiet=True); nltk.download('stopwords', quiet=True)" > /dev/null 2>&1
echo "NLTK data ready!"

echo ""
echo "[4/4] Starting Flask application..."
echo ""
echo "========================================"
echo "The app is running at:"
echo "http://localhost:5000"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python app.py
