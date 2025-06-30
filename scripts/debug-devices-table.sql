-- Debug script to check devices table and data
SELECT 'Checking devices table structure' as step;

-- Check if devices table exists and its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'devices' 
ORDER BY ordinal_position;

SELECT 'Current devices data' as step;

-- Show all devices with user information
SELECT 
  d.id,
  d.name,
  d.device_type,
  d.status,
  d.user_id,
  u.email as user_email,
  d.created_at,
  d.updated_at,
  d.last_seen
FROM devices d
LEFT JOIN users u ON d.user_id = u.id
ORDER BY d.created_at DESC;

SELECT 'Device pairing codes' as step;

-- Show pairing codes
SELECT 
  dpc.id,
  dpc.code,
  dpc.screen_name,
  dpc.device_type,
  dpc.device_id,
  dpc.user_id,
  u.email as user_email,
  dpc.used_at,
  dpc.completed_at,
  dpc.created_at,
  dpc.expires_at
FROM device_pairing_codes dpc
LEFT JOIN users u ON dpc.user_id = u.id
ORDER BY dpc.created_at DESC;

SELECT 'Devices with pairing info' as step;

-- Show devices with their pairing codes
SELECT 
  d.id as device_id,
  d.name as device_name,
  d.device_type,
  d.status,
  d.user_id,
  dpc.code as pairing_code,
  dpc.screen_name,
  dpc.used_at,
  dpc.completed_at
FROM devices d
LEFT JOIN device_pairing_codes dpc ON d.id = dpc.device_id
WHERE d.user_id IS NOT NULL
ORDER BY d.created_at DESC;
