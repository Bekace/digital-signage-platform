-- Create device_playlists table for assigning playlists to devices
CREATE TABLE IF NOT EXISTS device_playlists (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(255) NOT NULL,
    playlist_id VARCHAR(255) NOT NULL,
    user_id INTEGER NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_device_playlists_device 
        FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    CONSTRAINT fk_device_playlists_playlist 
        FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    CONSTRAINT fk_device_playlists_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate assignments
    CONSTRAINT unique_device_playlist 
        UNIQUE (device_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_device_playlists_device_id ON device_playlists(device_id);
CREATE INDEX IF NOT EXISTS idx_device_playlists_playlist_id ON device_playlists(playlist_id);
CREATE INDEX IF NOT EXISTS idx_device_playlists_user_id ON device_playlists(user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_device_playlists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_device_playlists_updated_at
    BEFORE UPDATE ON device_playlists
    FOR EACH ROW
    EXECUTE FUNCTION update_device_playlists_updated_at();
