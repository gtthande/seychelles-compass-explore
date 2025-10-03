#!/usr/bin/env node

/**
 * Seychelles Compass Explore - Development Reset Utility (Node.js)
 * Cross-platform script to kill processes, clear caches, and restart dev server
 */

import { exec, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

console.log('Seychelles Compass Explore - Development Reset Utility');
console.log('=================================================');

// Function to execute shell commands
function execCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`${description}...`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(`${description} failed: ${error.message}`);
        resolve(false);
      } else {
        console.log(`${description} completed`);
        resolve(true);
      }
    });
  });
}

// Function to kill processes on specific ports
async function killPortProcesses(ports) {
  const platform = os.platform();
  
  for (const port of ports) {
    console.log(`Checking for processes on port ${port}...`);
    
    try {
      let command;
      if (platform === 'win32') {
        // Windows
        command = `netstat -ano | findstr ":${port}"`;
      } else {
        // Unix/Linux/macOS
        command = `lsof -ti:${port}`;
      }
      
      const result = await new Promise((resolve) => {
        exec(command, (error, stdout, stderr) => {
          if (stdout.trim()) {
            resolve(stdout.trim());
          } else {
            resolve(null);
          }
        });
      });
      
      if (result) {
        console.log(`Found processes on port ${port}`);
        
        if (platform === 'win32') {
          // Extract PIDs from netstat output and kill them
          const lines = result.split('\n');
          for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts.length > 4) {
              const pid = parts[parts.length - 1];
              if (/^\d+$/.test(pid)) {
                console.log(`Killing process PID: ${pid}`);
                await execCommand(`taskkill /PID ${pid} /F`, `Kill process ${pid}`);
              }
            }
          }
        } else {
          // Unix/Linux/macOS - kill processes directly
          const pids = result.split('\n').filter(pid => /^\d+$/.test(pid));
          for (const pid of pids) {
            console.log(`Killing process PID: ${pid}`);
            await execCommand(`kill -9 ${pid}`, `Kill process ${pid}`);
          }
        }
      } else {
        console.log(`No processes found on port ${port}`);
      }
    } catch (error) {
      console.log(`Error checking port ${port}: ${error.message}`);
    }
  }
}

// Function to clear cache directories
async function clearCacheDirectories() {
  console.log('Clearing cache directories...');
  
  const cacheDirs = [
    '.vite',
    'node_modules/.vite',
    '.next',
    'dist',
    'build'
  ];
  
  for (const dir of cacheDirs) {
    if (fs.existsSync(dir)) {
      console.log(`Removing ${dir}...`);
      try {
        if (fs.statSync(dir).isDirectory()) {
          fs.rmSync(dir, { recursive: true, force: true });
        } else {
          fs.unlinkSync(dir);
        }
        console.log(`Removed ${dir} successfully`);
      } catch (error) {
        console.log(`Could not remove ${dir}: ${error.message}`);
      }
    } else {
      console.log(`${dir} does not exist, skipping...`);
    }
  }
}

// Function to clear npm cache
async function clearNpmCache() {
  console.log('Clearing npm cache...');
  await execCommand('npm cache clean --force', 'Clear npm cache');
}

// Function to start development server
function startDevServer() {
  console.log('Starting development server...');
  console.log('Running: npm run dev');
  
  const child = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });
  
  child.on('error', (error) => {
    console.log(`Failed to start development server: ${error.message}`);
    console.log('Please try running "npm run dev" manually.');
  });
  
  child.on('spawn', () => {
    console.log('Development server started successfully!');
    console.log('\nYour application should be available at:');
    console.log('   • http://localhost:5173/');
    console.log('   • http://localhost:5173/admin (Admin Panel)');
    console.log('   • http://localhost:5173/directory (Business Directory)');
  });
  
  return child;
}

// Main execution
async function main() {
  try {
    // Step 1: Kill processes on ports 5173 and 5174
    console.log('\nStep 1: Killing processes on development ports...');
    await killPortProcesses([5173, 5174]);
    
    // Step 2: Clear cache directories
    console.log('\nStep 2: Clearing cache directories...');
    await clearCacheDirectories();
    
    // Step 3: Clear npm cache
    console.log('\nStep 3: Clearing npm cache...');
    await clearNpmCache();
    
    // Step 4: Wait for processes to terminate
    console.log('\nStep 4: Waiting for processes to terminate...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 5: Verify ports are free
    console.log('\nStep 5: Verifying ports are free...');
    await killPortProcesses([5173, 5174]);
    
    // Step 6: Start development server
    console.log('\nStep 6: Starting development server...');
    const devServer = startDevServer();
    
    console.log('\nReset complete! Development environment should be clean and running.');
    console.log('=================================================');
    
    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\nShutting down development server...');
      devServer.kill('SIGINT');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Reset failed:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();
