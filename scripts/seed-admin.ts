// scripts/seed-admin.ts
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env file manually to get VITE_ prefixed vars
config();

// Also try reading .env directly as fallback
try {
    const envContent = readFileSync(resolve(process.cwd(), ".env"), "utf-8");
    envContent.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
            const [key, ...valueParts] = trimmed.split("=");
            if (key && valueParts.length > 0) {
                const value = valueParts.join("=").trim();
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            }
        }
    });
} catch (err) {
    console.warn("⚠️ Could not read .env file directly, using dotenv only");
}

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE;

if (!url || !serviceKey) {
    console.error("❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE in environment");
    console.error("VITE_SUPABASE_URL:", url ? "✓" : "✗");
    console.error("VITE_SUPABASE_SERVICE_ROLE:", serviceKey ? "✓" : "✗");
    process.exit(1);
}

const supabase = createClient(url, serviceKey, {
    auth: {
        persistSession: false,
    },
});

const ADMIN_EMAIL = "gtthande@gmail.com";
const ADMIN_PASSWORD = "Admin123!";

async function ensureAdminUser() {
    console.log("🔧 Seeding admin user…");

    // 1) Check if auth user exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error("❌ Error listing users:", listError);
    } else {
        const existingUser = users?.find(u => u.email === ADMIN_EMAIL);
        if (existingUser) {
            console.log("ℹ️ Auth user already exists for", ADMIN_EMAIL, "with ID:", existingUser.id);
        }
    }

    // 2) Upsert auth user (using admin API)
    const { data: authResult, error: authError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
    });

    if (authError) {
        if (authError.message?.includes("already registered") || authError.message?.includes("already exists") || authError.code === 'email_exists') {
            console.log("ℹ️ Auth user already exists for", ADMIN_EMAIL);
            // Try to get the existing user
            const { data: { users } } = await supabase.auth.admin.listUsers();
            const existingUser = users?.find(u => u.email === ADMIN_EMAIL);
            if (existingUser) {
                // Update password if user exists
                console.log("🔄 Updating password for existing user...");
                const { error: updateError } = await supabase.auth.admin.updateUserById(
                    existingUser.id,
                    { password: ADMIN_PASSWORD }
                );
                if (updateError) {
                    console.warn("⚠️ Could not update password:", updateError.message);
                } else {
                    console.log("✅ Password updated for existing user");
                    console.log(`   Email: ${ADMIN_EMAIL}`);
                    console.log(`   Password: ${ADMIN_PASSWORD}`);
                }
            }
        } else {
            console.error("❌ Error creating auth user:", authError);
            process.exit(1);
        }
    } else {
        console.log("✅ Auth user ensured:", authResult.user?.id);
        console.log(`   Email: ${ADMIN_EMAIL}`);
        console.log(`   Password: ${ADMIN_PASSWORD}`);
    }

    // Get the user ID (either from creation or existing)
    const { data: { users: allUsers } } = await supabase.auth.admin.listUsers();
    const targetUser = allUsers?.find(u => u.email === ADMIN_EMAIL);

    if (!targetUser) {
        console.error("❌ Could not find user after creation/update");
        process.exit(1);
    }

    const userId = targetUser.id;

    // 3) Ensure admin flag in profile table
    // Check if profile exists
    const { data: existingProfile, error: profileCheckError } = await supabase
        .from("profiles")
        .select("id, user_id, is_admin, email")
        .eq("user_id", userId)
        .maybeSingle();

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
        console.error("❌ Error checking profile:", profileCheckError);
    }

    if (existingProfile) {
        console.log("ℹ️ Profile already exists:", existingProfile);
        // Update to ensure admin flag is set
        const { error: updateError } = await supabase
            .from("profiles")
            .update({
                is_admin: true,
                email: ADMIN_EMAIL,
            })
            .eq("user_id", userId);

        if (updateError) {
            console.error("❌ Error updating admin profile:", updateError);
            process.exit(1);
        } else {
            console.log("✅ Admin profile updated");
        }
    } else {
        // Insert new profile
        const { error: insertError } = await supabase
            .from("profiles")
            .insert({
                user_id: userId,
                email: ADMIN_EMAIL,
                is_admin: true,
                full_name: "Admin User",
            });

        if (insertError) {
            console.error("❌ Error inserting admin profile:", insertError);
            process.exit(1);
        } else {
            console.log("✅ Admin profile created");
        }
    }

    console.log("✅ Admin seeding complete for", ADMIN_EMAIL);
}

ensureAdminUser()
    .then(() => {
        console.log("✅ Admin seeding complete.");
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ Unexpected error during admin seeding:", err);
        process.exit(1);
    });
