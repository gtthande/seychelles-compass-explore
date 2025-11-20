# iCompass Permanent Stability System - Validation Script
# This script validates that all stability fixes are in place

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "iCompass Stability System Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()

# Check 1: Environment variables
Write-Host "[1/8] Checking environment variables..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "  ✓ .env file exists" -ForegroundColor Green
    $envContent = Get-Content ".env" -Raw
    $requiredVars = @("VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "VITE_GOOGLE_MAPS_API_KEY", "VITE_SITE_URL")
    foreach ($var in $requiredVars) {
        if ($envContent -match $var) {
            Write-Host "  ✓ $var found" -ForegroundColor Green
        } else {
            $errors += "Missing environment variable: $var"
            Write-Host "  ✗ $var missing" -ForegroundColor Red
        }
    }
} else {
    $errors += ".env file does not exist"
    Write-Host "  ✗ .env file not found" -ForegroundColor Red
}

# Check 2: Supabase client
Write-Host "[2/8] Checking Supabase client..." -ForegroundColor Yellow
$clientFile = "src/integrations/supabase/client.ts"
if (Test-Path $clientFile) {
    $clientContent = Get-Content $clientFile -Raw
    if ($clientContent -match "persistSession.*false") {
        Write-Host "  ✓ persistSession: false configured" -ForegroundColor Green
    } else {
        $warnings += "Supabase client may not have persistSession: false"
        Write-Host "  ⚠ persistSession setting unclear" -ForegroundColor Yellow
    }
    if ($clientContent -match "import\.meta\.env") {
        Write-Host "  ✓ Using import.meta.env" -ForegroundColor Green
    } else {
        $errors += "Supabase client not using import.meta.env"
        Write-Host "  ✗ Not using import.meta.env" -ForegroundColor Red
    }
} else {
    $errors += "Supabase client file not found"
    Write-Host "  ✗ Client file not found" -ForegroundColor Red
}

# Check 3: Migration file
Write-Host "[3/8] Checking database migration..." -ForegroundColor Yellow
$migrationFile = "supabase/migrations/20250101000000_add_verification_notes.sql"
if (Test-Path $migrationFile) {
    Write-Host "  ✓ Migration file exists" -ForegroundColor Green
    $migrationContent = Get-Content $migrationFile -Raw
    if ($migrationContent -match "DO \$\$") {
        Write-Host "  ✓ Migration uses DO block (idempotent)" -ForegroundColor Green
    } else {
        $warnings += "Migration may not be idempotent"
        Write-Host "  ⚠ Migration may not be idempotent" -ForegroundColor Yellow
    }
} else {
    $errors += "Migration file not found"
    Write-Host "  ✗ Migration file not found" -ForegroundColor Red
}

# Check 4: No throwOnError
Write-Host "[4/8] Checking for throwOnError usage..." -ForegroundColor Yellow
$throwOnErrorFiles = Get-ChildItem -Path "src" -Recurse -Include "*.ts","*.tsx" | Select-String -Pattern "throwOnError" -List
if ($throwOnErrorFiles) {
    $errors += "Found throwOnError usage (should be removed)"
    Write-Host "  ✗ Found throwOnError usage" -ForegroundColor Red
    foreach ($file in $throwOnErrorFiles) {
        Write-Host "    - $($file.Path)" -ForegroundColor Red
    }
} else {
    Write-Host "  ✓ No throwOnError found" -ForegroundColor Green
}

# Check 5: Location input component
Write-Host "[5/8] Checking location input component..." -ForegroundColor Yellow
$locationFile = "src/components/LocationInput.tsx"
if (Test-Path $locationFile) {
    Write-Host "  ✓ LocationInput component exists" -ForegroundColor Green
} else {
    $warnings += "LocationInput component not found"
    Write-Host "  ⚠ LocationInput not found" -ForegroundColor Yellow
}

# Check 6: Vite cache cleared
Write-Host "[6/8] Checking Vite cache..." -ForegroundColor Yellow
if (Test-Path "node_modules/.vite") {
    $warnings += "Vite cache still exists (should be cleared)"
    Write-Host "  ⚠ Vite cache exists" -ForegroundColor Yellow
} else {
    Write-Host "  ✓ Vite cache cleared" -ForegroundColor Green
}

# Check 7: Package.json scripts
Write-Host "[7/8] Checking package.json scripts..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    $packageContent = Get-Content "package.json" -Raw
    if ($packageContent -match "refresh:types") {
        Write-Host "  ✓ refresh:types script exists" -ForegroundColor Green
    } else {
        $warnings += "refresh:types script not found"
        Write-Host "  ⚠ refresh:types script not found" -ForegroundColor Yellow
    }
} else {
    $errors += "package.json not found"
    Write-Host "  ✗ package.json not found" -ForegroundColor Red
}

# Check 8: Admin panel loading
Write-Host "[8/8] Checking admin panel..." -ForegroundColor Yellow
$adminFile = "src/pages/AdminPanel.tsx"
if (Test-Path $adminFile) {
    $adminContent = Get-Content $adminFile -Raw
    if ($adminContent -match "getSession") {
        Write-Host "  ✓ AdminPanel has session check" -ForegroundColor Green
    } else {
        $warnings += "AdminPanel may not have session check"
        Write-Host "  ⚠ Session check may be missing" -ForegroundColor Yellow
    }
} else {
    $errors += "AdminPanel not found"
    Write-Host "  ✗ AdminPanel not found" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "✓ All checks passed!" -ForegroundColor Green
    exit 0
} else {
    if ($errors.Count -gt 0) {
        Write-Host "✗ Errors found: $($errors.Count)" -ForegroundColor Red
        foreach ($error in $errors) {
            Write-Host "  - $error" -ForegroundColor Red
        }
    }
    if ($warnings.Count -gt 0) {
        Write-Host "⚠ Warnings: $($warnings.Count)" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "  - $warning" -ForegroundColor Yellow
        }
    }
    exit 1
}

