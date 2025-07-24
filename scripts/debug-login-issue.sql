-- Debug script to check login issues
-- Run this to see what's in your users table

-- Check if users table exists and what columns it has
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Check sample users
SELECT 
  id,
  email,
  CASE 
    WHEN password_hash IS NULL THEN 'NULL'
    WHEN password_hash = '' THEN 'EMPTY'
    ELSE 'HAS_HASH (' || LENGTH(password_hash) || ' chars)'
  END as password_status,
  first_name,
  last_name,
  COALESCE(plan_type, plan, 'no_plan') as plan_info,
  created_at
FROM users 
ORDER BY created_at DESC
LIMIT 10;

-- Check for the specific email
SELECT 
  id,
  email,
  password_hash IS NOT NULL as has_password,
  LENGTH(password_hash) as hash_length,
  LEFT(password_hash, 10) as hash_start,
  created_at
FROM users 
WHERE LOWER(email) = LOWER('bekace.multimedia@gmail.com');
