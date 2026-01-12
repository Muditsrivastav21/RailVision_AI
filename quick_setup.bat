@echo off
echo ========================================
echo RailVision AI - Quick Setup Script
echo ========================================
echo.

cd /d "%~dp0backend"

echo [1/4] Creating virtual environment...
if not exist "venv" (
    python -m venv venv
)

echo [2/4] Activating virtual environment...
call venv\Scripts\activate.bat

echo [3/4] Installing dependencies...
pip install --upgrade pip
pip install -r requirements.txt

echo [4/4] Creating weights directory...
if not exist "weights" mkdir weights

echo.
echo ========================================
echo Setup complete!
echo ========================================
echo.
echo To start the backend:
echo   cd backend
echo   venv\Scripts\activate
echo   uvicorn main:app --host 0.0.0.0 --port 8000
echo.
echo To start the frontend:
echo   cd railsvision
echo   npm install
echo   npm run dev
echo.
pause
