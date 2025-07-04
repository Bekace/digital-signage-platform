-- Add missing columns to devices table
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'monitor',
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS resolution VARCHAR(20) DEFAULT '1920x1080',
ADD COLUMN IF NOT EXISTS code VARCHAR(10),
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing devices to have proper values
UPDATE devices 
SET 
  type = 'monitor',
  location = 'Office',
  resolution = '1920x1080',
  last_seen = COALESCE(last_heartbeat, created_at)
WHERE type IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_code ON devices(code);
