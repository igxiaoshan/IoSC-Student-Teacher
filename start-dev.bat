@echo off
chcp 65001 >nul
echo ========================================
echo   Starting Backend & Frontend
echo ========================================

echo [1/2] Starting Backend (port 5000)...
start "Backend" cmd /k "cd /d %~dp0backend && npm run start"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend (port 3000)...
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run start"

echo.
echo ========================================
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:3000
echo ========================================
echo.
echo Press any key to close this window...
pause >nul
