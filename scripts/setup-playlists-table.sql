-- Create playlists table if it doesn't exist
CREATE TABLE IF NOT EXISTS playlists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft' or 'active'
    user_id INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create playlist_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS playlist_items (
    id SERIAL PRIMARY KEY,
    playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    media_id INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    duration INTEGER DEFAULT 10, -- Duration in seconds for display
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_status ON playlists(status);
CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist_id ON playlist_items(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_order ON playlist_items(playlist_id, order_index);

-- Add unique constraint to prevent duplicate media in same playlist
ALTER TABLE playlist_items 
DROP CONSTRAINT IF EXISTS unique_playlist_media;

ALTER TABLE playlist_items 
ADD CONSTRAINT unique_playlist_media 
UNIQUE (playlist_id, media_id);

-- Insert some sample playlists if none exist
INSERT INTO playlists (name, description, status, user_id, created_at, updated_at)
SELECT 'Welcome Playlist', 'Default welcome content for new screens', 'active', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM playlists WHERE name = 'Welcome Playlist');

INSERT INTO playlists (name, description, status, user_id, created_at, updated_at)
SELECT 'Promotional Content', 'Marketing and promotional materials', 'draft', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM playlists WHERE name = 'Promotional Content');

INSERT INTO playlists (name, description, status, user_id, created_at, updated_at)
SELECT 'Emergency Alerts', 'Important announcements and alerts', 'draft', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM playlists WHERE name = 'Emergency Alerts');
