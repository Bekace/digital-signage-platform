-- Create playlist_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS playlist_items (
    id SERIAL PRIMARY KEY,
    playlist_id INTEGER NOT NULL,
    media_id INTEGER NOT NULL,
    duration INTEGER DEFAULT 10,
    order_index INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    FOREIGN KEY (media_id) REFERENCES media_files(id) ON DELETE CASCADE
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist_id ON playlist_items(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_order ON playlist_items(playlist_id, order_index);

-- Insert some sample playlist items for testing
INSERT INTO playlist_items (playlist_id, media_id, duration, order_index) 
SELECT 1, 1, 10, 1
WHERE EXISTS (SELECT 1 FROM playlists WHERE id = 1)
AND EXISTS (SELECT 1 FROM media_files WHERE id = 1)
AND NOT EXISTS (SELECT 1 FROM playlist_items WHERE playlist_id = 1 AND media_id = 1);

INSERT INTO playlist_items (playlist_id, media_id, duration, order_index) 
SELECT 1, 2, 15, 2
WHERE EXISTS (SELECT 1 FROM playlists WHERE id = 1)
AND EXISTS (SELECT 1 FROM media_files WHERE id = 2)
AND NOT EXISTS (SELECT 1 FROM playlist_items WHERE playlist_id = 1 AND media_id = 2);
