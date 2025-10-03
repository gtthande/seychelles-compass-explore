# Seychelles Compass Explore - Development Reset Utility
# This script kills processes on ports 5173/5174, clears caches, and restarts the dev server

Write-Host "Seychelles Compass Explore - Development Reset Utility" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Function to kill processes on specific ports
function Kill-PortProcess {
    param([int]$Port)
    
    Write-Host "Checking for processes on port $Port..." -ForegroundColor Yellow
    
    try {
        $processes = netstat -ano | findstr ":$Port"
        if ($processes) {
            Write-Host "Found processes on port $Port" -ForegroundColor Red
            $processes | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
            
            # Extract PIDs and kill them
            $processes | ForEach-Object {
                $parts = $_ -split '\s+'
                if ($parts.Length -gt 4) {
                    $processId = $parts[-1]
                    if ($processId -match '^\d+$') {
                        Write-Host "Killing process PID: $processId" -ForegroundColor Red
                        try {
                            taskkill /PID $processId /F 2>$null
                            Write-Host "Process $processId killed successfully" -ForegroundColor Green
                        } catch {
                            Write-Host "Could not kill process $processId (may not exist)" -ForegroundColor Yellow
                        }
                    }
                }
            }
        } else {
            Write-Host "No processes found on port $Port" -ForegroundColor Green
        }
    } catch {
        Write-Host "Error checking port $Port - $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Kill processes on ports 5173 and 5174
Write-Host "`nStep 1: Killing processes on development ports..." -ForegroundColor Cyan
Kill-PortProcess -Port 5173
Kill-PortProcess -Port 5174

# Clear cache directories
Write-Host "`nStep 2: Clearing cache directories..." -ForegroundColor Cyan

$cacheDirs = @(
    ".vite",
    "node_modules\.vite", 
    ".next",
    "dist",
    "build"
)

foreach ($dir in $cacheDirs) {
    if (Test-Path $dir) {
        Write-Host "Removing $dir..." -ForegroundColor Yellow
        try {
            Remove-Item -Path $dir -Recurse -Force -ErrorAction Stop
            Write-Host "Removed $dir successfully" -ForegroundColor Green
        } catch {
            Write-Host "Could not remove $dir - $($_.Exception.Message)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "$dir does not exist, skipping..." -ForegroundColor Gray
    }
}

# Clear npm cache
Write-Host "`nStep 3: Clearing npm cache..." -ForegroundColor Cyan
try {
    npm cache clean --force
    Write-Host "npm cache cleared successfully" -ForegroundColor Green
} catch {
    Write-Host "Could not clear npm cache - $($_.Exception.Message)" -ForegroundColor Yellow
}

# Wait a moment for processes to fully terminate
Write-Host "`nStep 4: Waiting for processes to terminate..." -ForegroundColor Cyan
Start-Sleep -Seconds 2

# Check if ports are now free
Write-Host "`nStep 5: Verifying ports are free..." -ForegroundColor Cyan
$portsFree = $true

foreach ($port in @(5173, 5174)) {
    $processes = netstat -ano | findstr ":$port"
    if ($processes) {
        Write-Host "Port $port is still in use" -ForegroundColor Red
        $processes | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
        $portsFree = $false
    } else {
        Write-Host "Port $port is now free" -ForegroundColor Green
    }
}

if (-not $portsFree) {
    Write-Host "`nSome ports are still in use. You may need to manually kill processes or restart your system." -ForegroundColor Red
    Write-Host "Continuing with dev server startup anyway..." -ForegroundColor Yellow
}

# Start the development server
Write-Host "`nStep 6: Starting development server..." -ForegroundColor Cyan
Write-Host "Running: npm run dev" -ForegroundColor Gray

try {
    # Start the dev server in the background
    $npmPath = Get-Command npm -ErrorAction SilentlyContinue
    if ($npmPath) {
        Start-Process -FilePath $npmPath.Source -ArgumentList "run", "dev" -NoNewWindow -PassThru
        Write-Host "Development server started successfully!" -ForegroundColor Green
        Write-Host "`nYour application should be available at:" -ForegroundColor Cyan
        Write-Host "   • http://localhost:5173/" -ForegroundColor White
        Write-Host "   • http://localhost:5173/admin (Admin Panel)" -ForegroundColor White
        Write-Host "   • http://localhost:5173/directory (Business Directory)" -ForegroundColor White
    } else {
        Write-Host "npm not found in PATH. Please run 'npm run dev' manually." -ForegroundColor Red
    }
} catch {
    Write-Host "Failed to start development server - $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please try running 'npm run dev' manually." -ForegroundColor Yellow
}

Write-Host "`nReset complete! Development environment should be clean and running." -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan
