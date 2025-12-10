@echo off
REM Smart Career Advisor - Quick Start Script for Windows

echo.
echo ========================================
echo Smart Career Advisor - Quick Start
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

echo [1/4] Creating virtual environment...
if not exist venv (
    python -m venv venv
    echo.
    echo Virtual environment created!
) else (
    echo Virtual environment already exists.
)

echo.
echo [2/4] Activating virtual environment and installing dependencies...
call venv\Scripts\activate.bat
pip install -r requirements.txt >nul 2>&1
echo Dependencies installed!

echo.
echo [3/4] Downloading NLTK data...
python -c "import nltk; nltk.download('punkt', quiet=True); nltk.download('stopwords', quiet=True)" >nul 2>&1
echo NLTK data ready!

echo.
echo [4/4] Starting Flask application...
echo.
echo ========================================
echo The app is running at:
echo http://localhost:5000
echo ========================================
echo.
echo Press Ctrl+C to stop the server
echo.

python app.py

pause
