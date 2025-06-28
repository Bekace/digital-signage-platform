-- Fix playlist_items table to use consistent column naming
-- Check if media_file_id column exists, if not rename media_id to media_file_id for consistency

DO $$ 
BEGIN
    -- Check if media_file_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'playlist_items' AND column_name = 'media_file_id'
    ) THEN
        -- If media_file_id doesn't exist but media_id does, rename it
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'playlist_items' AND column_name = 'media_id'
        ) THEN
            ALTER TABLE playlist_items RENAME COLUMN media_id TO media_file_id;
            RAISE NOTICE 'Renamed media_id to media_file_id in playlist_items table';
        ELSE
            -- If neither exists, add media_file_id column
            ALTER TABLE playlist_items ADD COLUMN media_file_id INTEGER REFERENCES media_files(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added media_file_id column to playlist_items table';
        END IF;
    END IF;

    -- Ensure the foreign key constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'playlist_items' 
        AND kcu.column_name = 'media_file_id'
        AND tc.constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE playlist_items 
        ADD CONSTRAINT fk_playlist_items_media_file 
        FOREIGN KEY (media_file_id) REFERENCES media_files(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint for media_file_id';
    END IF;

END $$;
