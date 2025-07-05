-- Add device settings columns to the devices table
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS orientation VARCHAR(20) DEFAULT 'landscape',
ADD COLUMN IF NOT EXISTS brightness INTEGER DEFAULT 80,
ADD COLUMN IF NOT EXISTS volume INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS auto_restart BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS restart_time TIME DEFAULT '03:00:00',
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update existing devices with default values
UPDATE devices 
SET 
  orientation = COALESCE(orientation, 'landscape'),
  brightness = COALESCE(brightness, 80),
  volume = COALESCE(volume, 50),
  auto_restart = COALESCE(auto_restart, FALSE),
  restart_time = COALESCE(restart_time, '03:00:00')
WHERE orientation IS NULL OR brightness IS NULL OR volume IS NULL OR auto_restart IS NULL OR restart_time IS NULL;
