# ==============================================
# Compass Explorer Dev Recovery Utility
# ==============================================

param(
    [string]$Mode = "auto"
)

Write-Host "`n==============================================" -ForegroundColor Cyan
Write-Host "Compass Explorer Dev Recovery Utility" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Cyan

# --- Interactive Menu ---
if ($Mode -eq "interactive") {
    Write-Host "`nChoose recovery mode:" -ForegroundColor Yellow
    Write-Host "1. Clean only (clear caches, keep dependencies)" -ForegroundColor White
    Write-Host "2. Restart only (kill processes, restart dev server)" -ForegroundColor White
    Write-Host "3. Full reset (clean + reinstall + restart)" -ForegroundColor White
    Write-Host "4. Database sync check (MySQL + Supabase)" -ForegroundColor White
    Write-Host "5. Exit" -ForegroundColor White
    
    $choice = Read-Host "`nEnter your choice (1-5)"
    
    switch ($choice) {
        "1" { $Mode = "clean" }
        "2" { $Mode = "restart" }
        "3" { $Mode = "full" }
        "4" { $Mode = "database" }
        "5" { 
            Write-Host "Goodbye!" -ForegroundColor Green
            exit 0
        }
        default { 
            Write-Host "Invalid choice. Using full reset mode." -ForegroundColor Red
            $Mode = "full"
        }
    }
}

# --- Step 1: Kill any processes using Vite port ---
if ($Mode -eq "restart" -or $Mode -eq "full" -or $Mode -eq "auto") {
    Write-Host "`nKilling any existing Node/Vite processes..." -ForegroundColor Yellow
    try {
        npx kill-port 5173 | Out-Null
        taskkill /F /IM node.exe /T | Out-Null
        Write-Host "Node/Vite processes killed." -ForegroundColor Green
    } catch {
        Write-Host "Could not kill processes (maybe none running)." -ForegroundColor DarkYellow
    }
}

# --- Step 2: Clean Vite and dependency caches ---
if ($Mode -eq "clean" -or $Mode -eq "full" -or $Mode -eq "auto") {
    Write-Host "`nCleaning Vite and Node cache..." -ForegroundColor Yellow
    try {
        Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
        Remove-Item -Recurse -Force .vite -ErrorAction SilentlyContinue
        Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
        npm cache clean --force | Out-Null
        Write-Host "Cache cleaned successfully." -ForegroundColor Green
    } catch {
        Write-Host "Skipped cache clean due to permission issue." -ForegroundColor DarkYellow
    }
}

# --- Step 3: Full dependency reinstall ---
if ($Mode -eq "full" -or $Mode -eq "auto") {
    Write-Host "`nReinstalling dependencies (npm install)..." -ForegroundColor Yellow
    try {
        Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
        npm install | Out-Null
        Write-Host "Dependencies installed successfully." -ForegroundColor Green
    } catch {
        Write-Host "Error during npm install: $_" -ForegroundColor Red
        exit 1
    }
}

# --- Step 4: Database Sync Detection ---
if ($Mode -eq "database" -or $Mode -eq "auto") {
    Write-Host "`nChecking database sync status..." -ForegroundColor Yellow
    
    # Check for .env.local file
    if (Test-Path ".env.local") {
        Write-Host ".env.local found" -ForegroundColor Green
        
        # Check for Supabase configuration
        $envContent = Get-Content ".env.local" -Raw
        if ($envContent -match "SUPABASE") {
            Write-Host "Supabase configuration detected" -ForegroundColor Green
        } else {
            Write-Host "No Supabase configuration found" -ForegroundColor DarkYellow
        }
        
        # Check for Google Maps API key
        if ($envContent -match "VITE_GOOGLE_MAPS_API_KEY") {
            Write-Host "Google Maps API key configured" -ForegroundColor Green
        } else {
            Write-Host "Google Maps API key not configured" -ForegroundColor DarkYellow
        }
    } else {
        Write-Host ".env.local not found - database sync may be affected" -ForegroundColor Red
    }
    
    # Check for Supabase migrations
    if (Test-Path "supabase/migrations") {
        $migrationCount = (Get-ChildItem "supabase/migrations" -Filter "*.sql").Count
        Write-Host "Found $migrationCount Supabase migrations" -ForegroundColor Green
    } else {
        Write-Host "No Supabase migrations found" -ForegroundColor DarkYellow
    }
    
    # Check for admin scripts
    if (Test-Path "admin") {
        $adminScripts = (Get-ChildItem "admin" -Filter "*.ts").Count
        Write-Host "Found $adminScripts admin scripts" -ForegroundColor Green
    } else {
        Write-Host "No admin scripts found" -ForegroundColor DarkYellow
    }
}

# --- Step 5: Start Vite dev server ---
if ($Mode -eq "restart" -or $Mode -eq "full" -or $Mode -eq "auto") {
    Write-Host "`nStarting Vite dev server..." -ForegroundColor Yellow
    
    # Check if HTTPS is enabled
    $viteConfig = Get-Content "vite.config.ts" -Raw
    $isHttps = $viteConfig -match "https.*true"
    
    if ($isHttps) {
        Write-Host "HTTPS mode detected - will use https://localhost:5173" -ForegroundColor Cyan
        Start-Process powershell -ArgumentList "npm run dev" -NoNewWindow
        Start-Sleep -Seconds 8
        
        Write-Host "`nOpening https://localhost:5173 in browser..." -ForegroundColor Yellow
        Start-Process "https://localhost:5173"
    } else {
        Write-Host "HTTP mode - will use http://localhost:5173" -ForegroundColor Cyan
        Start-Process powershell -ArgumentList "npm run dev" -NoNewWindow
        Start-Sleep -Seconds 6
        
        Write-Host "`nOpening http://localhost:5173 in browser..." -ForegroundColor Yellow
        Start-Process "http://localhost:5173"
    }
}

# --- Step 6: Final Status ---
Write-Host "`nRecovery completed successfully!" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Cyan

if ($Mode -eq "database") {
    Write-Host "`nDatabase sync recommendations:" -ForegroundColor Yellow
    Write-Host "• Run npm run seed to populate demo data" -ForegroundColor White
    Write-Host "• Check admin/ folder for database setup scripts" -ForegroundColor White
    Write-Host "• Verify Supabase connection in .env.local file" -ForegroundColor White
}

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "• Check browser for any console errors" -ForegroundColor White
Write-Host "• Test map functionality with/without API key" -ForegroundColor White
Write-Host "• Verify business data loading correctly" -ForegroundColor White

Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")