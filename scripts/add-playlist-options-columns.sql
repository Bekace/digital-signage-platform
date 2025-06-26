-- Add playlist options columns to the playlists table
-- This script adds the missing columns that were causing the 500 error

-- Check if columns exist before adding them
DO $$ 
BEGIN
    -- Add scale_image column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'playlists' AND column_name = 'scale_image') THEN
        ALTER TABLE playlists ADD COLUMN scale_image VARCHAR(20) DEFAULT 'fit';
    END IF;

    -- Add scale_video column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'playlists' AND column_name = 'scale_video') THEN
        ALTER TABLE playlists ADD COLUMN scale_video VARCHAR(20) DEFAULT 'fit';
    END IF;

    -- Add scale_document column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'playlists' AND column_name = 'scale_document') THEN
        ALTER TABLE playlists ADD COLUMN scale_document VARCHAR(20) DEFAULT 'fit';
    END IF;

    -- Add shuffle column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'playlists' AND column_name = 'shuffle') THEN
        ALTER TABLE playlists ADD COLUMN shuffle BOOLEAN DEFAULT false;
    END IF;

    -- Add default_transition column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'playlists' AND column_name = 'default_transition') THEN
        ALTER TABLE playlists ADD COLUMN default_transition VARCHAR(20) DEFAULT 'fade';
    END IF;

    -- Add transition_speed column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'playlists' AND column_name = 'transition_speed') THEN
        ALTER TABLE playlists ADD COLUMN transition_speed VARCHAR(20) DEFAULT 'normal';
    END IF;

    -- Add auto_advance column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'playlists' AND column_name = 'auto_advance') THEN
        ALTER TABLE playlists ADD COLUMN auto_advance BOOLEAN DEFAULT true;
    END IF;

    -- Add background_color column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'playlists' AND column_name = 'background_color') THEN
        ALTER TABLE playlists ADD COLUMN background_color VARCHAR(7) DEFAULT '#000000';
    END IF;

    -- Add text_overlay column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'playlists' AND column_name = 'text_overlay') THEN
        ALTER TABLE playlists ADD COLUMN text_overlay BOOLEAN DEFAULT false;
    END IF;

    -- Add loop_enabled column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'playlists' AND column_name = 'loop_enabled') THEN
        ALTER TABLE playlists ADD COLUMN loop_enabled BOOLEAN DEFAULT true;
    END IF;

    -- Add schedule_enabled column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'playlists' AND column_name = 'schedule_enabled') THEN
        ALTER TABLE playlists ADD COLUMN schedule_enabled BOOLEAN DEFAULT false;
    END IF;

    -- Add start_time column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'playlists' AND column_name = 'start_time') THEN
        ALTER TABLE playlists ADD COLUMN start_time TIME;
    END IF;

    -- Add end_time column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'playlists' AND column_name = 'end_time') THEN
        ALTER TABLE playlists ADD COLUMN end_time TIME;
    END IF;

    -- Add selected_days column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'playlists' AND column_name = 'selected_days') THEN
        ALTER TABLE playlists ADD COLUMN selected_days JSONB DEFAULT '[]'::jsonb;
    END IF;

END $$;

-- Update existing playlists with default values
UPDATE playlists 
SET 
    scale_image = COALESCE(scale_image, 'fit'),
    scale_video = COALESCE(scale_video, 'fit'),
    scale_document = COALESCE(scale_document, 'fit'),
    shuffle = COALESCE(shuffle, false),
    default_transition = COALESCE(default_transition, 'fade'),
    transition_speed = COALESCE(transition_speed, 'normal'),
    auto_advance = COALESCE(auto_advance, true),
    background_color = COALESCE(background_color, '#000000'),
    text_overlay = COALESCE(text_overlay, false),
    loop_enabled = COALESCE(loop_enabled, true),
    schedule_enabled = COALESCE(schedule_enabled, false),
    selected_days = COALESCE(selected_days, '[]'::jsonb)
WHERE 
    scale_image IS NULL OR 
    scale_video IS NULL OR 
    scale_document IS NULL OR 
    shuffle IS NULL OR 
    default_transition IS NULL OR 
    transition_speed IS NULL OR 
    auto_advance IS NULL OR 
    background_color IS NULL OR 
    text_overlay IS NULL OR 
    loop_enabled IS NULL OR 
    schedule_enabled IS NULL OR 
    selected_days IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_playlists_user_status ON playlists(user_id, status);
CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist_position ON playlist_items(playlist_id, position);

-- Log completion
SELECT 'Playlist options columns added successfully' as result;
