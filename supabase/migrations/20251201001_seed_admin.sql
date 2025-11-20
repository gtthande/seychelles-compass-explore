-- Seed Admin User in auth.users
-- This ensures the admin user exists in Supabase auth system
-- Idempotent - safe to run multiple times

DO $$
BEGIN
    -- Check if user already exists
    IF NOT EXISTS (
        SELECT 1 FROM auth.users WHERE id = '62a90a1c-2491-4637-a21e-93e9b4726b55'
    ) THEN
        -- Insert admin user into auth.users
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            role
        ) VALUES (
            '62a90a1c-2491-4637-a21e-93e9b4726b55',
            '00000000-0000-0000-0000-000000000000',
            'gtthande@gmail.com',
            crypt('Admin123!', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{}',
            false,
            'authenticated'
        );
        
        RAISE NOTICE 'Admin user created in auth.users';
    ELSE
        RAISE NOTICE 'Admin user already exists in auth.users';
    END IF;
    
    -- Ensure profile exists and is marked as admin
    INSERT INTO public.profiles (
        id,
        user_id,
        full_name,
        is_admin,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        '62a90a1c-2491-4637-a21e-93e9b4726b55',
        'Admin User',
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET is_admin = true,
        updated_at = NOW();
    
    RAISE NOTICE 'Admin profile ensured';
END $$;

