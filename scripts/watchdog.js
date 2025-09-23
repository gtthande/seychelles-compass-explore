#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class DevServerWatchdog {
  constructor() {
    this.viteProcess = null;
    this.isShuttingDown = false;
    this.restartCount = 0;
    this.maxRestarts = 10;
    this.restartDelay = 2000;
    this.port = 5173;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : '✅';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async killProcessOnPort(port) {
    return new Promise((resolve) => {
      this.log(`Checking for processes on port ${port}...`);
      
      // Use netstat to find processes on the port
      exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
        if (error || !stdout.trim()) {
          this.log(`No processes found on port ${port}`);
          resolve();
          return;
        }

        const lines = stdout.trim().split('\n');
        const pids = new Set();
        
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 5) {
            const pid = parts[parts.length - 1];
            if (pid && pid !== '0') {
              pids.add(pid);
            }
          }
        });

        if (pids.size === 0) {
          this.log(`No valid PIDs found on port ${port}`);
          resolve();
          return;
        }

        this.log(`Found ${pids.size} process(es) on port ${port}: ${Array.from(pids).join(', ')}`);
        
        let killedCount = 0;
        const totalPids = pids.size;
        
        pids.forEach(pid => {
          exec(`taskkill /PID ${pid} /F`, (killError) => {
            if (killError) {
              this.log(`Failed to kill PID ${pid}: ${killError.message}`, 'warn');
            } else {
              this.log(`Successfully killed PID ${pid}`, 'info');
            }
            
            killedCount++;
            if (killedCount === totalPids) {
              this.log(`Port ${port} cleanup completed`);
              resolve();
            }
          });
        });
      });
    });
  }

  async startViteServer() {
    return new Promise((resolve, reject) => {
      this.log('Starting Vite development server...');
      
      this.viteProcess = spawn('npm', ['run', 'vite'], {
        stdio: 'inherit',
        shell: true,
        cwd: process.cwd()
      });

      this.viteProcess.on('error', (error) => {
        this.log(`Vite process error: ${error.message}`, 'error');
        reject(error);
      });

      this.viteProcess.on('exit', (code, signal) => {
        if (!this.isShuttingDown) {
          this.log(`Vite process exited with code ${code}, signal ${signal}`, 'warn');
          this.handleViteExit();
        }
      });

      // Give Vite a moment to start
      setTimeout(() => {
        this.log('Vite server startup initiated');
        resolve();
      }, 1000);
    });
  }

  async handleViteExit() {
    if (this.restartCount >= this.maxRestarts) {
      this.log(`Maximum restart attempts (${this.maxRestarts}) reached. Stopping watchdog.`, 'error');
      process.exit(1);
    }

    this.restartCount++;
    this.log(`Restarting Vite server (attempt ${this.restartCount}/${this.maxRestarts})...`);
    
    await new Promise(resolve => setTimeout(resolve, this.restartDelay));
    
    try {
      await this.killProcessOnPort(this.port);
      await this.startViteServer();
    } catch (error) {
      this.log(`Failed to restart Vite: ${error.message}`, 'error');
      this.handleViteExit();
    }
  }

  async start() {
    this.log('🚀 Starting Dev Server Watchdog');
    this.log(`Watching port ${this.port} for Vite development server`);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      this.log('Received SIGINT, shutting down gracefully...');
      this.shutdown();
    });

    process.on('SIGTERM', () => {
      this.log('Received SIGTERM, shutting down gracefully...');
      this.shutdown();
    });

    try {
      // Kill any existing processes on the port
      await this.killProcessOnPort(this.port);
      
      // Start Vite server
      await this.startViteServer();
      
      this.log('✅ Dev Server Watchdog is now active');
      this.log('📡 Vite server should be running on http://localhost:5173');
      this.log('🔄 Auto-restart enabled - server will restart if it crashes');
      
    } catch (error) {
      this.log(`Failed to start watchdog: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  shutdown() {
    this.isShuttingDown = true;
    this.log('Shutting down watchdog...');
    
    if (this.viteProcess) {
      this.viteProcess.kill('SIGTERM');
      this.log('Vite process terminated');
    }
    
    process.exit(0);
  }
}

// Start the watchdog
const watchdog = new DevServerWatchdog();
watchdog.start().catch(error => {
  console.error('Watchdog failed to start:', error);
  process.exit(1);
});
