@echo off
echo ========================================
echo   YT Short Generator - Auto Installer
echo ========================================
echo.

echo [1/4] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Please install Node.js >= 18
    pause
    exit /b 1
)
echo Node.js found

echo.
echo [2/4] Checking yt-dlp...
yt-dlp --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing yt-dlp via pip...
    pip install -U yt-dlp
    if %errorlevel% neq 0 (
        echo WARNING: yt-dlp installation failed. Please install manually:
        echo   pip install -U yt-dlp
    )
)
echo yt-dlp ready

echo.
echo [3/4] Installing npm dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)
echo Dependencies installed

echo.
echo [4/4] Creating .env file...
if not exist .env (
    copy /Y .env.example .env >nul
    echo .env created
) else (
    echo .env already exists
)

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo To start the app, run: npm start
echo Then open http://localhost:3000
echo.
pause
