-- Create device pairing codes table for testing
CREATE TABLE IF NOT EXISTS device_pairing_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP NULL,
    device_id INTEGER REFERENCES devices(id) ON DELETE SET NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_device_pairing_codes_code ON device_pairing_codes(code);
CREATE INDEX IF NOT EXISTS idx_device_pairing_codes_expires_at ON device_pairing_codes(expires_at);

-- Add missing columns to devices table if they don't exist
ALTER TABLE devices ADD COLUMN IF NOT EXISTS capabilities JSONB DEFAULT '[]';
ALTER TABLE devices ADD COLUMN IF NOT EXISTS screen_resolution VARCHAR(50) DEFAULT '';
ALTER TABLE devices ADD COLUMN IF NOT EXISTS current_media_id INTEGER REFERENCES media_files(id) ON DELETE SET NULL;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS playback_progress DECIMAL(5,2) DEFAULT 0;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS performance_metrics JSONB DEFAULT '{}';
ALTER TABLE devices ADD COLUMN IF NOT EXISTS assigned_playlist_id INTEGER REFERENCES playlists(id) ON DELETE SET NULL;

-- Create device heartbeats table for monitoring
CREATE TABLE IF NOT EXISTS device_heartbeats (
    id SERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'online',
    current_media_id INTEGER REFERENCES media_files(id) ON DELETE SET NULL,
    progress DECIMAL(5,2) DEFAULT 0,
    metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for heartbeats
CREATE INDEX IF NOT EXISTS idx_device_heartbeats_device_id ON device_heartbeats(device_id);
CREATE INDEX IF NOT EXISTS idx_device_heartbeats_created_at ON device_heartbeats(created_at);

-- Clean up expired codes (optional cleanup job)
DELETE FROM device_pairing_codes WHERE expires_at < CURRENT_TIMESTAMP;

-- Update devices table to allow NULL user_id for testing devices
ALTER TABLE devices ALTER COLUMN user_id DROP NOT NULL;
