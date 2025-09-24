#!/usr/bin/env node

import { exec, spawn } from 'child_process';
import os from 'os';

const platform = os.platform();
const isWindows = platform === 'win32';
const isMac = platform === 'darwin';
const isLinux = platform === 'linux';

console.log('🔧 Port Reset Script - Cross Platform');
console.log(`📱 Detected platform: ${platform}`);

function killPort(port) {
  return new Promise((resolve, reject) => {
    let command;
    
    if (isWindows) {
      // Windows PowerShell command to kill processes on specific port
      command = `powershell -Command "try { Get-Process -Id (Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue).OwningProcess | Stop-Process -Force; Write-Host 'Killed processes on port ${port}' } catch { Write-Host 'No processes found on port ${port}' }"`;
    } else if (isMac || isLinux) {
      // Unix command to kill processes on specific port
      command = `lsof -ti:${port} | xargs kill -9 || true`;
    } else {
      reject(new Error(`Unsupported platform: ${platform}`));
      return;
    }

    console.log(`🚀 Checking port ${port}...`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        // It's okay if no processes are found to kill
        if (error.message.includes('No such process') || 
            error.message.includes('not found') ||
            error.message.includes('No tasks are running') ||
            error.message.includes('No processes found')) {
          console.log(`✅ No processes found on port ${port}`);
          resolve();
        } else {
          console.log(`⚠️ Warning for port ${port}: ${error.message}`);
          resolve(); // Continue anyway
        }
      } else {
        console.log(`✅ Successfully killed processes on port ${port}`);
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
    console.log('🔄 Resetting ports 5173 and 5174, starting fresh dev server...');
    
    // Kill any processes on both ports
    await killPort(5173);
    await killPort(5174);
    
    // Wait a moment for processes to fully terminate
    console.log('⏳ Waiting for processes to terminate...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
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
