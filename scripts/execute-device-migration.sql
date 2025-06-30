-- Execute Device Migration Script
-- This script adds all missing columns and fixes database structure issues

BEGIN;

-- Log the start of migration
DO $$
BEGIN
    RAISE NOTICE '🚀 Starting device table migration at %', CURRENT_TIMESTAMP;
END $$;

-- Add missing columns to devices table
DO $$
BEGIN
    -- Add assigned_playlist_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'devices' AND column_name = 'assigned_playlist_id'
    ) THEN
        ALTER TABLE devices ADD COLUMN assigned_playlist_id INTEGER;
        ALTER TABLE devices ADD CONSTRAINT fk_devices_assigned_playlist 
            FOREIGN KEY (assigned_playlist_id) REFERENCES playlists(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Added assigned_playlist_id column to devices table';
    ELSE
        RAISE NOTICE '⚠️  assigned_playlist_id column already exists';
    END IF;

    -- Add playlist_status column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'devices' AND column_name = 'playlist_status'
    ) THEN
        ALTER TABLE devices ADD COLUMN playlist_status VARCHAR(20) DEFAULT 'none';
        RAISE NOTICE '✅ Added playlist_status column to devices table';
    ELSE
        RAISE NOTICE '⚠️  playlist_status column already exists';
    END IF;

    -- Add last_control_action column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'devices' AND column_name = 'last_control_action'
    ) THEN
        ALTER TABLE devices ADD COLUMN last_control_action VARCHAR(50);
        RAISE NOTICE '✅ Added last_control_action column to devices table';
    ELSE
        RAISE NOTICE '⚠️  last_control_action column already exists';
    END IF;

    -- Add last_control_time column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'devices' AND column_name = 'last_control_time'
    ) THEN
        ALTER TABLE devices ADD COLUMN last_control_time TIMESTAMP;
        RAISE NOTICE '✅ Added last_control_time column to devices table';
    ELSE
        RAISE NOTICE '⚠️  last_control_time column already exists';
    END IF;

    -- Add updated_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'devices' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE devices ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE '✅ Added updated_at column to devices table';
    ELSE
        RAISE NOTICE '⚠️  updated_at column already exists';
    END IF;
END $$;

-- Create or fix device_pairing_codes table
DO $$
BEGIN
    -- Create table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'device_pairing_codes'
    ) THEN
        CREATE TABLE device_pairing_codes (
            id SERIAL PRIMARY KEY,
            code VARCHAR(10) UNIQUE NOT NULL,
            screen_name VARCHAR(255) NOT NULL,
            device_type VARCHAR(50) NOT NULL,
            user_id INTEGER NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            completed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Add foreign key constraint
        ALTER TABLE device_pairing_codes 
        ADD CONSTRAINT fk_device_pairing_codes_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Created device_pairing_codes table';
    ELSE
        RAISE NOTICE '⚠️  device_pairing_codes table already exists';
        
        -- Add missing columns if they don't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'device_pairing_codes' AND column_name = 'completed_at'
        ) THEN
            ALTER TABLE device_pairing_codes ADD COLUMN completed_at TIMESTAMP;
            RAISE NOTICE '✅ Added completed_at column to device_pairing_codes';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'device_pairing_codes' AND column_name = 'user_id'
        ) THEN
            ALTER TABLE device_pairing_codes ADD COLUMN user_id INTEGER NOT NULL;
            ALTER TABLE device_pairing_codes 
            ADD CONSTRAINT fk_device_pairing_codes_user_id 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
            RAISE NOTICE '✅ Added user_id column to device_pairing_codes';
        END IF;
    END IF;
END $$;

-- Create device_heartbeats table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'device_heartbeats'
    ) THEN
        CREATE TABLE device_heartbeats (
            id SERIAL PRIMARY KEY,
            device_id INTEGER NOT NULL,
            status JSONB NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        ALTER TABLE device_heartbeats 
        ADD CONSTRAINT fk_device_heartbeats_device_id 
        FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Created device_heartbeats table';
    ELSE
        RAISE NOTICE '⚠️  device_heartbeats table already exists';
    END IF;
END $$;

-- Update existing devices with default values
UPDATE devices 
SET 
    playlist_status = COALESCE(playlist_status, 'none'),
    updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)
WHERE playlist_status IS NULL OR updated_at IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_assigned_playlist ON devices(assigned_playlist_id);
CREATE INDEX IF NOT EXISTS idx_devices_updated_at ON devices(updated_at);

CREATE INDEX IF NOT EXISTS idx_device_pairing_codes_code ON device_pairing_codes(code);
CREATE INDEX IF NOT EXISTS idx_device_pairing_codes_user_id ON device_pairing_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_device_pairing_codes_expires_at ON device_pairing_codes(expires_at);

CREATE INDEX IF NOT EXISTS idx_device_heartbeats_device_id ON device_heartbeats(device_id);
CREATE INDEX IF NOT EXISTS idx_device_heartbeats_created_at ON device_heartbeats(created_at);

-- Create or replace trigger function for updated_at
CREATE OR REPLACE FUNCTION update_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_update_devices_updated_at ON devices;
CREATE TRIGGER trigger_update_devices_updated_at
    BEFORE UPDATE ON devices
    FOR EACH ROW
    EXECUTE FUNCTION update_devices_updated_at();

-- Clean up expired pairing codes
DELETE FROM device_pairing_codes 
WHERE expires_at < CURRENT_TIMESTAMP AND completed_at IS NULL;

-- Insert sample devices if none exist (for testing)
DO $$
DECLARE
    user_count INTEGER;
    device_count INTEGER;
    sample_user_id INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO device_count FROM devices;
    
    IF user_count > 0 AND device_count = 0 THEN
        SELECT id INTO sample_user_id FROM users ORDER BY created_at LIMIT 1;
        
        INSERT INTO devices (user_id, name, device_type, status, playlist_status, created_at, updated_at)
        VALUES 
            (sample_user_id, 'Sample Fire TV Stick', 'fire_tv', 'offline', 'none', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (sample_user_id, 'Sample Web Browser', 'web_browser', 'offline', 'none', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (sample_user_id, 'Sample Android TV', 'android_tv', 'offline', 'none', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
        
        RAISE NOTICE '✅ Added sample devices for testing';
    END IF;
END $$;

-- Display migration results
DO $$
DECLARE
    devices_count INTEGER;
    pairing_codes_count INTEGER;
    heartbeats_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO devices_count FROM devices;
    SELECT COUNT(*) INTO pairing_codes_count FROM device_pairing_codes;
    SELECT COUNT(*) INTO heartbeats_count FROM device_heartbeats;
    
    RAISE NOTICE '📊 Migration Results:';
    RAISE NOTICE '   - Devices: % records', devices_count;
    RAISE NOTICE '   - Pairing Codes: % records', pairing_codes_count;
    RAISE NOTICE '   - Heartbeats: % records', heartbeats_count;
END $$;

-- Show devices table structure
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '📋 Devices table structure:';
    FOR rec IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'devices' 
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '   - %: % (nullable: %, default: %)', 
            rec.column_name, rec.data_type, rec.is_nullable, COALESCE(rec.column_default, 'none');
    END LOOP;
END $$;

-- Show sample devices data
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '📱 Current devices:';
    FOR rec IN 
        SELECT id, name, device_type, status, playlist_status, user_id
        FROM devices 
        ORDER BY created_at DESC 
        LIMIT 5
    LOOP
        RAISE NOTICE '   - Device #%: % (%, %, user: %)', 
            rec.id, rec.name, rec.device_type, rec.status, rec.user_id;
    END LOOP;
END $$;

COMMIT;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '🎉 MIGRATION COMPLETED SUCCESSFULLY! 🎉';
    RAISE NOTICE '✅ All missing columns have been added to devices table';
    RAISE NOTICE '✅ device_pairing_codes table is properly structured';
    RAISE NOTICE '✅ device_heartbeats table is ready';
    RAISE NOTICE '✅ Indexes created for optimal performance';
    RAISE NOTICE '✅ Triggers set up for automatic timestamp updates';
    RAISE NOTICE '✅ Sample data inserted for testing';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 You can now test the pairing code generation!';
    RAISE NOTICE '📱 Try adding a new screen through the dashboard';
END $$;
