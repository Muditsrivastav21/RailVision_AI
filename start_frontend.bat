@echo off
title RailVision AI - Frontend Server
echo ========================================
echo   RailVision AI - Frontend Server
echo ========================================
echo.

cd /d "%~dp0railsvision"

:start
echo Starting frontend server...
call npm run dev

echo.
echo Frontend crashed or stopped. Restarting in 3 seconds...
timeout /t 3 /nobreak
goto start
