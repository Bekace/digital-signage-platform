-- Add columns to device_codes table to store screen information
ALTER TABLE device_codes 
ADD COLUMN IF NOT EXISTS screen_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS device_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS location VARCHAR(255);
