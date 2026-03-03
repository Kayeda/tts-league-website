@echo off
setlocal

:: ============================================================
::  TTS League Website - Stop Script
::  Stops the running backend and Caddy processes.
:: ============================================================

set "ROOT=%~dp0"
set "PIDFILE=%ROOT%.pids"

:: --------------------------------------------------
:: Kill processes by image name (reliable fallback)
:: --------------------------------------------------
echo [*] Stopping TtsLeagueApi...
taskkill /f /im TtsLeagueApi.exe >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo     Stopped.
) else (
    echo     Not running.
)

echo [*] Stopping Caddy...
taskkill /f /im caddy.exe >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo     Stopped.
) else (
    echo     Not running.
)

:: Clean up PID file
if exist "%PIDFILE%" del "%PIDFILE%"

echo.
echo [*] All processes stopped.

endlocal
