Write-Host "Stopping port 5173..."
powershell -ExecutionPolicy Bypass -File ./scripts/kill-port.ps1

Write-Host "Clearing Vite cache..."
if (Test-Path "node_modules/.vite") {
    Remove-Item -Recurse -Force "node_modules/.vite"
}

Write-Host "Reinstalling dependencies..."
npm install

Write-Host "Starting dev server..."
npm run dev

