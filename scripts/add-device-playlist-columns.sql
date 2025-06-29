-- Add playlist assignment and control columns to devices table
-- This script safely adds columns if they don't already exist

DO $$
BEGIN
    -- Add assigned_playlist_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'devices' AND column_name = 'assigned_playlist_id') THEN
        ALTER TABLE devices ADD COLUMN assigned_playlist_id INTEGER;
        RAISE NOTICE 'Added assigned_playlist_id column to devices table';
    ELSE
        RAISE NOTICE 'assigned_playlist_id column already exists in devices table';
    END IF;

    -- Add playlist_status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'devices' AND column_name = 'playlist_status') THEN
        ALTER TABLE devices ADD COLUMN playlist_status VARCHAR(20) DEFAULT 'none';
        RAISE NOTICE 'Added playlist_status column to devices table';
    ELSE
        RAISE NOTICE 'playlist_status column already exists in devices table';
    END IF;

    -- Add last_control_action column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'devices' AND column_name = 'last_control_action') THEN
        ALTER TABLE devices ADD COLUMN last_control_action VARCHAR(50);
        RAISE NOTICE 'Added last_control_action column to devices table';
    ELSE
        RAISE NOTICE 'last_control_action column already exists in devices table';
    END IF;

    -- Add last_control_time column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'devices' AND column_name = 'last_control_time') THEN
        ALTER TABLE devices ADD COLUMN last_control_time TIMESTAMP;
        RAISE NOTICE 'Added last_control_time column to devices table';
    ELSE
        RAISE NOTICE 'last_control_time column already exists in devices table';
    END IF;

    -- Add updated_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'devices' AND column_name = 'updated_at') THEN
        ALTER TABLE devices ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to devices table';
    ELSE
        RAISE NOTICE 'updated_at column already exists in devices table';
    END IF;
END $$;

-- Add foreign key constraint for assigned_playlist_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_devices_assigned_playlist') THEN
        ALTER TABLE devices 
        ADD CONSTRAINT fk_devices_assigned_playlist 
        FOREIGN KEY (assigned_playlist_id) REFERENCES playlists(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added foreign key constraint for assigned_playlist_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint for assigned_playlist_id already exists';
    END IF;
END $$;

-- Create index on assigned_playlist_id for better query performance
CREATE INDEX IF NOT EXISTS idx_devices_assigned_playlist_id ON devices(assigned_playlist_id);
CREATE INDEX IF NOT EXISTS idx_devices_playlist_status ON devices(playlist_status);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);

-- Update existing devices to have default playlist_status if NULL
UPDATE devices SET playlist_status = 'none' WHERE playlist_status IS NULL;

SELECT 'Device playlist columns setup completed successfully!' as result;
