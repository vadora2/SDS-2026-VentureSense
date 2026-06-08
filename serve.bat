@echo off
netstat -ano | findstr /R ":3000 .*LISTEN" >nul 2>&1
if %errorlevel% == 0 (
    echo Server already running, opening browser...
    start "" "http://localhost:3000/admin-dashboard/frontend/index.html"
    goto :eof
)
echo Starting server...
start "VentureSense Dev Server" cmd /c "npx serve . --listen 3000"
echo Waiting for server to be ready...
:waitloop
timeout /t 1 /nobreak >nul
netstat -ano | findstr /R ":3000 .*LISTEN" >nul 2>&1
if %errorlevel% neq 0 goto waitloop
echo Ready. Opening browser...
start "" "http://localhost:3000/admin-dashboard/frontend/index.html"
