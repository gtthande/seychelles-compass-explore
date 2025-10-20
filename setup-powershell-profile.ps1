# ==============================================
# 🧭 PowerShell Profile Setup for Compass Explorer
# ==============================================

Write-Host "`n🔧 Setting up PowerShell profile for Compass Explorer..." -ForegroundColor Yellow

# Get the current PowerShell profile path
$profilePath = $PROFILE

# Check if profile exists
if (-not (Test-Path $profilePath)) {
    Write-Host "📝 Creating PowerShell profile..." -ForegroundColor Yellow
    New-Item -Path $profilePath -ItemType File -Force | Out-Null
}

# Add Compass Explorer functions to profile
$compassFunctions = @"

# ==============================================
# 🧭 Compass Explorer Development Functions
# ==============================================

function reset-compass {
    & "E:\Projects\Cursor\seychelles-compass-explore\reset-dev.ps1" -Mode "interactive"
}

function clean-compass {
    & "E:\Projects\Cursor\seychelles-compass-explore\reset-dev.ps1" -Mode "clean"
}

function restart-compass {
    & "E:\Projects\Cursor\seychelles-compass-explore\reset-dev.ps1" -Mode "restart"
}

function full-reset-compass {
    & "E:\Projects\Cursor\seychelles-compass-explore\reset-dev.ps1" -Mode "full"
}

function check-compass-db {
    & "E:\Projects\Cursor\seychelles-compass-explore\reset-dev.ps1" -Mode "database"
}

# Quick navigation to project
function goto-compass {
    Set-Location "E:\Projects\Cursor\seychelles-compass-explore"
    Write-Host "📁 Navigated to Compass Explorer project" -ForegroundColor Green
}

# Show available commands
function compass-help {
    Write-Host "`n🧭 Compass Explorer Commands:" -ForegroundColor Cyan
    Write-Host "reset-compass      - Interactive recovery menu" -ForegroundColor White
    Write-Host "clean-compass      - Clean caches only" -ForegroundColor White
    Write-Host "restart-compass     - Restart dev server only" -ForegroundColor White
    Write-Host "full-reset-compass - Full reset (clean + reinstall + restart)" -ForegroundColor White
    Write-Host "check-compass-db    - Check database sync status" -ForegroundColor White
    Write-Host "goto-compass        - Navigate to project directory" -ForegroundColor White
    Write-Host "compass-help        - Show this help" -ForegroundColor White
}

"@

# Check if functions already exist
$profileContent = Get-Content $profilePath -Raw -ErrorAction SilentlyContinue
if ($profileContent -notmatch "reset-compass") {
    Write-Host "📝 Adding Compass Explorer functions to profile..." -ForegroundColor Yellow
    Add-Content -Path $profilePath -Value $compassFunctions
    Write-Host "✅ Functions added to PowerShell profile" -ForegroundColor Green
} else {
    Write-Host "✅ Compass Explorer functions already in profile" -ForegroundColor Green
}

Write-Host "`n🎯 Setup complete! You can now use:" -ForegroundColor Green
Write-Host "• reset-compass      - Interactive recovery menu" -ForegroundColor White
Write-Host "• clean-compass      - Clean caches only" -ForegroundColor White
Write-Host "• restart-compass    - Restart dev server only" -ForegroundColor White
Write-Host "• full-reset-compass - Full reset" -ForegroundColor White
Write-Host "• check-compass-db   - Check database sync" -ForegroundColor White
Write-Host "• compass-help       - Show all commands" -ForegroundColor White

Write-Host "`n💡 To reload your profile, run: . `$PROFILE" -ForegroundColor Yellow
Write-Host "Or restart PowerShell to use the new functions." -ForegroundColor Yellow
