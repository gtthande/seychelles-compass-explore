#!/usr/bin/env node

/**
 * Vite Recovery Script
 * Automatically recovers from Vite port refusal and cache corruption issues
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Vite Recovery Script Starting...');

// Step 1: Kill processes on port 5173
console.log('1️⃣ Killing processes on port 5173...');
try {
  execSync('npx kill-port 5173', { stdio: 'inherit' });
} catch (error) {
  console.log('   No processes found on port 5173');
}

// Step 2: Kill all Node processes
console.log('2️⃣ Killing all Node processes...');
try {
  execSync('taskkill /F /IM node.exe /T', { stdio: 'inherit' });
} catch (error) {
  console.log('   No Node processes found');
}

// Step 3: Clean Vite caches
console.log('3️⃣ Cleaning Vite caches...');
const cacheDirs = [
  'node_modules/.vite',
  '.vite',
  'dist',
  'node_modules'
];

cacheDirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`   ✅ Cleaned ${dir}`);
    } catch (error) {
      console.log(`   ⚠️  Could not clean ${dir}: ${error.message}`);
    }
  }
});

// Step 4: Clean npm cache
console.log('4️⃣ Cleaning npm cache...');
try {
  execSync('npm cache clean --force', { stdio: 'inherit' });
  console.log('   ✅ npm cache cleaned');
} catch (error) {
  console.log(`   ⚠️  npm cache clean failed: ${error.message}`);
}

// Step 5: Reinstall dependencies
console.log('5️⃣ Reinstalling dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('   ✅ Dependencies reinstalled');
} catch (error) {
  console.log(`   ❌ npm install failed: ${error.message}`);
  process.exit(1);
}

// Step 6: Start dev server
console.log('6️⃣ Starting dev server...');
try {
  const devProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });

  devProcess.on('error', (error) => {
    console.log(`   ❌ Failed to start dev server: ${error.message}`);
    process.exit(1);
  });

  // Wait a moment and check if server is running
  setTimeout(() => {
    try {
      const netstat = execSync('netstat -an | findstr :5173', { encoding: 'utf8' });
      if (netstat.includes('5173')) {
        console.log('   ✅ Dev server is running on port 5173');
        console.log('   🌐 Access your app at: http://localhost:5173');
        console.log('   🔒 Or HTTPS at: https://localhost:5173 (if enabled)');
      } else {
        console.log('   ⚠️  Dev server may not be running properly');
      }
    } catch (error) {
      console.log('   ⚠️  Could not verify server status');
    }
  }, 5000);

} catch (error) {
  console.log(`   ❌ Failed to start dev server: ${error.message}`);
  process.exit(1);
}

console.log('🎉 Vite recovery completed!');
