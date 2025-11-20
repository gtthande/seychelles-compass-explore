/**
 * Health Check Script
 * 
 * Verifies:
 * - Supabase reachable
 * - Auth endpoint reachable
 * - Admin exists
 * - Business count fetchable
 * 
 * Run with: tsx recovery/health-check.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Load .env file
const envPath = resolve(process.cwd(), '.env');
if (!existsSync(envPath)) {
  console.error('❌ .env file not found');
  process.exit(1);
}

const envContent = readFileSync(envPath, 'utf8');
const envVars: Record<string, string> = {};

envContent.split(/\r?\n/).forEach((line) => {
  line = line.trim();
  if (!line || line.startsWith('#')) return;
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    envVars[key] = value;
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function healthCheck() {
  console.log('🩺 Running iCompass Health Check...\n');

  let allHealthy = true;

  // 1. Check Supabase reachable
  try {
    const { data, error } = await supabase.from('businesses').select('id').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows, which is OK
      throw error;
    }
    console.log('✅ Supabase reachable');
  } catch (error: any) {
    console.error('❌ Supabase not reachable:', error.message);
    allHealthy = false;
  }

  // 2. Check Auth endpoint
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    console.log('✅ Auth endpoint reachable');
  } catch (error: any) {
    console.error('❌ Auth endpoint error:', error.message);
    allHealthy = false;
  }

  // 3. Check admin exists
  try {
    const serviceRoleKey = envVars.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    if (serviceRoleKey) {
      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
      
      const { data: users, error } = await adminClient.auth.admin.listUsers();
      if (error) throw error;
      
      const admin = users.users.find(u => u.email === 'gtthande@gmail.com');
      if (admin) {
        console.log('✅ Admin user exists');
      } else {
        console.warn('⚠️  Admin user not found (run: npm run seed:admin)');
      }
    } else {
      console.warn('⚠️  Cannot check admin (VITE_SUPABASE_SERVICE_ROLE_KEY missing)');
    }
  } catch (error: any) {
    console.warn('⚠️  Could not check admin:', error.message);
  }

  // 4. Check business count fetchable
  try {
    const { count, error } = await supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    console.log(`✅ Business count fetchable: ${count || 0} businesses`);
  } catch (error: any) {
    console.error('❌ Business count failed:', error.message);
    allHealthy = false;
  }

  console.log('\n' + '='.repeat(50));
  if (allHealthy) {
    console.log('✅ Health Check: PASSED');
    process.exit(0);
  } else {
    console.log('❌ Health Check: FAILED');
    process.exit(1);
  }
}

healthCheck();

