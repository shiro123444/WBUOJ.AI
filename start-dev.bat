@echo off
echo [WBUOJ.AI] Starting Development Environment...

REM 1. Start Infrastructure (Docker)
echo [1/3] Checking Docker services...
docker compose up -d
if %errorlevel% neq 0 (
    echo [ERROR] Docker failed to start. Please enable Docker Desktop first.
    pause
    exit /b
)

REM 2. Start Backend in a new window
echo [2/3] Starting Backend Server...
start "WBUOJ Backend" cmd /k "cd backend && npm run dev"

REM 3. Start Frontend in a new window
echo [3/3] Starting Frontend Client...
start "WBUOJ Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo [SUCCESS] All services are starting!
echo.
echo Frontend: http://localhost:5173  (Access this to use the app)
echo Backend:  http://localhost:3000
echo ========================================================
echo.
pause
