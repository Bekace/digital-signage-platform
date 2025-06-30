-- Add missing columns to devices table if they don't exist
DO $$ 
BEGIN
    -- Add assigned_playlist_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'assigned_playlist_id') THEN
        ALTER TABLE devices ADD COLUMN assigned_playlist_id INTEGER REFERENCES playlists(id);
        RAISE NOTICE 'Added assigned_playlist_id column to devices table';
    ELSE
        RAISE NOTICE 'assigned_playlist_id column already exists in devices table';
    END IF;
    
    -- Add playlist_status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'playlist_status') THEN
        ALTER TABLE devices ADD COLUMN playlist_status VARCHAR(50) DEFAULT 'none';
        RAISE NOTICE 'Added playlist_status column to devices table';
    ELSE
        RAISE NOTICE 'playlist_status column already exists in devices table';
    END IF;
    
    -- Add last_control_action column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'last_control_action') THEN
        ALTER TABLE devices ADD COLUMN last_control_action VARCHAR(50);
        RAISE NOTICE 'Added last_control_action column to devices table';
    ELSE
        RAISE NOTICE 'last_control_action column already exists in devices table';
    END IF;
    
    -- Add last_control_time column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'last_control_time') THEN
        ALTER TABLE devices ADD COLUMN last_control_time TIMESTAMP;
        RAISE NOTICE 'Added last_control_time column to devices table';
    ELSE
        RAISE NOTICE 'last_control_time column already exists in devices table';
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'updated_at') THEN
        ALTER TABLE devices ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added updated_at column to devices table';
    ELSE
        RAISE NOTICE 'updated_at column already exists in devices table';
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
    
    RAISE NOTICE 'Device table migration completed successfully';
END $$;

-- Ensure device_pairing_codes table has correct structure
DO $$
BEGIN
    -- Check if device_pairing_codes table exists, if not create it
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'device_pairing_codes') THEN
        CREATE TABLE device_pairing_codes (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            screen_name VARCHAR(255) NOT NULL,
            device_type VARCHAR(50) NOT NULL,
            code VARCHAR(10) NOT NULL UNIQUE,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP,
            used_at TIMESTAMP,
            device_id INTEGER REFERENCES devices(id) ON DELETE SET NULL
        );
        RAISE NOTICE 'Created device_pairing_codes table';
    ELSE
        RAISE NOTICE 'device_pairing_codes table already exists';
    END IF;
    
    -- Add missing columns to device_pairing_codes if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'device_pairing_codes' AND column_name = 'code') THEN
        ALTER TABLE device_pairing_codes ADD COLUMN code VARCHAR(10) NOT NULL;
        RAISE NOTICE 'Added code column to device_pairing_codes table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'device_pairing_codes' AND column_name = 'device_type') THEN
        ALTER TABLE device_pairing_codes ADD COLUMN device_type VARCHAR(50);
        RAISE NOTICE 'Added device_type column to device_pairing_codes table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'device_pairing_codes' AND column_name = 'screen_name') THEN
        ALTER TABLE device_pairing_codes ADD COLUMN screen_name VARCHAR(255);
        RAISE NOTICE 'Added screen_name column to device_pairing_codes table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'device_pairing_codes' AND column_name = 'completed_at') THEN
        ALTER TABLE device_pairing_codes ADD COLUMN completed_at TIMESTAMP;
        RAISE NOTICE 'Added completed_at column to device_pairing_codes table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'device_pairing_codes' AND column_name = 'used_at') THEN
        ALTER TABLE device_pairing_codes ADD COLUMN used_at TIMESTAMP;
        RAISE NOTICE 'Added used_at column to device_pairing_codes table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'device_pairing_codes' AND column_name = 'device_id') THEN
        ALTER TABLE device_pairing_codes ADD COLUMN device_id INTEGER REFERENCES devices(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added device_id column to device_pairing_codes table';
    END IF;
    
    -- Create indexes for device_pairing_codes
    CREATE INDEX IF NOT EXISTS idx_device_pairing_codes_user_id ON device_pairing_codes(user_id);
    CREATE INDEX IF NOT EXISTS idx_device_pairing_codes_code ON device_pairing_codes(code);
    CREATE INDEX IF NOT EXISTS idx_device_pairing_codes_expires_at ON device_pairing_codes(expires_at);
    
    RAISE NOTICE 'Device pairing codes table migration completed successfully';
END $$;

-- Insert sample devices if table is empty (for testing)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM devices LIMIT 1) THEN
        -- Insert sample devices for the first user
        INSERT INTO devices (user_id, name, device_type, status, playlist_status, created_at, updated_at)
        SELECT 
            u.id, 
            'Sample Fire TV', 
            'fire_tv', 
            'offline', 
            'none', 
            CURRENT_TIMESTAMP, 
            CURRENT_TIMESTAMP
        FROM users u 
        LIMIT 1;
        
        INSERT INTO devices (user_id, name, device_type, status, playlist_status, created_at, updated_at)
        SELECT 
            u.id, 
            'Sample Web Browser', 
            'web_browser', 
            'offline', 
            'none', 
            CURRENT_TIMESTAMP, 
            CURRENT_TIMESTAMP
        FROM users u 
        LIMIT 1;
        
        RAISE NOTICE 'Added sample devices for testing';
    ELSE
        RAISE NOTICE 'Devices table already has data, skipping sample data insertion';
    END IF;
END $$;

-- Show final table structures
SELECT 'Device table structure after migration:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'devices' 
ORDER BY ordinal_position;

SELECT 'Device pairing codes table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'device_pairing_codes' 
ORDER BY ordinal_position;

-- Show sample data
SELECT 'Current devices in database:' as info;
SELECT id, name, device_type, status, playlist_status, user_id, created_at
FROM devices 
ORDER BY created_at DESC
LIMIT 10;

SELECT 'Migration completed successfully! All required columns and tables are now in place.' as result;
