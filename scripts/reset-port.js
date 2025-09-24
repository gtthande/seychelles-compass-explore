#!/usr/bin/env node

const { exec, spawn } = require('child_process');
const os = require('os');

const platform = os.platform();
const isWindows = platform === 'win32';
const isMac = platform === 'darwin';
const isLinux = platform === 'linux';

console.log('🔧 Port Reset Script - Cross Platform');
console.log(`📱 Detected platform: ${platform}`);

function killPort5173() {
  return new Promise((resolve, reject) => {
    let command;
    
    if (isWindows) {
      // Windows command to kill processes on port 5173
      command = 'for /f "tokens=5" %a in (\'netstat -ano ^| findstr :5173 ^| findstr LISTENING\') do taskkill /PID %a /F';
    } else if (isMac || isLinux) {
      // Unix command to kill processes on port 5173
      command = 'lsof -ti:5173 | xargs kill -9';
    } else {
      reject(new Error(`Unsupported platform: ${platform}`));
      return;
    }

    console.log(`🚀 Running command: ${command}`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        // It's okay if no processes are found to kill
        if (error.message.includes('No such process') || 
            error.message.includes('not found') ||
            error.message.includes('No tasks are running')) {
          console.log('✅ No processes found on port 5173');
          resolve();
        } else {
          console.log(`⚠️ Warning: ${error.message}`);
          resolve(); // Continue anyway
        }
      } else {
        console.log('✅ Successfully killed processes on port 5173');
        if (stdout) console.log(stdout);
        resolve();
      }
    });
  });
}

function startDevServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting development server on port 5174...');
    
    const devServer = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd()
    });

    devServer.on('error', (error) => {
      console.error('❌ Failed to start dev server:', error);
      reject(error);
    });

    devServer.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Dev server stopped normally');
      } else {
        console.log(`⚠️ Dev server exited with code ${code}`);
      }
    });

    // Give the server a moment to start
    setTimeout(() => {
      console.log('✅ Development server should be running on http://localhost:5174');
      resolve();
    }, 3000);
  });
}

async function main() {
  try {
    console.log('🔄 Resetting port 5173 and starting fresh dev server...');
    
    // Kill any processes on port 5173
    await killPort5173();
    
    // Start the dev server
    await startDevServer();
    
    console.log('🎉 Port reset complete! Dev server running on port 5174');
    
  } catch (error) {
    console.error('❌ Port reset failed:', error);
    process.exit(1);
  }
}

// Run the script
main();
