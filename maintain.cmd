@echo off
setlocal enabledelayedexpansion

echo ==================================================
echo   🚀 Compass Explorer Maintenance Utility
echo   (Kill Vite + Push to GitHub)
echo ==================================================
echo.

:: Step 1: Kill any process running on port 5173
echo 🔍 Checking for Vite dev server on port 5173...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
    echo ⚠ Found process using port 5173 with PID %%a
    taskkill /PID %%a /F
    echo ✅ Process %%a killed. Port 5173 is now free.
    goto :continue
)

echo ❌ No process found using port 5173.

:continue
echo.
echo ==================================================
echo   📝 GitHub Commit & Push
echo ==================================================
echo.

:: Step 2: Ask for commit message
set /p commitmsg="Enter commit message: "

:: Navigate to project folder
cd /d E:\Projects\Cursor\seychelles-compass-explore

echo 🔄 Adding changes...
git add .

echo 📝 Committing changes...
git commit -m "!commitmsg!"

echo ⬆ Pushing to GitHub main branch...
git push origin main

echo ✅ All done! Changes pushed to GitHub.
pause
