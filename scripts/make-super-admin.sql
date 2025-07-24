-- Make Super Admin Script
-- This script will make bekace.multimedia@gmail.com a super admin

-- First, let's find the user
SELECT id, email, first_name, last_name 
FROM users 
WHERE email = 'bekace.multimedia@gmail.com';

-- Check if admin record already exists
SELECT au.id, au.role, au.permissions, u.email
FROM admin_users au
JOIN users u ON au.user_id = u.id
WHERE u.email = 'bekace.multimedia@gmail.com';

-- Create or update admin record
-- If the user exists, this will create the admin record
INSERT INTO admin_users (user_id, role, permissions)
SELECT 
  u.id,
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
FROM users u
WHERE u.email = 'bekace.multimedia@gmail.com'
ON CONFLICT (user_id) 
DO UPDATE SET 
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
  }'::jsonb;

-- Update is_admin flag if the column exists
-- This will only work if the is_admin column exists in the users table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_admin'
  ) THEN
    UPDATE users 
    SET is_admin = true 
    WHERE email = 'bekace.multimedia@gmail.com';
  END IF;
END $$;

-- Verify the result
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
