-- Fix devices table schema by adding all missing columns
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'monitor',
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS resolution VARCHAR(20) DEFAULT '1920x1080',
ADD COLUMN IF NOT EXISTS code VARCHAR(10),
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing devices to have proper values
UPDATE devices 
SET 
  type = COALESCE(type, 'monitor'),
  location = COALESCE(location, 'Office'),
  resolution = COALESCE(resolution, '1920x1080'),
  last_seen = COALESCE(last_seen, created_at)
WHERE type IS NULL OR type = '';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_code ON devices(code);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'devices' 
ORDER BY ordinal_position;
