/**
 * Ensure Admin User Script
 * 
 * This script ensures the admin user exists in Supabase auth with the correct credentials.
 * Uses the service role key (server-side only) to create/update the admin user.
 * 
 * Run with: npm run seed:admin
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Load .env file manually (no dotenv dependency)
const envPath = resolve(process.cwd(), '.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf8');
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
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error('❌ VITE_SUPABASE_URL is missing from .env');
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is missing from .env');
  console.error('   This key should only be used in server-side scripts, never in frontend code.');
  process.exit(1);
}

// Create admin client with service role key
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const ADMIN_EMAIL = 'gtthande@gmail.com';
const ADMIN_PASSWORD = 'Admin123!';

async function ensureAdminUser() {
  console.log('🔐 Ensuring admin user exists...\n');

  try {
    // List users to find existing admin
    const { data: users, error: listError } = await adminClient.auth.admin.listUsers();
    
    if (listError) {
      throw listError;
    }

    const existingUser = users.users.find(user => user.email === ADMIN_EMAIL);

    if (existingUser) {
      console.log(`✓ Found existing user: ${ADMIN_EMAIL}`);
      console.log(`  User ID: ${existingUser.id}`);
      console.log(`  Email Confirmed: ${existingUser.email_confirmed_at ? 'Yes' : 'No'}\n`);

      // Update password to ensure it's correct
      const { data: updateData, error: updateError } = await adminClient.auth.admin.updateUserById(
        existingUser.id,
        {
          password: ADMIN_PASSWORD,
          email_confirm: true // Ensure email is confirmed
        }
      );

      if (updateError) {
        throw updateError;
      }

      console.log('✅ Admin user password updated successfully');
      console.log('✅ Email confirmed status ensured\n');
      console.log('📝 Credentials:');
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log(`   Password: ${ADMIN_PASSWORD}\n`);
    } else {
      console.log(`✗ User not found, creating new admin user...\n`);

      // Create new admin user
      const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: 'Admin User'
        }
      });

      if (createError) {
        throw createError;
      }

      console.log('✅ Admin user created successfully');
      console.log(`   User ID: ${createData.user.id}`);
      console.log(`   Email: ${createData.user.email}`);
      console.log(`   Email Confirmed: ${createData.user.email_confirmed_at ? 'Yes' : 'No'}\n`);
      console.log('📝 Credentials:');
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log(`   Password: ${ADMIN_PASSWORD}\n`);
    }

    // Ensure profile exists with is_admin flag
    const { data: profileData, error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        user_id: existingUser?.id || createData?.user.id,
        full_name: 'Admin User',
        is_admin: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (profileError) {
      console.warn('⚠️  Could not update profile (this is OK if profiles table does not exist yet)');
      console.warn(`   Error: ${profileError.message}\n`);
    } else {
      console.log('✅ Admin profile ensured\n');
    }

    console.log('🎉 Admin user setup complete!\n');
    console.log('You can now log in at /auth with:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}\n`);

  } catch (error: any) {
    console.error('❌ Error ensuring admin user:', error.message);
    console.error('   Details:', error);
    process.exit(1);
  }
}

// Run the script
ensureAdminUser();

