@echo off
setlocal

:: ============================================================
::  TTS League Website - Start Script
::  Builds the frontend, publishes the backend, and starts
::  both the .NET API and Caddy as background processes.
:: ============================================================

set "ROOT=%~dp0"
set "FRONTEND=%ROOT%frontend"
set "BACKEND=%ROOT%backend"
set "PUBLISH=%BACKEND%\publish"
set "PIDFILE=%ROOT%.pids"

:: --------------------------------------------------
:: 1. Stop any previously running instances
:: --------------------------------------------------
if exist "%ROOT%stop-site.bat" (
    echo [*] Stopping any previous instances...
    call "%ROOT%stop-site.bat"
)

:: --------------------------------------------------
:: 2. Build the React frontend
:: --------------------------------------------------
echo [*] Building React frontend...
pushd "%FRONTEND%"
call npm install
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [!] Frontend build failed!
    popd
    exit /b 1
)
popd

:: --------------------------------------------------
:: 3. Copy build output to backend/wwwroot
:: --------------------------------------------------
echo [*] Copying frontend build to backend\wwwroot...
if exist "%BACKEND%\wwwroot" rmdir /s /q "%BACKEND%\wwwroot"
xcopy /e /i /q "%FRONTEND%\dist" "%BACKEND%\wwwroot" >nul

:: --------------------------------------------------
:: 4. Publish the .NET backend in Release mode
:: --------------------------------------------------
echo [*] Publishing .NET backend...
dotnet publish "%BACKEND%\TtsLeagueApi.csproj" -c Release -o "%PUBLISH%" --nologo -v quiet
if %ERRORLEVEL% neq 0 (
    echo [!] Backend publish failed!
    exit /b 1
)

:: --------------------------------------------------
:: 5. Start the backend as a background process
:: --------------------------------------------------
echo [*] Starting backend on port 5022...
start "" /B "%PUBLISH%\TtsLeagueApi.exe" --urls "http://0.0.0.0:5022" --contentroot "%PUBLISH%" > "%ROOT%backend.log" 2>&1

:: Give it a moment to start and grab the PID
timeout /t 3 /nobreak >nul

:: Find the PID of TtsLeagueApi.exe (using csv format for locale independence)
set "BACKEND_PID=unknown"
for /f "skip=1 tokens=2 delims=," %%a in ('tasklist /fi "imagename eq TtsLeagueApi.exe" /fo csv 2^>nul') do set "BACKEND_PID=%%~a"

:: --------------------------------------------------
:: 6. Start Caddy as a background process
:: --------------------------------------------------
echo [*] Starting Caddy reverse proxy...
start "" /B "%ROOT%caddy.exe" run --config "%ROOT%Caddyfile" > "%ROOT%caddy.log" 2>&1

timeout /t 2 /nobreak >nul

set "CADDY_PID=unknown"
for /f "skip=1 tokens=2 delims=," %%a in ('tasklist /fi "imagename eq caddy.exe" /fo csv 2^>nul') do set "CADDY_PID=%%~a"

:: --------------------------------------------------
:: 7. Save PIDs for stop-site.bat
:: --------------------------------------------------
> "%PIDFILE%" echo %BACKEND_PID%
>> "%PIDFILE%" echo %CADDY_PID%

echo.
echo ============================================================
echo   TTS League Website is running!
echo.
echo   Backend PID : %BACKEND_PID%  (http://localhost:5022)
echo   Caddy PID   : %CADDY_PID%  (trytosurvive.servegame.com)
echo.
echo   Logs: backend.log, caddy.log
echo   To stop: run stop-site.bat
echo ============================================================
echo.

endlocal
