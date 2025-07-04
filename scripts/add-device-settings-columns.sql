-- Add device settings columns if they don't exist
DO $$ 
BEGIN
    -- Add orientation column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'orientation') THEN
        ALTER TABLE devices ADD COLUMN orientation VARCHAR(20) DEFAULT 'landscape';
    END IF;
    
    -- Add brightness column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'brightness') THEN
        ALTER TABLE devices ADD COLUMN brightness INTEGER DEFAULT 80;
    END IF;
    
    -- Add volume column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'volume') THEN
        ALTER TABLE devices ADD COLUMN volume INTEGER DEFAULT 50;
    END IF;
    
    -- Add auto_restart column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'auto_restart') THEN
        ALTER TABLE devices ADD COLUMN auto_restart BOOLEAN DEFAULT false;
    END IF;
    
    -- Add restart_time column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'restart_time') THEN
        ALTER TABLE devices ADD COLUMN restart_time TIME DEFAULT '02:00:00';
    END IF;
    
    -- Add ip_address column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'ip_address') THEN
        ALTER TABLE devices ADD COLUMN ip_address VARCHAR(45);
    END IF;
    
    -- Add battery_level column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'battery_level') THEN
        ALTER TABLE devices ADD COLUMN battery_level INTEGER;
    END IF;
    
    -- Add wifi_strength column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'wifi_strength') THEN
        ALTER TABLE devices ADD COLUMN wifi_strength INTEGER;
    END IF;
    
    -- Add updated_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'updated_at') THEN
        ALTER TABLE devices ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- Update existing devices with default values
UPDATE devices 
SET 
    orientation = COALESCE(orientation, 'landscape'),
    brightness = COALESCE(brightness, 80),
    volume = COALESCE(volume, 50),
    auto_restart = COALESCE(auto_restart, false),
    restart_time = COALESCE(restart_time, '02:00:00'),
    updated_at = COALESCE(updated_at, NOW())
WHERE orientation IS NULL OR brightness IS NULL OR volume IS NULL OR auto_restart IS NULL OR restart_time IS NULL OR updated_at IS NULL;
