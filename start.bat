@echo off
title DownpourChat

echo.
echo  ================================
echo   DownpourChat - Starting App...
echo  ================================
echo.

:: Check if node_modules exist, install if not
if not exist "node_modules" (
    echo [1/3] Installing root dependencies...
    call npm install
)
if not exist "server\node_modules" (
    echo [2/3] Installing server dependencies...
    cd server && call npm install && cd ..
)
if not exist "client\node_modules" (
    echo [3/3] Installing client dependencies...
    cd client && call npm install && cd ..
)

echo.
echo  Starting server and client...
echo  Server: http://localhost:5000
echo  Client: http://localhost:5173
echo.
echo  Press Ctrl+C to stop both.
echo.

call npm run dev
