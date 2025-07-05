-- Create playlist_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS playlist_items (
    id SERIAL PRIMARY KEY,
    playlist_id INTEGER NOT NULL,
    media_id INTEGER NOT NULL,
    duration INTEGER DEFAULT 10,
    order_index INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    FOREIGN KEY (media_id) REFERENCES media_files(id) ON DELETE CASCADE
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist_id ON playlist_items(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_order ON playlist_items(playlist_id, order_index);

-- Add unique constraint to prevent duplicate media in same playlist
CREATE UNIQUE INDEX IF NOT EXISTS idx_playlist_items_unique 
ON playlist_items(playlist_id, media_id);

-- Update existing playlists table to ensure it has the right structure
ALTER TABLE playlists 
ADD COLUMN IF NOT EXISTS item_count INTEGER DEFAULT 0;

-- Function to update item count
CREATE OR REPLACE FUNCTION update_playlist_item_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE playlists 
        SET item_count = (
            SELECT COUNT(*) 
            FROM playlist_items 
            WHERE playlist_id = NEW.playlist_id
        )
        WHERE id = NEW.playlist_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE playlists 
        SET item_count = (
            SELECT COUNT(*) 
            FROM playlist_items 
            WHERE playlist_id = OLD.playlist_id
        )
        WHERE id = OLD.playlist_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update item count
DROP TRIGGER IF EXISTS trigger_update_playlist_item_count_insert ON playlist_items;
DROP TRIGGER IF EXISTS trigger_update_playlist_item_count_delete ON playlist_items;

CREATE TRIGGER trigger_update_playlist_item_count_insert
    AFTER INSERT ON playlist_items
    FOR EACH ROW
    EXECUTE FUNCTION update_playlist_item_count();

CREATE TRIGGER trigger_update_playlist_item_count_delete
    AFTER DELETE ON playlist_items
    FOR EACH ROW
    EXECUTE FUNCTION update_playlist_item_count();

-- Update existing playlist item counts
UPDATE playlists 
SET item_count = (
    SELECT COUNT(*) 
    FROM playlist_items 
    WHERE playlist_items.playlist_id = playlists.id
);

-- Insert some sample data if tables are empty
INSERT INTO playlist_items (playlist_id, media_id, duration, order_index)
SELECT 1, 1, 10, 1
WHERE NOT EXISTS (SELECT 1 FROM playlist_items WHERE playlist_id = 1 AND media_id = 1)
AND EXISTS (SELECT 1 FROM playlists WHERE id = 1)
AND EXISTS (SELECT 1 FROM media_files WHERE id = 1);

INSERT INTO playlist_items (playlist_id, media_id, duration, order_index)
SELECT 1, 2, 15, 2
WHERE NOT EXISTS (SELECT 1 FROM playlist_items WHERE playlist_id = 1 AND media_id = 2)
AND EXISTS (SELECT 1 FROM playlists WHERE id = 1)
AND EXISTS (SELECT 1 FROM media_files WHERE id = 2);
