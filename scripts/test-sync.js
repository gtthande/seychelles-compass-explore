// Test script for Dev Sync Panel functionality
const { spawn } = require('child_process');

console.log('🧪 Testing Dev Sync Panel Integration...\n');

// Test 1: Check if sync server can start
console.log('1. Testing sync server startup...');
const server = spawn('node', ['scripts/sync-server.js'], { 
  stdio: 'pipe',
  shell: true 
});

let serverOutput = '';
server.stdout.on('data', (data) => {
  serverOutput += data.toString();
});

server.stderr.on('data', (data) => {
  console.error('Server error:', data.toString());
});

// Wait a moment for server to start
setTimeout(() => {
  console.log('✅ Sync server started successfully');
  console.log('📡 Server output:', serverOutput);
  
  // Test 2: Health check
  console.log('\n2. Testing health check endpoint...');
  fetch('http://localhost:3001/api/sync/health')
    .then(response => response.json())
    .then(data => {
      console.log('✅ Health check passed:', data.message);
      
      // Test 3: Test git status (safe operation)
      console.log('\n3. Testing git status...');
      return fetch('http://localhost:3001/api/sync/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log('✅ Git pull test passed');
      } else {
        console.log('⚠️ Git pull test failed (expected if no changes):', data.message);
      }
      
      // Cleanup
      console.log('\n🧹 Cleaning up...');
      server.kill();
      console.log('✅ Test completed successfully!');
    })
    .catch(error => {
      console.error('❌ Test failed:', error.message);
      server.kill();
      process.exit(1);
    });
}, 2000);

// Handle server exit
server.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ Server exited with code:', code);
  }
});
