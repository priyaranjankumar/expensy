@echo off
echo ============================================
echo   Expense Tracker - Windows Build Script
echo ============================================
echo.

:: Check if we're in the right directory
if not exist "app" (
    echo ERROR: Please run this script from the backend directory
    pause
    exit /b 1
)

:: Activate virtual environment
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else (
    echo Creating virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
)

:: Install dependencies
echo Installing dependencies...
pip install -r requirements.txt
pip install pyinstaller

:: Build frontend
echo.
echo Building frontend...
cd ..\frontend
if not exist "node_modules" (
    call npm install
)
call npm run build

:: Copy frontend build to backend static folder
echo.
echo Copying frontend to backend\static...
if exist "..\backend\static" rmdir /s /q "..\backend\static"
mkdir "..\backend\static"
xcopy /E /I /Y "dist\*" "..\backend\static\"

:: Go back to backend
cd ..\backend

:: Build executable
echo.
echo Building executable...
pyinstaller expense_tracker.spec --clean --noconfirm

:: Copy static to dist folder
echo.
echo Copying static files to dist...
if exist "dist\static" rmdir /s /q "dist\static"
xcopy /E /I /Y "static" "dist\static"

echo.
echo ============================================
echo   BUILD COMPLETE!
echo   
echo   Output: dist\ExpenseTracker.exe
echo   
echo   To run: double-click ExpenseTracker.exe
echo   (static folder must be next to the exe)
echo ============================================
pause
