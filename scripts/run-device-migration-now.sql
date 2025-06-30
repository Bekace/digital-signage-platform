-- Add missing columns to devices table if they don't exist
DO $$ 
BEGIN
    -- Add assigned_playlist_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'assigned_playlist_id') THEN
        ALTER TABLE devices ADD COLUMN assigned_playlist_id INTEGER REFERENCES playlists(id);
        RAISE NOTICE 'Added assigned_playlist_id column';
    ELSE
        RAISE NOTICE 'assigned_playlist_id column already exists';
    END IF;
    
    -- Add playlist_status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'playlist_status') THEN
        ALTER TABLE devices ADD COLUMN playlist_status VARCHAR(50) DEFAULT 'none';
        RAISE NOTICE 'Added playlist_status column';
    ELSE
        RAISE NOTICE 'playlist_status column already exists';
    END IF;
    
    -- Add last_control_action column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'last_control_action') THEN
        ALTER TABLE devices ADD COLUMN last_control_action VARCHAR(50);
        RAISE NOTICE 'Added last_control_action column';
    ELSE
        RAISE NOTICE 'last_control_action column already exists';
    END IF;
    
    -- Add last_control_time column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'last_control_time') THEN
        ALTER TABLE devices ADD COLUMN last_control_time TIMESTAMP;
        RAISE NOTICE 'Added last_control_time column';
    ELSE
        RAISE NOTICE 'last_control_time column already exists';
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'updated_at') THEN
        ALTER TABLE devices ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added updated_at column';
    ELSE
        RAISE NOTICE 'updated_at column already exists';
    END IF;
    
    -- Update existing devices to have default values
    UPDATE devices SET 
        playlist_status = 'none' 
    WHERE playlist_status IS NULL;
    
    UPDATE devices SET 
        updated_at = CURRENT_TIMESTAMP 
    WHERE updated_at IS NULL;
    
    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
    CREATE INDEX IF NOT EXISTS idx_devices_assigned_playlist ON devices(assigned_playlist_id);
    CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
    
    RAISE NOTICE 'Migration completed successfully';
    
END $$;

-- Insert sample devices if table is empty
INSERT INTO devices (user_id, name, device_type, status, playlist_status, created_at, updated_at)
SELECT 1, 'Sample Fire TV', 'fire_tv', 'offline', 'none', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM devices LIMIT 1);

INSERT INTO devices (user_id, name, device_type, status, playlist_status, created_at, updated_at)
SELECT 1, 'Sample Web Browser', 'web_browser', 'offline', 'none', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM devices WHERE name = 'Sample Web Browser');

-- Show results
SELECT 'Device table structure after migration:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'devices' 
ORDER BY ordinal_position;

SELECT 'Sample devices created:' as info;
SELECT id, name, device_type, status, playlist_status, user_id 
FROM devices 
LIMIT 5;

SELECT 'Migration completed successfully!' as result;
