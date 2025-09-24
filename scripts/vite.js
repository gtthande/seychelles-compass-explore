#!/usr/bin/env node

import { spawn } from 'child_process';

// Start Vite directly
const vite = spawn('npx', ['vite'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

vite.on('error', (error) => {
  console.error('Vite error:', error);
  process.exit(1);
});

vite.on('exit', (code) => {
  process.exit(code);
});
