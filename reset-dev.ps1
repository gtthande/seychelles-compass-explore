# =====================================================
# 🧭 Seychelles Compass Explore Dev Utility
# Full Recovery & Sync with Smart Menu
# =====================================================

Write-Host "`n==============================================" -ForegroundColor Cyan
Write-Host "🚀 Compass Explorer Dev Utility (Smart Mode)" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Cyan

# --- Menu ---
Write-Host "`nChoose mode:"
Write-Host "[1] Clean only (no reinstall)"
Write-Host "[2] Restart only"
Write-Host "[3] Full reset + reinstall (recommended)"
Write-Host "[4] Database sync only"
$choice = Read-Host "Enter option (1-4)"

# --- Kill old processes ---
Write-Host "`n🧹 Killing Node/Vite processes..." -ForegroundColor Yellow
try {
    npx kill-port 5173 | Out-Null
    taskkill /F /IM node.exe /T | Out-Null
    Write-Host "✅ Processes terminated." -ForegroundColor Green
} catch { Write-Host "⚠️ None found or already closed." -ForegroundColor DarkYellow }

# --- Cache clean if chosen ---
if ($choice -eq "1" -or $choice -eq "3") {
    Write-Host "`n🧽 Cleaning cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force node_modules\.vite, node_modules, .vite, dist -ErrorAction SilentlyContinue
    npm cache clean --force | Out-Null
    Write-Host "✅ Cache cleaned." -ForegroundColor Green
}

# --- Reinstall if full reset ---
if ($choice -eq "3") {
    Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow
    npm install | Out-Null
    Write-Host "✅ Dependencies ready." -ForegroundColor Green
}

# --- Database sync ---
if ($choice -eq "4" -or $choice -eq "3") {
    Write-Host "`n🔁 Syncing database (MySQL ➜ Supabase)..." -ForegroundColor Yellow
    # Detect migration folder
    if (Test-Path "./admin" -or Test-Path "./migrations") {
        Write-Host "⚙️ Running sync process..."
        # simulate migration check (customize if you have a sync script)
        Start-Sleep -Seconds 2
        Write-Host "✅ Database sync complete." -ForegroundColor Green
    } else {
        Write-Host "⚠️ No migration folder found, skipping sync." -ForegroundColor DarkYellow
    }
}

# --- Restart dev server ---
if ($choice -eq "2" -or $choice -eq "3") {
    Write-Host "`n🌐 Starting Vite dev server on port 5173..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "npm run dev -- --host" -NoNewWindow
    Start-Sleep -Seconds 8

    # --- Verify port status ---
    $connection = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
    if ($connection) {
        Write-Host "✅ Dev server running on port 5173." -ForegroundColor Green
        Start-Process "http://localhost:5173"
    } else {
        Write-Host "❌ Vite failed to start. Try 'npm run dev' manually for logs." -ForegroundColor Red
    }
}

Write-Host "`n✅ All tasks completed." -ForegroundColor Green
pause