Write-Host "-------------------------------------------"
Write-Host "   iCompass LAN Fix Script (Vite 5173)"
Write-Host "-------------------------------------------`n"

# 1. Kill anything using port 5173
Write-Host "Checking port 5173..."
$portCheck = netstat -ano | Select-String ":5173"

if ($portCheck) {
    Write-Host "Port 5173 is in use. Killing process..."
    $pid = ($portCheck -split "\s+")[-1]
    taskkill /PID $pid /F
    Write-Host "✔ Process $pid terminated."
} else {
    Write-Host "✔ Port 5173 is free."
}

# 2. Ensure the firewall allows it
Write-Host "`nAdding firewall rule (ignore errors if it already exists)..."
netsh advfirewall firewall add rule name="Vite Dev Server 5173" dir=in action=allow protocol=TCP localport=5173 | Out-Null
Write-Host "✔ Firewall rule confirmed."

# 3. Start the LAN-enabled Vite server
Write-Host "`nStarting Vite on LAN (0.0.0.0)..."

# Launch Vite with LAN support
npm run dev -- --host

Write-Host "`n-------------------------------------------"
Write-Host "   ✔ Vite Dev Server Started"
Write-Host "   Your local address:"
Write-Host "   → http://localhost:5173"
Write-Host "-------------------------------------------"

# Auto-open browser (optional)
Start-Process "http://localhost:5173"
