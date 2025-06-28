-- Fix playlist_items schema to ensure proper functionality
-- This script will safely update the schema without losing data

-- First, check if the table exists and has the right structure
DO $$
BEGIN
    -- Ensure playlist_items table has correct structure
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'playlist_items' AND column_name = 'media_file_id'
    ) THEN
        -- Add media_file_id column if it doesn't exist
        ALTER TABLE playlist_items ADD COLUMN media_file_id INTEGER;
        
        -- Copy data from media_id to media_file_id if media_id exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'playlist_items' AND column_name = 'media_id'
        ) THEN
            UPDATE playlist_items SET media_file_id = media_id WHERE media_file_id IS NULL;
        END IF;
    END IF;

    -- Ensure duration column exists with default
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'playlist_items' AND column_name = 'duration'
    ) THEN
        ALTER TABLE playlist_items ADD COLUMN duration INTEGER DEFAULT 30;
    END IF;

    -- Ensure transition_type column exists with default
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'playlist_items' AND column_name = 'transition_type'
    ) THEN
        ALTER TABLE playlist_items ADD COLUMN transition_type VARCHAR(50) DEFAULT 'fade';
    END IF;

    -- Ensure position column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'playlist_items' AND column_name = 'position'
    ) THEN
        ALTER TABLE playlist_items ADD COLUMN position INTEGER DEFAULT 1;
    END IF;

    -- Update any NULL values
    UPDATE playlist_items SET duration = 30 WHERE duration IS NULL;
    UPDATE playlist_items SET transition_type = 'fade' WHERE transition_type IS NULL;
    UPDATE playlist_items SET position = 1 WHERE position IS NULL;

    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'playlist_items_media_file_fk'
    ) THEN
        ALTER TABLE playlist_items 
        ADD CONSTRAINT playlist_items_media_file_fk 
        FOREIGN KEY (media_file_id) REFERENCES media_files(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key constraint for playlist if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'playlist_items_playlist_fk'
    ) THEN
        ALTER TABLE playlist_items 
        ADD CONSTRAINT playlist_items_playlist_fk 
        FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE;
    END IF;

END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist_position 
ON playlist_items(playlist_id, position);

-- Ensure media_files table has original_name column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'media_files' AND column_name = 'original_name'
    ) THEN
        ALTER TABLE media_files ADD COLUMN original_name VARCHAR(255);
        -- Copy filename to original_name if it's empty
        UPDATE media_files SET original_name = filename WHERE original_name IS NULL;
    END IF;
END $$;
