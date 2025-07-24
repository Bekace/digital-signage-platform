-- Make bekace.multimedia@gmail.com a super admin
-- First, let's find the user ID for the email
DO $$
DECLARE
    target_user_id INTEGER;
BEGIN
    -- Get the user ID for the email
    SELECT id INTO target_user_id 
    FROM users 
    WHERE email = 'bekace.multimedia@gmail.com';
    
    -- Check if user exists
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email bekace.multimedia@gmail.com not found';
    END IF;
    
    -- Check if admin record already exists
    IF EXISTS (SELECT 1 FROM admin_users WHERE user_id = target_user_id) THEN
        -- Update existing admin record
        UPDATE admin_users 
        SET 
            role = 'super_admin',
            permissions = '{
                "users": {"create": true, "read": true, "update": true, "delete": true},
                "media": {"create": true, "read": true, "update": true, "delete": true},
                "playlists": {"create": true, "read": true, "update": true, "delete": true},
                "devices": {"create": true, "read": true, "update": true, "delete": true},
                "screens": {"create": true, "read": true, "update": true, "delete": true},
                "plans": {"create": true, "read": true, "update": true, "delete": true},
                "features": {"create": true, "read": true, "update": true, "delete": true},
                "admin": {"create": true, "read": true, "update": true, "delete": true},
                "system": {"database": true, "debug": true, "maintenance": true}
            }'::jsonb
        WHERE user_id = target_user_id;
        
        RAISE NOTICE 'Updated existing admin record for user ID: %', target_user_id;
    ELSE
        -- Create new admin record
        INSERT INTO admin_users (user_id, role, permissions)
        VALUES (
            target_user_id,
            'super_admin',
            '{
                "users": {"create": true, "read": true, "update": true, "delete": true},
                "media": {"create": true, "read": true, "update": true, "delete": true},
                "playlists": {"create": true, "read": true, "update": true, "delete": true},
                "devices": {"create": true, "read": true, "update": true, "delete": true},
                "screens": {"create": true, "read": true, "update": true, "delete": true},
                "plans": {"create": true, "read": true, "update": true, "delete": true},
                "features": {"create": true, "read": true, "update": true, "delete": true},
                "admin": {"create": true, "read": true, "update": true, "delete": true},
                "system": {"database": true, "debug": true, "maintenance": true}
            }'::jsonb
        );
        
        RAISE NOTICE 'Created new admin record for user ID: %', target_user_id;
    END IF;
    
    -- Also update the is_admin flag in users table if it exists
    IF EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'is_admin'
    ) THEN
        UPDATE users 
        SET is_admin = true 
        WHERE id = target_user_id;
        
        RAISE NOTICE 'Updated is_admin flag in users table for user ID: %', target_user_id;
    END IF;
    
END $$;

-- Verify the admin user was created/updated
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    COALESCE(u.is_admin, false) as is_admin_flag,
    au.role,
    au.permissions,
    au.created_at as admin_created_at
FROM users u
LEFT JOIN admin_users au ON u.id = au.user_id
WHERE u.email = 'bekace.multimedia@gmail.com';
