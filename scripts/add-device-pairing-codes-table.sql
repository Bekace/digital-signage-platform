-- Create device pairing codes table
CREATE TABLE IF NOT EXISTS device_pairing_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_device_pairing_codes_code ON device_pairing_codes(code);
CREATE INDEX IF NOT EXISTS idx_device_pairing_codes_expires ON device_pairing_codes(expires_at);

-- Ensure devices table has all required columns
ALTER TABLE devices ADD COLUMN IF NOT EXISTS device_type VARCHAR(50) DEFAULT 'unknown';
ALTER TABLE devices ADD COLUMN IF NOT EXISTS platform VARCHAR(100);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS capabilities JSONB DEFAULT '[]';
ALTER TABLE devices ADD COLUMN IF NOT EXISTS screen_resolution VARCHAR(20);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Create device heartbeats table for monitoring
CREATE TABLE IF NOT EXISTS device_heartbeats (
    id SERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'idle',
    current_item INTEGER,
    progress DECIMAL(5,2) DEFAULT 0,
    performance_metrics JSONB DEFAULT '{}',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for heartbeats
CREATE INDEX IF NOT EXISTS idx_device_heartbeats_device_timestamp ON device_heartbeats(device_id, timestamp DESC);

-- Insert some test data if tables are empty
INSERT INTO device_pairing_codes (code, expires_at, created_at) 
VALUES ('TEST01', CURRENT_TIMESTAMP + INTERVAL '1 hour', CURRENT_TIMESTAMP)
ON CONFLICT (code) DO NOTHING;
