-- Fix playlist items table schema to use consistent column naming
-- This ensures proper foreign key relationships and data consistency

-- First, check if we need to rename the column
DO $$
BEGIN
    -- Check if media_id column exists and media_file_id doesn't
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'playlist_items' AND column_name = 'media_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'playlist_items' AND column_name = 'media_file_id'
    ) THEN
        -- Rename media_id to media_file_id for consistency
        ALTER TABLE playlist_items RENAME COLUMN media_id TO media_file_id;
        RAISE NOTICE 'Renamed media_id to media_file_id in playlist_items table';
    END IF;
END $$;

-- Ensure the foreign key constraint exists
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'playlist_items' AND constraint_name = 'playlist_items_media_id_fkey'
    ) THEN
        ALTER TABLE playlist_items DROP CONSTRAINT playlist_items_media_id_fkey;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'playlist_items' AND constraint_name = 'playlist_items_media_file_id_fkey'
    ) THEN
        ALTER TABLE playlist_items DROP CONSTRAINT playlist_items_media_file_id_fkey;
    END IF;
    
    -- Add the correct foreign key constraint
    ALTER TABLE playlist_items 
    ADD CONSTRAINT playlist_items_media_file_id_fkey 
    FOREIGN KEY (media_file_id) REFERENCES media_files(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added foreign key constraint for media_file_id';
END $$;

-- Ensure duration column has a default value
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'playlist_items' 
        AND column_name = 'duration' 
        AND column_default IS NOT NULL
    ) THEN
        ALTER TABLE playlist_items ALTER COLUMN duration SET DEFAULT 30;
        RAISE NOTICE 'Set default duration to 30 seconds';
    END IF;
END $$;

-- Update any existing items without duration to have 30 seconds
UPDATE playlist_items SET duration = 30 WHERE duration IS NULL;

-- Ensure transition_type has a default value
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'playlist_items' 
        AND column_name = 'transition_type' 
        AND column_default IS NOT NULL
    ) THEN
        ALTER TABLE playlist_items ALTER COLUMN transition_type SET DEFAULT 'fade';
        RAISE NOTICE 'Set default transition_type to fade';
    END IF;
END $$;

-- Update any existing items without transition_type
UPDATE playlist_items SET transition_type = 'fade' WHERE transition_type IS NULL OR transition_type = '';

RAISE NOTICE 'Playlist items schema fix completed successfully';
