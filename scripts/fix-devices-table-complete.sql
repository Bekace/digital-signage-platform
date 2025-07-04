-- Add missing columns to devices table if they don't exist
DO $$ 
BEGIN
    -- Add type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'type') THEN
        ALTER TABLE devices ADD COLUMN type VARCHAR(50) DEFAULT 'monitor';
    END IF;
    
    -- Add location column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'location') THEN
        ALTER TABLE devices ADD COLUMN location VARCHAR(255);
    END IF;
    
    -- Add orientation column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'orientation') THEN
        ALTER TABLE devices ADD COLUMN orientation VARCHAR(20) DEFAULT 'landscape';
    END IF;
    
    -- Add brightness column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'brightness') THEN
        ALTER TABLE devices ADD COLUMN brightness INTEGER DEFAULT 100;
    END IF;
    
    -- Add volume column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'volume') THEN
        ALTER TABLE devices ADD COLUMN volume INTEGER DEFAULT 50;
    END IF;
    
    -- Add auto_restart column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'auto_restart') THEN
        ALTER TABLE devices ADD COLUMN auto_restart BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add restart_time column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'restart_time') THEN
        ALTER TABLE devices ADD COLUMN restart_time TIME DEFAULT '02:00:00';
    END IF;
    
    -- Add notes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'notes') THEN
        ALTER TABLE devices ADD COLUMN notes TEXT;
    END IF;
    
    -- Add resolution column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'resolution') THEN
        ALTER TABLE devices ADD COLUMN resolution VARCHAR(20) DEFAULT '1920x1080';
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'updated_at') THEN
        ALTER TABLE devices ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Update existing devices to have default values
UPDATE devices 
SET 
    type = COALESCE(type, 'monitor'),
    orientation = COALESCE(orientation, 'landscape'),
    brightness = COALESCE(brightness, 100),
    volume = COALESCE(volume, 50),
    auto_restart = COALESCE(auto_restart, FALSE),
    restart_time = COALESCE(restart_time, '02:00:00'),
    resolution = COALESCE(resolution, '1920x1080'),
    updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
WHERE type IS NULL OR orientation IS NULL OR brightness IS NULL OR volume IS NULL 
   OR auto_restart IS NULL OR restart_time IS NULL OR resolution IS NULL OR updated_at IS NULL;
