@echo off
REM Seychelles Compass Explore - Development Reset Utility (Windows Batch)
REM Simple batch file version for Windows users

echo 🔄 Seychelles Compass Explore - Development Reset Utility
echo =================================================

echo.
echo 🚀 Step 1: Killing processes on development ports...
echo 🔍 Checking for processes on port 5173...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173"') do (
    echo 🔪 Killing process PID: %%a
    taskkill /PID %%a /F >nul 2>&1
)

echo 🔍 Checking for processes on port 5174...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5174"') do (
    echo 🔪 Killing process PID: %%a
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo 🧹 Step 2: Clearing cache directories...
if exist ".vite" (
    echo 🗑️  Removing .vite...
    rmdir /s /q ".vite" >nul 2>&1
    echo ✅ Removed .vite successfully
)
if exist "node_modules\.vite" (
    echo 🗑️  Removing node_modules\.vite...
    rmdir /s /q "node_modules\.vite" >nul 2>&1
    echo ✅ Removed node_modules\.vite successfully
)
if exist ".next" (
    echo 🗑️  Removing .next...
    rmdir /s /q ".next" >nul 2>&1
    echo ✅ Removed .next successfully
)
if exist "dist" (
    echo 🗑️  Removing dist...
    rmdir /s /q "dist" >nul 2>&1
    echo ✅ Removed dist successfully
)
if exist "build" (
    echo 🗑️  Removing build...
    rmdir /s /q "build" >nul 2>&1
    echo ✅ Removed build successfully
)

echo.
echo 📦 Step 3: Clearing npm cache...
npm cache clean --force >nul 2>&1
echo ✅ npm cache cleared successfully

echo.
echo ⏳ Step 4: Waiting for processes to terminate...
timeout /t 2 /nobreak >nul

echo.
echo 🚀 Step 5: Starting development server...
echo Running: npm run dev
start "Dev Server" cmd /k "npm run dev"

echo.
echo 🎉 Reset complete! Development environment should be clean and running.
echo =================================================
echo 🌐 Your application should be available at:
echo    • http://localhost:5173/
echo    • http://localhost:5173/admin (Admin Panel)
echo    • http://localhost:5173/directory (Business Directory)

pause
