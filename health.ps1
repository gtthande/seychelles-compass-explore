# =====================================================
# 🔍 Vite Health Check & Recovery Script
# Comprehensive diagnostics for ERR_EMPTY_RESPONSE issues
# =====================================================

Write-Host "`n==============================================" -ForegroundColor Cyan
Write-Host "Vite Health Check and Recovery" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Cyan

# --- Step 1: Check if Vite is running ---
Write-Host "`n1️⃣ Checking if Vite is running on port 5173..." -ForegroundColor Yellow
$viteProcess = netstat -ano | findstr 5173
if ($viteProcess) {
    Write-Host "✅ Vite process found:" -ForegroundColor Green
    Write-Host $viteProcess -ForegroundColor White
} else {
    Write-Host "❌ No Vite process found on port 5173" -ForegroundColor Red
}

# --- Step 2: Check Vite installation ---
Write-Host "`n2️⃣ Checking Vite installation..." -ForegroundColor Yellow
if (-not (Test-Path "./node_modules/vite")) {
    Write-Host "⚠️ Vite not found, installing..." -ForegroundColor DarkYellow
    npm install vite | Out-Null
    Write-Host "✅ Vite installed" -ForegroundColor Green
} else {
    Write-Host "✅ Vite found in node_modules" -ForegroundColor Green
}

# --- Step 3: Check Vite version ---
Write-Host "`n3️⃣ Checking Vite version..." -ForegroundColor Yellow
try {
    $viteVersion = npm exec vite -- --version
    Write-Host "✅ Vite version: $viteVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to get Vite version: $_" -ForegroundColor Red
}

# --- Step 4: Check environment files ---
Write-Host "`n4️⃣ Checking environment configuration..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "✅ .env.local found" -ForegroundColor Green
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "VITE_SITE_URL") {
        Write-Host "✅ VITE_SITE_URL configured" -ForegroundColor Green
    } else {
        Write-Host "⚠️ VITE_SITE_URL not found in .env.local" -ForegroundColor DarkYellow
    }
} else {
    Write-Host "⚠️ .env.local not found" -ForegroundColor DarkYellow
}

if (Test-Path ".env") {
    Write-Host "✅ .env found" -ForegroundColor Green
} else {
    Write-Host "⚠️ .env not found" -ForegroundColor DarkYellow
}

# --- Step 5: Check vite.config.ts ---
Write-Host "`n5️⃣ Checking vite.config.ts..." -ForegroundColor Yellow
if (Test-Path "vite.config.ts") {
    Write-Host "✅ vite.config.ts found" -ForegroundColor Green
    $configContent = Get-Content "vite.config.ts" -Raw
    if ($configContent -match "host.*0\.0\.0\.0") {
        Write-Host "✅ Host binding configured correctly" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Host binding may need configuration" -ForegroundColor DarkYellow
    }
} else {
    Write-Host "❌ vite.config.ts not found" -ForegroundColor Red
}

# --- Step 6: Kill existing processes ---
Write-Host "`n6️⃣ Cleaning up existing processes..." -ForegroundColor Yellow
try {
    npx kill-port 5173 | Out-Null
    taskkill /F /IM node.exe /T | Out-Null
    Write-Host "✅ Processes cleaned up" -ForegroundColor Green
} catch {
    Write-Host "⚠️ No processes to clean up" -ForegroundColor DarkYellow
}

# --- Step 7: Start Vite with debug mode ---
Write-Host "`n7️⃣ Starting Vite with debug mode..." -ForegroundColor Yellow
Write-Host "Running: npm run dev -- --host --debug" -ForegroundColor Cyan

try {
    Start-Process powershell -ArgumentList "npm run dev -- --host --debug" -NoNewWindow
    Start-Sleep -Seconds 8
    
    # Check if server started
    $serverCheck = netstat -ano | findstr 5173
    if ($serverCheck) {
        Write-Host "✅ Vite server started successfully" -ForegroundColor Green
        Write-Host "Server status:" -ForegroundColor Cyan
        Write-Host $serverCheck -ForegroundColor White
        
        # Try to open browser
        Write-Host "`n🌐 Opening browser..." -ForegroundColor Yellow
        Start-Process "http://localhost:5173"
    } else {
        Write-Host "❌ Vite server failed to start" -ForegroundColor Red
        Write-Host "Check the console output above for errors" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Failed to start Vite: $_" -ForegroundColor Red
}

# --- Step 8: Final recommendations ---
Write-Host "`n8️⃣ Health Check Complete!" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Cyan

Write-Host "`n💡 If Vite still doesn't work:" -ForegroundColor Yellow
Write-Host "• Check console output above for specific errors" -ForegroundColor White
Write-Host "• Try: npm run dev -- --host --port 5173" -ForegroundColor White
Write-Host "• Verify no firewall is blocking port 5173" -ForegroundColor White
Write-Host "• Check if another service is using port 5173" -ForegroundColor White

Write-Host "`nPress any key to continue..." -ForegroundColor Gray
Read-Host
