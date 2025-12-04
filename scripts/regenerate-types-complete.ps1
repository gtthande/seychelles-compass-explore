# Regenerate Supabase TypeScript Types
# This script regenerates types from the current database schema

$projectId = "bwlmlniotyrjttglbjrl"
$outputFile = "src/types/supabase.ts"

Write-Host "🔄 Regenerating Supabase TypeScript types..."
Write-Host "   Project ID: $projectId"
Write-Host "   Output: $outputFile`n"

try {
    # Check if supabase CLI is available
    $supabaseCheck = Get-Command supabase -ErrorAction SilentlyContinue
    if (-not $supabaseCheck) {
        Write-Host "❌ Supabase CLI not found. Installing..."
        npm install -g supabase
    }

    # Generate types
    Write-Host "📝 Generating types from Supabase..."
    npx supabase gen types typescript --project-id $projectId --schema public > $outputFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Types regenerated successfully: $outputFile"
        Write-Host "   File size: $((Get-Item $outputFile).Length / 1KB) KB`n"
    } else {
        Write-Host "❌ Type generation failed. Exit code: $LASTEXITCODE"
        Write-Host "💡 Make sure you're logged in: npx supabase login"
        exit 1
    }
} catch {
    Write-Host "❌ Error during type generation: $_"
    Write-Host "`n💡 Alternative: Use Supabase Dashboard → API → Generate Types"
    exit 1
}

