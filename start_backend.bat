@echo off
title RailVision AI - Backend Server
echo ========================================
echo   RailVision AI - Backend Server
echo ========================================
echo.

cd /d "%~dp0backend"

:start
echo Starting backend server...
call venv\Scripts\activate.bat
python -m uvicorn main:app --host 0.0.0.0 --port 8000

echo.
echo Backend crashed or stopped. Restarting in 3 seconds...
timeout /t 3 /nobreak
goto start
