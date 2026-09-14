@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo  Sri Sumana Maha Pirivena ERP - Android APK Builder
echo ========================================================
echo.

echo [1/4] Building Web Application...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Web build failed!
    exit /b %errorlevel%
)

echo.
echo [2/4] Syncing Capacitor Android...
call npx cap sync android
if %errorlevel% neq 0 (
    echo [ERROR] Capacitor sync failed!
    exit /b %errorlevel%
)

echo.
echo [3/4] Building Release APK with Gradle...
cd android
call gradlew.bat assembleRelease
if %errorlevel% neq 0 (
    echo [ERROR] Gradle build failed!
    cd ..
    exit /b %errorlevel%
)
cd ..

echo.
echo [4/4] Installing to Connected USB Android Device...
set APK_PATH=android\app\build\outputs\apk\release\app-release.apk
if not exist "%APK_PATH%" (
    set APK_PATH=android\app\build\outputs\apk\release\app-release-unsigned.apk
)

if exist "%APK_PATH%" (
    echo Found APK: %APK_PATH%
    adb install -r "%APK_PATH%"
    if %errorlevel% equ 0 (
        echo.
        echo [SUCCESS] APK successfully installed to device!
    ) else (
        echo [WARNING] ADB install failed. Make sure your device is connected with USB Debugging enabled.
    )
) else (
    echo [ERROR] APK output file not found!
)

echo.
pause
