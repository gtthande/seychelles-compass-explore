param()

Write-Host "⛔ Killing port 5173 if busy..."
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "📦 Starting Vite on 0.0.0.0:5173 ..."
npm run dev:vite
