-- Debug devices table and relationships
SELECT 'DEVICES TABLE STRUCTURE' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'devices' 
ORDER BY ordinal_position;

SELECT 'ALL DEVICES WITH USER INFO' as info;
SELECT 
  d.id as device_id,
  d.name as device_name,
  d.device_type,
  d.status,
  d.user_id,
  d.created_at as device_created,
  d.updated_at as device_updated,
  u.email as user_email,
  dpc.code as pairing_code,
  dpc.screen_name,
  dpc.used_at,
  dpc.completed_at,
  dpc.created_at as pairing_created
FROM devices d
LEFT JOIN users u ON d.user_id = u.id
LEFT JOIN device_pairing_codes dpc ON d.id = dpc.device_id
ORDER BY d.created_at DESC;

SELECT 'DEVICE PAIRING CODES' as info;
SELECT * FROM device_pairing_codes ORDER BY created_at DESC;

SELECT 'USERS TABLE' as info;
SELECT id, email, first_name, last_name FROM users ORDER BY created_at DESC;

SELECT 'SUMMARY STATISTICS' as info;
SELECT 
  (SELECT COUNT(*) FROM devices) as total_devices,
  (SELECT COUNT(*) FROM devices WHERE user_id IS NOT NULL) as devices_with_users,
  (SELECT COUNT(*) FROM device_pairing_codes) as total_pairing_codes,
  (SELECT COUNT(*) FROM device_pairing_codes WHERE completed_at IS NOT NULL) as completed_pairings,
  (SELECT COUNT(*) FROM users) as total_users;
