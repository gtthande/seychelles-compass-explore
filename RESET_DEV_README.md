# Development Reset Utilities

This project includes several utilities to reset the development environment when ports get stuck or caches become corrupted.

## Available Reset Commands

### 1. PowerShell Script (Recommended for Windows)
```bash
npm run reset
```
- **File**: `reset-dev.ps1`
- **Features**: Full PowerShell script with detailed logging and error handling
- **Best for**: Windows users who want comprehensive output and error handling

### 2. Node.js Script (Cross-platform)
```bash
npm run reset:node
```
- **File**: `scripts/reset-dev.js`
- **Features**: Cross-platform Node.js script that works on Windows, macOS, and Linux
- **Best for**: Cross-platform development or when PowerShell isn't available

### 3. Batch File (Simple Windows)
```bash
npm run reset:bat
```
- **File**: `reset-dev.bat`
- **Features**: Simple Windows batch file
- **Best for**: Quick and simple Windows reset

## What These Scripts Do

### 🔪 Process Management
- Kills any processes running on ports **5173** and **5174**
- Uses platform-specific commands (`netstat`/`taskkill` on Windows, `lsof`/`kill` on Unix)
- Provides detailed feedback about which processes were terminated

### 🧹 Cache Clearing
- Removes `.vite` directory (Vite cache)
- Removes `node_modules/.vite` directory (Vite dependencies cache)
- Removes `.next` directory (Next.js cache, if present)
- Removes `dist` and `build` directories (build outputs)
- Clears npm cache with `npm cache clean --force`

### 🚀 Development Server
- Automatically starts the development server with `npm run dev`
- Provides URLs for easy access:
  - **Main App**: http://localhost:5173/
  - **Admin Panel**: http://localhost:5173/admin
  - **Business Directory**: http://localhost:5173/directory

## Usage Examples

### Quick Reset (PowerShell)
```bash
npm run reset
```

### Cross-platform Reset
```bash
npm run reset:node
```

### Simple Windows Reset
```bash
npm run reset:bat
```

### Manual Reset (if scripts fail)
```bash
# Kill processes manually
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Clear caches manually
rmdir /s /q .vite
rmdir /s /q node_modules\.vite
npm cache clean --force

# Start dev server
npm run dev
```

## Troubleshooting

### PowerShell Execution Policy Error
If you get a PowerShell execution policy error, run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Port Still in Use
If ports are still in use after running the reset:
1. Check for other development servers running
2. Restart your terminal/command prompt
3. Restart your computer if necessary

### Cache Issues Persist
If cache issues persist:
1. Delete `node_modules` folder
2. Run `npm install`
3. Run the reset script again

## File Structure

```
seychelles-compass-explore/
├── reset-dev.ps1          # PowerShell reset script
├── reset-dev.bat          # Windows batch reset script
├── scripts/
│   └── reset-dev.js       # Node.js cross-platform reset script
└── package.json           # Contains npm scripts
```

## Script Features

### PowerShell Script (`reset-dev.ps1`)
- ✅ Detailed colored output
- ✅ Error handling and recovery
- ✅ Process verification
- ✅ Automatic dev server startup
- ✅ URL display for easy access

### Node.js Script (`scripts/reset-dev.js`)
- ✅ Cross-platform compatibility
- ✅ Async/await for better error handling
- ✅ Process management
- ✅ Graceful shutdown handling
- ✅ Works on Windows, macOS, and Linux

### Batch Script (`reset-dev.bat`)
- ✅ Simple and lightweight
- ✅ No dependencies
- ✅ Quick execution
- ✅ Windows-native

## When to Use Reset Utilities

Use these utilities when you encounter:
- **Port conflicts**: "Port 5173 is already in use"
- **Cache issues**: Stale or corrupted Vite cache
- **Hanging processes**: Development server not responding
- **Build errors**: Strange build or compilation errors
- **Hot reload issues**: Changes not reflecting in browser
- **Memory issues**: High memory usage from cached files

## Best Practices

1. **Try the simple approach first**: `npm run reset`
2. **Use cross-platform for teams**: `npm run reset:node`
3. **Keep scripts updated**: Update scripts when adding new cache directories
4. **Monitor output**: Check console output for any errors
5. **Verify results**: Ensure ports are free and dev server starts correctly

## Integration with Development Workflow

These reset utilities integrate seamlessly with your development workflow:

```bash
# Start development
npm run dev

# If issues occur, reset and restart
npm run reset

# For full development with sync
npm run dev:full

# If sync issues occur, reset and restart
npm run reset
```

The reset utilities ensure a clean development environment every time! 🚀
