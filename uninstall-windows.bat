@echo off
REM Uninstall Script for MKG Desktop App (Windows)
REM This script will completely remove the application and all its data

setlocal EnableDelayedExpansion

set APP_NAME=MKG Desktop App
set BUNDLE_ID=com.makkuragatama.femkgpwa
set PROCESS_NAME=femkgpwa.exe

echo ========================================
echo   MKG Desktop App Uninstaller (Windows)
echo ========================================
echo.

REM Check for administrator privileges
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running with Administrator privileges...
    echo.
) else (
    echo WARNING: Not running as Administrator
    echo Some files may not be removable without admin rights
    echo.
    pause
)

REM Step 1: Close the application if running
echo Step 1: Checking if application is running...
tasklist /FI "IMAGENAME eq %PROCESS_NAME%" 2>NUL | find /I /N "%PROCESS_NAME%">NUL
if "%ERRORLEVEL%"=="0" (
    echo WARNING: Application is currently running
    echo Closing application...
    taskkill /F /IM "%PROCESS_NAME%" >NUL 2>&1
    timeout /t 2 /nobreak >NUL
    echo [OK] Application closed
) else (
    echo [OK] Application is not running
)

REM Step 2: Kill Node.js processes on port 3006
echo.
echo Step 2: Checking for Node.js server on port 3006...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3006" ^| find "LISTENING"') do (
    echo Found server on port 3006 ^(PID: %%a^)
    taskkill /F /PID %%a >NUL 2>&1
    echo [OK] Stopped Node.js server
)

REM Step 3: Remove the application
echo.
echo Step 3: Removing application...

set FOUND=0

REM Common installation paths
set "INSTALL_PATHS[0]=%ProgramFiles%\%APP_NAME%"
set "INSTALL_PATHS[1]=%ProgramFiles(x86)%\%APP_NAME%"
set "INSTALL_PATHS[2]=%LocalAppData%\Programs\%APP_NAME%"
set "INSTALL_PATHS[3]=%AppData%\%APP_NAME%"

for /L %%i in (0,1,3) do (
    if exist "!INSTALL_PATHS[%%i]!" (
        echo Found application at: !INSTALL_PATHS[%%i]!
        rmdir /S /Q "!INSTALL_PATHS[%%i]!" >NUL 2>&1
        if !ERRORLEVEL! EQU 0 (
            echo [OK] Removed: !INSTALL_PATHS[%%i]!
            set FOUND=1
        ) else (
            echo [FAIL] Failed to remove: !INSTALL_PATHS[%%i]!
        )
    )
)

if !FOUND! EQU 0 (
    echo WARNING: Application not found in common locations
)

REM Step 4: Remove Start Menu shortcuts
echo.
echo Step 4: Removing shortcuts...

set "SHORTCUT_PATHS[0]=%ProgramData%\Microsoft\Windows\Start Menu\Programs\%APP_NAME%.lnk"
set "SHORTCUT_PATHS[1]=%AppData%\Microsoft\Windows\Start Menu\Programs\%APP_NAME%.lnk"
set "SHORTCUT_PATHS[2]=%UserProfile%\Desktop\%APP_NAME%.lnk"

for /L %%i in (0,1,2) do (
    if exist "!SHORTCUT_PATHS[%%i]!" (
        del /F /Q "!SHORTCUT_PATHS[%%i]!" >NUL 2>&1
        echo [OK] Removed shortcut: !SHORTCUT_PATHS[%%i]!
    )
)

REM Step 5: Remove application data
echo.
echo Step 5: Removing application data...

set "DATA_PATHS[0]=%AppData%\%BUNDLE_ID%"
set "DATA_PATHS[1]=%LocalAppData%\%BUNDLE_ID%"
set "DATA_PATHS[2]=%LocalAppData%\%APP_NAME%"
set "DATA_PATHS[3]=%Temp%\%BUNDLE_ID%"

for /L %%i in (0,1,3) do (
    if exist "!DATA_PATHS[%%i]!" (
        rmdir /S /Q "!DATA_PATHS[%%i]!" >NUL 2>&1
        if !ERRORLEVEL! EQU 0 (
            echo [OK] Removed: !DATA_PATHS[%%i]!
        )
    )
)

REM Step 6: Remove registry entries (optional)
echo.
echo Step 6: Removing registry entries...

reg delete "HKCU\Software\%BUNDLE_ID%" /f >NUL 2>&1
if !ERRORLEVEL! EQU 0 (
    echo [OK] Removed registry entries
)

REM Step 7: Remove from Programs and Features
echo.
echo Step 7: Checking Windows Installer entries...

REM Try to find uninstaller in registry
for /f "tokens=2*" %%a in ('reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall" /s /f "%APP_NAME%" ^| find "UninstallString"') do (
    echo Found uninstaller: %%b
    echo Running official uninstaller...
    start /wait "" %%b /S
    echo [OK] Official uninstaller executed
    goto :cleanup
)

for /f "tokens=2*" %%a in ('reg query "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall" /s /f "%APP_NAME%" ^| find "UninstallString"') do (
    echo Found uninstaller: %%b
    echo Running official uninstaller...
    start /wait "" %%b /S
    echo [OK] Official uninstaller executed
    goto :cleanup
)

:cleanup
REM Summary
echo.
echo ========================================
echo   Uninstallation Complete!
echo ========================================
echo.
echo The following items have been removed:
echo   * Application files
echo   * Application data and caches
echo   * Shortcuts
echo   * Registry entries
echo   * Background processes
echo.
echo Thank you for using MKG Desktop App!
echo.

pause
