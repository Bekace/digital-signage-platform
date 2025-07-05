-- Create playlists table if it doesn't exist
CREATE TABLE IF NOT EXISTS playlists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    loop_enabled BOOLEAN DEFAULT true,
    schedule_enabled BOOLEAN DEFAULT false,
    start_time TIME,
    end_time TIME,
    selected_days TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create playlist_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS playlist_items (
    id SERIAL PRIMARY KEY,
    playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    media_id INTEGER,
    item_type VARCHAR(50) NOT NULL DEFAULT 'media',
    duration INTEGER DEFAULT 10,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist_id ON playlist_items(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_order ON playlist_items(playlist_id, order_index);

-- Add unique constraint to prevent duplicate media in same playlist
ALTER TABLE playlist_items 
DROP CONSTRAINT IF EXISTS unique_playlist_media;

ALTER TABLE playlist_items 
ADD CONSTRAINT unique_playlist_media 
UNIQUE (playlist_id, media_id);

-- Insert some sample playlists if none exist
INSERT INTO playlists (user_id, name, description, status, created_at, updated_at) 
VALUES 
    (1, 'Welcome Playlist', 'Default welcome content for new screens', 'active', NOW(), NOW()),
    (1, 'Promotional Content', 'Latest promotional materials and announcements', 'draft', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert sample playlist items
INSERT INTO playlist_items (playlist_id, item_type, duration, order_index)
SELECT 1, 'media', 15, 1
WHERE EXISTS (SELECT 1 FROM playlists WHERE id = 1)
ON CONFLICT DO NOTHING;

INSERT INTO playlist_items (playlist_id, item_type, duration, order_index)
SELECT 1, 'media', 10, 2
WHERE EXISTS (SELECT 1 FROM playlists WHERE id = 1)
ON CONFLICT DO NOTHING;

INSERT INTO playlist_items (playlist_id, item_type, duration, order_index)
SELECT 1, 'media', 20, 3
WHERE EXISTS (SELECT 1 FROM playlists WHERE id = 1)
ON CONFLICT DO NOTHING;
