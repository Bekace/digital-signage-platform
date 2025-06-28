-- Fix playlist_items table schema to use consistent column naming
-- This ensures proper foreign key relationships and data integrity

-- First, check if the table exists and what columns it has
DO $$
BEGIN
    -- Drop existing foreign key constraints if they exist
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'playlist_items_media_id_fkey' 
               AND table_name = 'playlist_items') THEN
        ALTER TABLE playlist_items DROP CONSTRAINT playlist_items_media_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'playlist_items_media_file_id_fkey' 
               AND table_name = 'playlist_items') THEN
        ALTER TABLE playlist_items DROP CONSTRAINT playlist_items_media_file_id_fkey;
    END IF;
END $$;

-- Ensure the playlist_items table has the correct structure
ALTER TABLE playlist_items 
ADD COLUMN IF NOT EXISTS media_file_id INTEGER,
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS transition_type VARCHAR(50) DEFAULT 'fade';

-- If media_id column exists, migrate data to media_file_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'playlist_items' AND column_name = 'media_id') THEN
        -- Copy data from media_id to media_file_id if media_file_id is null
        UPDATE playlist_items 
        SET media_file_id = media_id 
        WHERE media_file_id IS NULL AND media_id IS NOT NULL;
        
        -- Drop the old media_id column
        ALTER TABLE playlist_items DROP COLUMN IF EXISTS media_id;
    END IF;
END $$;

-- Add proper foreign key constraint
ALTER TABLE playlist_items 
ADD CONSTRAINT playlist_items_media_file_id_fkey 
FOREIGN KEY (media_file_id) REFERENCES media_files(id) ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist_id ON playlist_items(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_media_file_id ON playlist_items(media_file_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_position ON playlist_items(position);

-- Ensure all existing items have default duration
UPDATE playlist_items SET duration = 30 WHERE duration IS NULL;
UPDATE playlist_items SET transition_type = 'fade' WHERE transition_type IS NULL;
