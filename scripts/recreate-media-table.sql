-- Drop and recreate the media_files table with all required columns
DROP TABLE IF EXISTS media_files;

CREATE TABLE media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL, -- 'image', 'video', 'document', 'other'
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100),
  storage_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER, -- for videos in seconds
  dimensions VARCHAR(20), -- e.g., "1920x1080"
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_media_files_user_id ON media_files(user_id);
CREATE INDEX idx_media_files_file_type ON media_files(file_type);
CREATE INDEX idx_media_files_created_at ON media_files(created_at);

-- Insert some sample data for testing (optional)
-- This will be removed once real uploads work
INSERT INTO media_files (user_id, filename, original_name, file_type, file_size, mime_type, storage_url) 
SELECT 
  id as user_id,
  'sample-image.jpg' as filename,
  'Sample Image.jpg' as original_name,
  'image' as file_type,
  1024000 as file_size,
  'image/jpeg' as mime_type,
  '/placeholder.svg?height=200&width=300' as storage_url
FROM users 
WHERE email = 'bekace.multimedia@gmail.com'
LIMIT 1;
