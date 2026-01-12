@echo off
echo ========================================
echo   RailVision AI - Launching Servers
echo ========================================
echo.

cd /d "%~dp0"

echo Stopping any existing processes...
taskkill /f /im python.exe 2>nul
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Starting Backend Server...
start "RailVision Backend" cmd /k start_backend.bat

echo Waiting for backend to initialize...
timeout /t 8 /nobreak

echo Starting Frontend Server...
start "RailVision Frontend" cmd /k start_frontend.bat

echo.
echo ========================================
echo   Servers are launching in new windows!
echo ========================================
echo.
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:3000
echo.
echo   Close this window when done.
echo.
pause
