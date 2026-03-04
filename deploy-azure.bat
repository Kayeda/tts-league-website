@echo off
setlocal

:: ============================================================
::  TTS League Website - Azure Deployment Build Script
::  Builds the frontend, publishes the backend, and creates
::  a zip file ready for Azure App Service deployment.
:: ============================================================

set "ROOT=%~dp0"
set "FRONTEND=%ROOT%frontend"
set "BACKEND=%ROOT%backend"
set "PUBLISH=%BACKEND%\publish"
set "DEPLOY_ZIP=%ROOT%deploy\tts-league-website.zip"

:: --------------------------------------------------
:: 1. Build the React frontend
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
:: 2. Copy build output to backend/wwwroot
:: --------------------------------------------------
echo [*] Copying frontend build to backend\wwwroot...
if exist "%BACKEND%\wwwroot" rmdir /s /q "%BACKEND%\wwwroot"
xcopy /e /i /q "%FRONTEND%\dist" "%BACKEND%\wwwroot" >nul

:: --------------------------------------------------
:: 3. Publish the .NET backend in Release mode
:: --------------------------------------------------
echo [*] Publishing .NET backend (Release)...
dotnet publish "%BACKEND%\TtsLeagueApi.csproj" -c Release -o "%PUBLISH%" --nologo -v quiet
if %ERRORLEVEL% neq 0 (
    echo [!] Backend publish failed!
    exit /b 1
)

:: --------------------------------------------------
:: 4. Create deploy zip
:: --------------------------------------------------
echo [*] Creating deployment zip...
if not exist "%ROOT%deploy" mkdir "%ROOT%deploy"
if exist "%DEPLOY_ZIP%" del "%DEPLOY_ZIP%"

:: Use PowerShell to create the zip
powershell -NoProfile -Command "Compress-Archive -Path '%PUBLISH%\*' -DestinationPath '%DEPLOY_ZIP%' -Force"
if %ERRORLEVEL% neq 0 (
    echo [!] Failed to create zip!
    exit /b 1
)

echo.
echo ============================================================
echo   Build complete!
echo.
echo   Deployment zip: deploy\tts-league-website.zip
echo.
echo   To deploy to Azure, choose one of:
echo.
echo   Option A - Azure CLI:
echo     az webapp deploy --resource-group YOUR_RG --name YOUR_APP ^
echo       --src-path deploy\tts-league-website.zip --type zip
echo.
echo   Option B - Azure Portal:
echo     1. Go to your App Service in Azure Portal
echo     2. Go to Deployment Center ^> FTPS credentials
echo     3. Or use the "Advanced Tools (Kudu)" ^> Zip Deploy
echo.
echo   Option C - VS Code:
echo     1. Install "Azure App Service" extension
echo     2. Right-click the deploy\ folder ^> Deploy to Web App
echo ============================================================
echo.

endlocal
