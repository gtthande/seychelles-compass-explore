# Restore Supabase Database
# Restores a SQL file into Supabase using Supabase CLI
# WARNING: This will overwrite existing data

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

$ProjectId = "bwlmlniotyrjttglbjrl"
$BackupPath = Join-Path $PSScriptRoot ".." $BackupFile

if (-not (Test-Path $BackupPath)) {
    Write-Host "❌ Backup file not found: $BackupPath"
    exit 1
}

Write-Host "⚠️  WARNING: This will overwrite existing data in Supabase!"
Write-Host "   Project ID: $ProjectId"
Write-Host "   Backup file: $BackupFile`n"

$confirm = Read-Host "Type 'yes' to continue"
if ($confirm -ne 'yes') {
    Write-Host "Restore cancelled."
    exit 0
}

Write-Host "`n🔄 Restoring database..."

try {
    # Read backup file and execute via Supabase CLI
    $sqlContent = Get-Content $BackupPath -Raw
    
    # Use Supabase CLI to execute SQL
    $restoreCommand = "supabase db execute --project-id $ProjectId"
    $sqlContent | & $restoreCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database restored successfully`n"
    } else {
        Write-Host "❌ Restore failed. Check Supabase Dashboard for errors."
        exit 1
    }
} catch {
    Write-Host "❌ Error during restore: $_"
    Write-Host "`n💡 Alternative: Use Supabase Dashboard → SQL Editor → Paste SQL"
    exit 1
}

