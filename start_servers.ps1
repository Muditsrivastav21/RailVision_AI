# RailVision AI - Server Launcher Script
# This script starts both backend and frontend servers

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RailVision AI - Starting Servers     " -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = $PSScriptRoot

# Kill any existing processes
Write-Host "[1/4] Stopping existing processes..." -ForegroundColor Yellow
Get-Process -Name "python" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Start Backend
Write-Host "[2/4] Starting Backend (FastAPI + YOLO)..." -ForegroundColor Yellow
$backendPath = Join-Path $projectRoot "backend"
$backendJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    & "$path\venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
} -ArgumentList $backendPath

Write-Host "       Backend started (Job ID: $($backendJob.Id))" -ForegroundColor Green

# Wait for backend to initialize
Write-Host "[3/4] Waiting for backend to initialize (loading AI models)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Start Frontend
Write-Host "[4/4] Starting Frontend (Next.js)..." -ForegroundColor Yellow
$frontendPath = Join-Path $projectRoot "railsvision"
$frontendJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    npm run dev
} -ArgumentList $frontendPath

Write-Host "       Frontend started (Job ID: $($frontendJob.Id))" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Servers are running!                 " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "  Press Ctrl+C to stop all servers" -ForegroundColor Yellow
Write-Host ""

# Keep script running and show output
try {
    while ($true) {
        # Check if jobs are still running
        $backendState = (Get-Job -Id $backendJob.Id).State
        $frontendState = (Get-Job -Id $frontendJob.Id).State
        
        if ($backendState -eq "Failed") {
            Write-Host "Backend crashed! Restarting..." -ForegroundColor Red
            Receive-Job -Id $backendJob.Id
            $backendJob = Start-Job -ScriptBlock {
                param($path)
                Set-Location $path
                & "$path\venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
            } -ArgumentList $backendPath
        }
        
        if ($frontendState -eq "Failed") {
            Write-Host "Frontend crashed! Restarting..." -ForegroundColor Red
            Receive-Job -Id $frontendJob.Id
            $frontendJob = Start-Job -ScriptBlock {
                param($path)
                Set-Location $path
                npm run dev
            } -ArgumentList $frontendPath
        }
        
        Start-Sleep -Seconds 5
    }
}
finally {
    Write-Host "Stopping servers..." -ForegroundColor Yellow
    Stop-Job -Id $backendJob.Id -ErrorAction SilentlyContinue
    Stop-Job -Id $frontendJob.Id -ErrorAction SilentlyContinue
    Remove-Job -Id $backendJob.Id -ErrorAction SilentlyContinue
    Remove-Job -Id $frontendJob.Id -ErrorAction SilentlyContinue
    Get-Process -Name "python" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "Servers stopped." -ForegroundColor Green
}
