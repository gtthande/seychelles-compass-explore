$port = 5173
$connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($connection) {
    $processId = $connection.OwningProcess
    if ($processId -and $processId -ne 0) {
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "Killing process on port $port (PID: $processId)"
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            Start-Sleep -Milliseconds 500
        }
    } else {
        Write-Host "Port $port is in use by system process (cannot kill)"
    }
} else {
    Write-Host "Port $port is free"
}

