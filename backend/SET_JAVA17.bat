@echo off
echo ========================================
echo Setting JAVA_HOME to Java 17
echo ========================================
echo.

REM Update this path to your actual Java 17 installation
set JAVA17_PATH=C:\Program Files\Eclipse Adoptium\jdk-17.0.12+7

if not exist "%JAVA17_PATH%" (
    echo ERROR: Java 17 not found at: %JAVA17_PATH%
    echo.
    echo Please edit this script and update JAVA17_PATH to your Java 17 location
    echo.
    echo Common locations:
    echo   C:\Program Files\Eclipse Adoptium\jdk-17.0.x
    echo   C:\Program Files\Java\jdk-17.0.x
    echo.
    pause
    exit /b 1
)

echo Setting JAVA_HOME to: %JAVA17_PATH%
setx JAVA_HOME "%JAVA17_PATH%" /M
setx PATH "%JAVA17_PATH%\bin;%PATH%" /M

echo.
echo ========================================
echo JAVA_HOME Updated!
echo ========================================
echo.
echo IMPORTANT: Close and reopen your terminal/IDE for changes to take effect
echo.
echo After reopening, verify with:
echo   java -version
echo   javac -version
echo.
pause

