const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.SYNC_SERVER_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to run shell commands and stream output
function runCommand(command, args = [], cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { 
      cwd, 
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, stdout, stderr });
      } else {
        reject({ success: false, stdout, stderr, code });
      }
    });
  });
}

// Git pull from GitHub
app.post('/api/sync/pull', async (req, res) => {
  try {
    console.log('🔄 Starting git pull...');
    const result = await runCommand('git', ['pull', 'origin', 'main']);
    
    res.json({
      success: true,
      message: 'Successfully pulled from GitHub',
      output: result.stdout
    });
  } catch (error) {
    console.error('❌ Git pull failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pull from GitHub',
      error: error.stderr || error.message
    });
  }
});

// Git push to GitHub
app.post('/api/sync/push', async (req, res) => {
  try {
    console.log('🔄 Starting git push...');
    
    // Stage all changes
    await runCommand('git', ['add', '.']);
    
    // Commit with message
    const commitMessage = req.body.message || 'Dev Sync: UI Sync';
    await runCommand('git', ['commit', '-m', commitMessage]);
    
    // Push to main
    const result = await runCommand('git', ['push', 'origin', 'main']);
    
    res.json({
      success: true,
      message: 'Successfully pushed to GitHub',
      output: result.stdout
    });
  } catch (error) {
    console.error('❌ Git push failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to push to GitHub',
      error: error.stderr || error.message
    });
  }
});

// Sync UI from local folder
app.post('/api/sync/sync-ui', async (req, res) => {
  try {
    console.log('🔄 Starting UI sync...');
    
    // This would sync from a local UI folder - placeholder implementation
    const result = await runCommand('echo', ['UI sync completed - placeholder implementation']);
    
    res.json({
      success: true,
      message: 'UI sync completed',
      output: result.stdout
    });
  } catch (error) {
    console.error('❌ UI sync failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync UI',
      error: error.stderr || error.message
    });
  }
});

// Push database migrations
app.post('/api/sync/migrate', async (req, res) => {
  try {
    console.log('🔄 Starting database migration...');
    
    // Check if supabase CLI is available
    try {
      await runCommand('npx', ['supabase', '--version']);
    } catch (error) {
      throw new Error('Supabase CLI not found. Please install it first.');
    }
    
    // Push migrations
    const result = await runCommand('npx', ['supabase', 'migration', 'push']);
    
    res.json({
      success: true,
      message: 'Database migrations pushed successfully',
      output: result.stdout
    });
  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to push database migrations',
      error: error.stderr || error.message
    });
  }
});

// Health check endpoint
app.get('/api/sync/health', (req, res) => {
  res.json({
    success: true,
    message: 'Sync server is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Sync server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/sync/health`);
});

module.exports = app;
