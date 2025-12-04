# Open Supabase SQL Editor with migration ready to paste
$migrationFile = "supabase\migrations\20250125000001_ensure_public_read_access.sql"
$sqlContent = Get-Content $migrationFile -Raw
$sqlContent | Set-Clipboard
Write-Host "Migration SQL copied to clipboard!" -ForegroundColor Green
Write-Host ""
Write-Host "Opening Supabase Dashboard..." -ForegroundColor Cyan
Start-Process "https://supabase.com/dashboard/project/bwlmlniotyrjttglbjrl/sql/new"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. SQL is already in your clipboard" -ForegroundColor White
Write-Host "2. Paste (Ctrl+V) in the SQL Editor" -ForegroundColor White
Write-Host "3. Click the Run button" -ForegroundColor White
