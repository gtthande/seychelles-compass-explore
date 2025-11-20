import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Load .env file manually
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

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Try both possible env var names for service role key
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
    console.error('❌ Missing VITE_SUPABASE_URL in .env');
    process.exit(1);
}

if (!serviceRoleKey) {
    console.warn('⚠️  Missing SUPABASE_SERVICE_ROLE_KEY in .env');
    console.warn('   Admin seeding requires service role key. Skipping...');
    console.warn('   Add SUPABASE_SERVICE_ROLE_KEY to .env to enable admin seeding');
    process.exit(0); // Exit gracefully, don't fail the dev server
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function run() {
    console.log('🔐 Seeding admin user...\n');

    try {
        // Check if user already exists
        const { data: users, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
            console.error('❌ Error listing users:', listError);
            process.exit(1);
        }

        const existingUser = users.users.find(u => u.email === 'gtthande@gmail.com');

        if (existingUser) {
            console.log('✓ Admin user already exists');
            console.log(`  User ID: ${existingUser.id}`);

            // Update password and ensure email is confirmed
            const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
                existingUser.id,
                {
                    password: 'Admin123!',
                    email_confirm: true
                }
            );

            if (updateError) {
                console.error('❌ Error updating user:', updateError);
                process.exit(1);
            }

            console.log('✅ Admin user password updated');
            console.log('✅ Email confirmed\n');

            // Ensure profile exists with admin role
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', existingUser.id)
                .single();

            if (profileError && profileError.code !== 'PGRST116') {
                console.warn('⚠️  Could not check profile:', profileError.message);
            } else if (!profile) {
                // Create profile if missing
                const { error: createProfileError } = await supabase
                    .from('profiles')
                    .insert({
                        user_id: existingUser.id,
                        email: existingUser.email,
                        role: 'admin',
                        is_admin: true,
                        is_active: true
                    });

                if (createProfileError) {
                    console.warn('⚠️  Could not create profile:', createProfileError.message);
                } else {
                    console.log('✅ Admin profile created');
                }
            } else if (profile.role !== 'admin' || !profile.is_admin) {
                // Update profile to ensure admin role
                const { error: updateProfileError } = await supabase
                    .from('profiles')
                    .update({ role: 'admin', is_admin: true })
                    .eq('user_id', existingUser.id);

                if (updateProfileError) {
                    console.warn('⚠️  Could not update profile:', updateProfileError.message);
                } else {
                    console.log('✅ Admin profile updated');
                }
            }
        } else {
            // Create new user
            const { data, error } = await supabase.auth.admin.createUser({
                email: "gtthande@gmail.com",
                password: "Admin123!",
                email_confirm: true,
            });

            if (error) {
                console.error("❌ Seed error:", error);
                return;
            }

            console.log("✅ Admin user created:", data.user?.id);

            // Create profile with admin role
            if (data.user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                        user_id: data.user.id,
                        email: data.user.email,
                        role: 'admin',
                        is_admin: true,
                        is_active: true
                    });

                if (profileError) {
                    console.warn('⚠️  Could not create profile:', profileError.message);
                } else {
                    console.log('✅ Admin profile created');
                }
            }
        }

        console.log('\n📝 Login credentials:');
        console.log('   Email: gtthande@gmail.com');
        console.log('   Password: Admin123!\n');
        console.log('🎉 Admin user ready!\n');
    } catch (error: any) {
        console.error('❌ Unexpected error:', error.message);
        process.exit(1);
    }
}

run();

