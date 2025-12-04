$port = 5173

$connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

if ($connection) {
    $procId = $connection.OwningProcess   # <-- FIXED: was $PID (read-only)

    Write-Host "Killing process on port $port (PID: $procId)..."
    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
} else {
    Write-Host "No process running on port $port"
}

