# PowerShell script to safely start the Vite development server
# This script kills any process using port 5173 before starting the dev server

Write-Host "🚀 Starting Seychelles Compass Development Server..." -ForegroundColor Green
Write-Host ""

# Step 1: Check for processes using port 5173
Write-Host "🔍 Checking for process on port 5173..." -ForegroundColor Yellow

try {
    # Get the process ID using port 5173
    $netstatOutput = netstat -ano | Select-String ":5173.*LISTENING"
    
    if ($netstatOutput) {
        # Extract PID from netstat output
        $pid = ($netstatOutput -split '\s+')[-1]
        
        if ($pid -and $pid -match '^\d+$') {
            Write-Host "⚠️  Found process with PID $pid using port 5173" -ForegroundColor Red
            Write-Host "🔪 Killing PID $pid on port 5173..." -ForegroundColor Yellow
            
            # Kill the process
            $killResult = taskkill /PID $pid /F 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Successfully killed PID $pid on port 5173" -ForegroundColor Green
            } else {
                Write-Host "❌ Failed to kill PID $pid: $killResult" -ForegroundColor Red
                Write-Host "⚠️  Continuing anyway..." -ForegroundColor Yellow
            }
        } else {
            Write-Host "⚠️  Could not extract valid PID from netstat output" -ForegroundColor Yellow
        }
    } else {
        Write-Host "✅ No process found on port 5173" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Error checking port 5173: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "⚠️  Continuing anyway..." -ForegroundColor Yellow
}

Write-Host ""

# Step 2: Start the development server
Write-Host "🎯 Starting Vite dev server on port 5173..." -ForegroundColor Cyan
Write-Host ""

try {
    # Run npm run dev
    npm run dev
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "❌ Failed to start development server" -ForegroundColor Red
        Write-Host "💡 Try running 'npm install' first to ensure dependencies are installed" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error starting development server: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Make sure Node.js and npm are installed and accessible" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🎉 Development server should now be running at http://localhost:5173" -ForegroundColor Green
