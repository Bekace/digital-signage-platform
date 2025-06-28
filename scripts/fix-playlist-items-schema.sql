-- Fix playlist items table schema to use consistent column naming
-- This ensures proper foreign key relationships and data integrity

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
    
    -- Add the correct foreign key constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'playlist_items' AND constraint_name = 'playlist_items_media_file_id_fkey'
    ) THEN
        ALTER TABLE playlist_items 
        ADD CONSTRAINT playlist_items_media_file_id_fkey 
        FOREIGN KEY (media_file_id) REFERENCES media_files(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Ensure all required columns exist with proper defaults
ALTER TABLE playlist_items 
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS transition_type VARCHAR(50) DEFAULT 'fade';

-- Update any NULL durations to default 30 seconds
UPDATE playlist_items SET duration = 30 WHERE duration IS NULL;
UPDATE playlist_items SET transition_type = 'fade' WHERE transition_type IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist_id ON playlist_items(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_position ON playlist_items(playlist_id, position);
