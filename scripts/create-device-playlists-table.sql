-- Create device_playlists table for assigning playlists to devices
CREATE TABLE IF NOT EXISTS device_playlists (
    id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
    playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(device_id) -- Each device can only have one playlist assigned
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_device_playlists_device_id ON device_playlists(device_id);
CREATE INDEX IF NOT EXISTS idx_device_playlists_playlist_id ON device_playlists(playlist_id);

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
