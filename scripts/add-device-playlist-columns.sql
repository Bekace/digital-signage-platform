-- Add playlist assignment columns to devices table
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS assigned_playlist_id INTEGER,
ADD COLUMN IF NOT EXISTS playlist_status VARCHAR(20) DEFAULT 'stopped',
ADD COLUMN IF NOT EXISTS last_control_action VARCHAR(20),
ADD COLUMN IF NOT EXISTS last_control_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add foreign key constraint
ALTER TABLE devices 
ADD CONSTRAINT fk_devices_playlist 
FOREIGN KEY (assigned_playlist_id) REFERENCES playlists(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_devices_playlist ON devices(assigned_playlist_id);
CREATE INDEX IF NOT EXISTS idx_devices_user_status ON devices(user_id, status);

-- Update existing devices to have updated_at timestamp
UPDATE devices SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
