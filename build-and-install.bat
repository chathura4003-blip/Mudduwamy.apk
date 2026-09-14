@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo  Sri Sumana Maha Pirivena ERP - Android APK Builder
echo ========================================================
echo.

:: Setup required development environment paths
if exist "C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot" (
    set "JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot"
)
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "ANDROID_SDK_ROOT=%LOCALAPPDATA%\Android\Sdk"
set "PATH=C:\Program Files\nodejs;%JAVA_HOME%\bin;%LOCALAPPDATA%\Android\Sdk\platform-tools;%LOCALAPPDATA%\Android\Sdk\cmdline-tools\latest\bin;%PATH%"

echo [1/4] Building Web Application (Vite)...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Web build failed!
    pause
    exit /b %errorlevel%
)

echo.
echo [2/4] Syncing Capacitor Android...
call npx cap sync android
if %errorlevel% neq 0 (
    echo [ERROR] Capacitor sync failed!
    pause
    exit /b %errorlevel%
)

echo.
echo [3/4] Building Android APK with Gradle...
cd android
call gradlew.bat assembleDebug --no-daemon
if %errorlevel% neq 0 (
    echo [ERROR] Gradle build failed!
    cd ..
    pause
    exit /b %errorlevel%
)
cd ..

set "APK_PATH=android\app\build\outputs\apk\debug\app-debug.apk"
set "TARGET_APK=SriSumanaPirivenaERP.apk"

if exist "%APK_PATH%" (
    copy /y "%APK_PATH%" "%TARGET_APK%" >nul
    echo.
    echo [SUCCESS] APK Built: %TARGET_APK%
    echo.
    echo [4/4] Installing to Connected USB Android Device via ADB...
    adb devices
    adb install -r "%TARGET_APK%"
    if %errorlevel% equ 0 (
        echo.
        echo [SUCCESS] APK successfully installed to device!
        echo Launching app...
        adb shell am start -n lk.srisumana.erp/.MainActivity
    ) else (
        echo [WARNING] ADB install failed. Make sure your phone is connected with USB Debugging enabled.
    )
) else (
    echo [ERROR] Built APK file not found at %APK_PATH%!
)

echo.
echo ========================================================
echo  Done!
echo ========================================================
pause
