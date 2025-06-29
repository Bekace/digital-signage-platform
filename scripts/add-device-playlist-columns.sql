-- Add playlist assignment and control columns to devices table
DO $$ 
BEGIN
    -- Add assigned_playlist_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'devices' AND column_name = 'assigned_playlist_id') THEN
        ALTER TABLE devices ADD COLUMN assigned_playlist_id INTEGER;
        RAISE NOTICE 'Added assigned_playlist_id column to devices table';
    ELSE
        RAISE NOTICE 'assigned_playlist_id column already exists in devices table';
    END IF;

    -- Add playlist_status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'devices' AND column_name = 'playlist_status') THEN
        ALTER TABLE devices ADD COLUMN playlist_status VARCHAR(20) DEFAULT 'stopped';
        RAISE NOTICE 'Added playlist_status column to devices table';
    ELSE
        RAISE NOTICE 'playlist_status column already exists in devices table';
    END IF;

    -- Add last_control_action column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'devices' AND column_name = 'last_control_action') THEN
        ALTER TABLE devices ADD COLUMN last_control_action VARCHAR(20);
        RAISE NOTICE 'Added last_control_action column to devices table';
    ELSE
        RAISE NOTICE 'last_control_action column already exists in devices table';
    END IF;

    -- Add last_control_time column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'devices' AND column_name = 'last_control_time') THEN
        ALTER TABLE devices ADD COLUMN last_control_time TIMESTAMP;
        RAISE NOTICE 'Added last_control_time column to devices table';
    ELSE
        RAISE NOTICE 'last_control_time column already exists in devices table';
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'devices' AND column_name = 'updated_at') THEN
        ALTER TABLE devices ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to devices table';
    ELSE
        RAISE NOTICE 'updated_at column already exists in devices table';
    END IF;

    -- Add foreign key constraint for assigned_playlist_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'devices' AND constraint_name = 'fk_devices_playlist') THEN
        ALTER TABLE devices ADD CONSTRAINT fk_devices_playlist 
        FOREIGN KEY (assigned_playlist_id) REFERENCES playlists(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added foreign key constraint for assigned_playlist_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint for assigned_playlist_id already exists';
    END IF;

    -- Create index on assigned_playlist_id for better performance
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'devices' AND indexname = 'idx_devices_assigned_playlist') THEN
        CREATE INDEX idx_devices_assigned_playlist ON devices(assigned_playlist_id);
        RAISE NOTICE 'Created index on assigned_playlist_id';
    ELSE
        RAISE NOTICE 'Index on assigned_playlist_id already exists';
    END IF;

    -- Create index on playlist_status for better performance
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'devices' AND indexname = 'idx_devices_playlist_status') THEN
        CREATE INDEX idx_devices_playlist_status ON devices(playlist_status);
        RAISE NOTICE 'Created index on playlist_status';
    ELSE
        RAISE NOTICE 'Index on playlist_status already exists';
    END IF;

END $$;

-- Update any existing devices to have default playlist_status
UPDATE devices SET playlist_status = 'stopped' WHERE playlist_status IS NULL;

-- Show the updated table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'devices' 
ORDER BY ordinal_position;
