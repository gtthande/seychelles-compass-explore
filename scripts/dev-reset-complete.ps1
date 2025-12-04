# Complete Dev Reset Script
# Kills Vite, cleans cache, reinstalls, applies migrations, regenerates types, starts dev server

Write-Host "=================================================="
Write-Host "  🚀 Complete Dev Environment Reset"
Write-Host "=================================================="
Write-Host ""

# Step 1: Kill Vite on port 5173
Write-Host "Step 1: Killing Vite dev server on port 5173..."
$port = 5173
$connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($connection) {
    $processId = $connection.OwningProcess
    if ($processId -and $processId -ne 0) {
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "   ⚠ Found process on port $port (PID: $processId)"
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            Start-Sleep -Milliseconds 500
            Write-Host "   ✅ Process killed"
        }
    }
} else {
    Write-Host "   ✅ Port $port is free"
}
Write-Host ""

# Step 2: Clean node_modules and cache
Write-Host "Step 2: Cleaning node_modules and cache..."
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "   ✅ Removed node_modules"
}
if (Test-Path ".vite") {
    Remove-Item -Recurse -Force ".vite"
    Write-Host "   ✅ Removed .vite cache"
}
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "   ✅ Removed dist"
}
Write-Host ""

# Step 3: Install dependencies
Write-Host "Step 3: Installing dependencies..."
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ npm install failed"
    exit 1
}
Write-Host "   ✅ Dependencies installed"
Write-Host ""

# Step 4: Apply Supabase migrations (if Supabase CLI is available)
Write-Host "Step 4: Applying Supabase migrations..."
$supabaseCheck = Get-Command supabase -ErrorAction SilentlyContinue
if ($supabaseCheck) {
    Write-Host "   📝 Note: Run migrations manually via Supabase Dashboard or CLI"
    Write-Host "   Migration file: supabase/migrations/20250130000000_comprehensive_schema_repair.sql"
} else {
    Write-Host "   ⚠ Supabase CLI not found. Install with: npm install -g supabase"
    Write-Host "   📝 Apply migration manually via Supabase Dashboard"
}
Write-Host ""

# Step 5: Regenerate types
Write-Host "Step 5: Regenerating TypeScript types..."
if (Test-Path "scripts/regenerate-types-complete.ps1") {
    & "scripts/regenerate-types-complete.ps1"
} else {
    Write-Host "   ⚠ Type regeneration script not found"
    Write-Host "   📝 Regenerate types manually after applying migrations"
}
Write-Host ""

# Step 6: Start dev server
Write-Host "Step 6: Starting Vite dev server..."
Write-Host "   🚀 Starting on http://localhost:5173"
Write-Host ""
Start-Sleep -Seconds 2

# Start dev server in background
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Minimized

Write-Host "=================================================="
Write-Host "  ✅ Dev Reset Complete!"
Write-Host "=================================================="
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Apply migration: supabase/migrations/20250130000000_comprehensive_schema_repair.sql"
Write-Host "2. Regenerate types: npm run gen:types"
Write-Host "3. Verify dev server is running: http://localhost:5173"
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

