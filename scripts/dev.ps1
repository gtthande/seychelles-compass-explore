Write-Host "🔧 Checking port 5173..."
$port = 5173
try {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "⛔ Port in use. Terminating process..."
        Get-Process -Id $process.OwningProcess | Stop-Process -Force
    }
} catch {
    Write-Host "⚠️  Could not check port (this is okay)"
}

Write-Host "🧹 Clearing Vite cache..."
Remove-Item -Recurse -Force .\.vite, .\node_modules\.vite -ErrorAction SilentlyContinue

Write-Host "🚀 Starting Vite Dev Server..."
npm exec vite -- --host --open
