# Backup Supabase Database
# Exports the entire Supabase DB to a local SQL file
# Requires: Supabase CLI installed and logged in

param(
    [string]$OutputFile = "backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').sql"
)

$ProjectId = "bwlmlniotyrjttglbjrl"
$OutputPath = Join-Path $PSScriptRoot ".." $OutputFile

Write-Host "📦 Backing up Supabase database..."
Write-Host "   Project ID: $ProjectId"
Write-Host "   Output: $OutputPath`n"

try {
    # Use Supabase CLI to dump database
    $dumpCommand = "supabase db dump --project-id $ProjectId --data-only"
    $dumpOutput = Invoke-Expression $dumpCommand 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        $dumpOutput | Out-File -FilePath $OutputPath -Encoding UTF8
        Write-Host "✅ Backup created successfully: $OutputFile"
        Write-Host "   Size: $((Get-Item $OutputPath).Length / 1KB) KB`n"
    } else {
        Write-Host "❌ Backup failed. Error:"
        Write-Host $dumpOutput
        Write-Host "`n💡 Alternative: Use Supabase Dashboard → Database → Backups"
        exit 1
    }
} catch {
    Write-Host "❌ Error during backup: $_"
    Write-Host "`n💡 Make sure Supabase CLI is installed: npm install -g supabase"
    Write-Host "   Then login: supabase login"
    exit 1
}

