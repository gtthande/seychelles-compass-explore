#!/usr/bin/env node

/**
 * Simple Fallback Mode Test
 * Focus on core functionality without service key dependencies
 */

import fs from 'fs';
import path from 'path';

// Load environment variables from .env file
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key] = valueParts.join('=');
    }
  });
}

console.log('🔍 SIMPLE FALLBACK MODE TEST');
console.log('=============================');
console.log('Testing core functionality...\n');

let allChecksPassed = true;

// 1. Check App.tsx is using AdminPanel (not AdminPanelFallback)
console.log('1️⃣ Frontend Configuration:');
console.log('-----------------------------');

const appTsxPath = path.join(process.cwd(), 'src/App.tsx');
if (fs.existsSync(appTsxPath)) {
  const appContent = fs.readFileSync(appTsxPath, 'utf8');
  
  // Check if the routes are using AdminPanel (not AdminPanelFallback)
  if (appContent.includes('<AdminPanelFallback />')) {
    console.log('❌ App.tsx is still using AdminPanelFallback in routes');
    console.log('   This indicates the system is still in fallback mode');
    allChecksPassed = false;
  } else if (appContent.includes('<AdminPanel />')) {
    console.log('✅ App.tsx is using AdminPanel in routes (not fallback)');
  } else {
    console.log('⚠️  Could not determine which admin panel is being used in routes');
  }
} else {
  console.log('❌ App.tsx not found');
  allChecksPassed = false;
}

// 2. Check environment variables
console.log('\n2️⃣ Environment Variables:');
console.log('----------------------------');

const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_GOOGLE_MAPS_API_KEY',
  'VITE_SITE_URL'
];

for (const envVar of requiredEnvVars) {
  const value = process.env[envVar];
  if (value) {
    console.log(`✅ ${envVar}: ${envVar.includes('KEY') ? value.substring(0, 10) + '...' : value}`);
  } else {
    console.log(`❌ ${envVar}: Missing`);
    allChecksPassed = false;
  }
}

// 3. Check if AdminPanelFallback component exists (should not be used)
console.log('\n3️⃣ Component Structure:');
console.log('-------------------------');

const adminPanelPath = path.join(process.cwd(), 'src/pages/AdminPanel.tsx');
const adminPanelFallbackPath = path.join(process.cwd(), 'src/pages/AdminPanelFallback.tsx');

if (fs.existsSync(adminPanelPath)) {
  console.log('✅ AdminPanel.tsx exists (full functionality)');
} else {
  console.log('❌ AdminPanel.tsx not found');
  allChecksPassed = false;
}

if (fs.existsSync(adminPanelFallbackPath)) {
  console.log('⚠️  AdminPanelFallback.tsx exists (fallback mode component)');
  console.log('   This is normal - it exists as a backup but should not be used');
} else {
  console.log('❌ AdminPanelFallback.tsx not found');
}

// 4. Check imports in App.tsx
console.log('\n4️⃣ Import Analysis:');
console.log('---------------------');

if (fs.existsSync(appTsxPath)) {
  const appContent = fs.readFileSync(appTsxPath, 'utf8');
  
  if (appContent.includes('import AdminPanel from "./pages/AdminPanel"')) {
    console.log('✅ AdminPanel is imported');
  } else {
    console.log('❌ AdminPanel is not imported');
    allChecksPassed = false;
  }
  
  if (appContent.includes('import AdminPanelFallback from "./pages/AdminPanelFallback"')) {
    console.log('⚠️  AdminPanelFallback is imported (but should not be used)');
  } else {
    console.log('✅ AdminPanelFallback is not imported');
  }
}

// 5. Summary
console.log('\n📊 FALLBACK MODE TEST SUMMARY');
console.log('==============================');

if (allChecksPassed) {
  console.log('🎉 SUCCESS: System has exited fallback mode!');
  console.log('✅ App.tsx is using AdminPanel (not fallback)');
  console.log('✅ Environment variables are properly configured');
  console.log('✅ Core components are in place');
  console.log('\n🚀 The system is ready for full operation!');
  console.log('\n📝 Next Steps:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. Navigate to: http://localhost:5173/admin');
  console.log('3. Test admin login with: gtthande@gmail.com');
  console.log('4. Verify full admin functionality is available');
} else {
  console.log('❌ FAILURE: System is still in fallback mode');
  console.log('⚠️  Some components are not properly configured');
  console.log('🔧 Please review the failed checks above');
}

process.exit(allChecksPassed ? 0 : 1);
