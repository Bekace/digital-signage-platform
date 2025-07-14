import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("🔧 [DEBUG INIT] Starting database initialization...")

    const results = []

    // Read and execute the SQL script
    const initScript = `
-- Ensure core tables exist with proper structure

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company VARCHAR(255),
    company_address TEXT,
    company_phone VARCHAR(50),
    plan VARCHAR(50) DEFAULT 'free',
    plan_type VARCHAR(20) DEFAULT 'free',
    media_files_count INTEGER DEFAULT 0,
    storage_used_bytes BIGINT DEFAULT 0,
    screens_count INTEGER DEFAULT 0,
    plan_expires_at TIMESTAMP,
    is_admin BOOLEAN DEFAULT false,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create playlists table if it doesn't exist
CREATE TABLE IF NOT EXISTS playlists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'draft',
    loop_enabled BOOLEAN DEFAULT true,
    schedule_enabled BOOLEAN DEFAULT false,
    start_time TIME,
    end_time TIME,
    selected_days VARCHAR(20),
    scale_image VARCHAR(20) DEFAULT 'fit',
    scale_video VARCHAR(20) DEFAULT 'fit',
    scale_document VARCHAR(20) DEFAULT 'fit',
    shuffle BOOLEAN DEFAULT false,
    default_transition VARCHAR(50) DEFAULT 'fade',
    transition_speed VARCHAR(20) DEFAULT 'normal',
    auto_advance BOOLEAN DEFAULT true,
    background_color VARCHAR(7) DEFAULT '#000000',
    text_overlay BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create media_files table if it doesn't exist
CREATE TABLE IF NOT EXISTS media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    storage_url TEXT,
    thumbnail_url TEXT,
    duration INTEGER,
    dimensions VARCHAR(20),
    metadata JSONB,
    media_source VARCHAR(50) DEFAULT 'upload',
    external_url TEXT,
    embed_settings JSONB,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create playlist_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS playlist_items (
    id SERIAL PRIMARY KEY,
    playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
    media_id UUID REFERENCES media_files(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    duration INTEGER DEFAULT 10,
    transition VARCHAR(50) DEFAULT 'fade',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create devices table if it doesn't exist
CREATE TABLE IF NOT EXISTS devices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    device_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'offline',
    last_seen TIMESTAMP,
    playlist_id INTEGER REFERENCES playlists(id),
    location VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create device_pairing_codes table if it doesn't exist
CREATE TABLE IF NOT EXISTS device_pairing_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    device_name VARCHAR(255),
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    device_id INTEGER REFERENCES devices(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
    `

    try {
      await sql.unsafe(initScript)
      results.push({
        step: "create_tables",
        status: "success",
        message: "Core tables created successfully",
      })
      console.log("✅ Core tables created")
    } catch (error) {
      results.push({
        step: "create_tables",
        status: "error",
        message: `Failed to create tables: ${error.message}`,
      })
      console.error("❌ Error creating tables:", error)
    }

    // Create indexes
    const indexScript = `
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_status ON playlists(status);
CREATE INDEX IF NOT EXISTS idx_playlists_deleted_at ON playlists(deleted_at);

CREATE INDEX IF NOT EXISTS idx_media_files_user_id ON media_files(user_id);
CREATE INDEX IF NOT EXISTS idx_media_files_file_type ON media_files(file_type);
CREATE INDEX IF NOT EXISTS idx_media_files_deleted_at ON media_files(deleted_at);

CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist_id ON playlist_items(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_position ON playlist_items(position);

CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);

CREATE INDEX IF NOT EXISTS idx_device_pairing_codes_code ON device_pairing_codes(code);
CREATE INDEX IF NOT EXISTS idx_device_pairing_codes_user_id ON device_pairing_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_device_pairing_codes_expires_at ON device_pairing_codes(expires_at);
    `

    try {
      await sql.unsafe(indexScript)
      results.push({
        step: "create_indexes",
        status: "success",
        message: "Indexes created successfully",
      })
      console.log("✅ Indexes created")
    } catch (error) {
      results.push({
        step: "create_indexes",
        status: "error",
        message: `Failed to create indexes: ${error.message}`,
      })
      console.error("❌ Error creating indexes:", error)
    }

    // Create triggers
    const triggerScript = `
-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_playlists_updated_at ON playlists;
CREATE TRIGGER update_playlists_updated_at BEFORE UPDATE ON playlists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_media_files_updated_at ON media_files;
CREATE TRIGGER update_media_files_updated_at BEFORE UPDATE ON media_files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_playlist_items_updated_at ON playlist_items;
CREATE TRIGGER update_playlist_items_updated_at BEFORE UPDATE ON playlist_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_devices_updated_at ON devices;
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `

    try {
      await sql.unsafe(triggerScript)
      results.push({
        step: "create_triggers",
        status: "success",
        message: "Triggers created successfully",
      })
      console.log("✅ Triggers created")
    } catch (error) {
      results.push({
        step: "create_triggers",
        status: "error",
        message: `Failed to create triggers: ${error.message}`,
      })
      console.error("❌ Error creating triggers:", error)
    }

    // Verify tables exist
    const verificationResults = []
    const tablesToCheck = ["users", "playlists", "media_files", "playlist_items", "devices", "device_pairing_codes"]

    for (const tableName of tablesToCheck) {
      try {
        const tableExists = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${tableName}
          )
        `
        verificationResults.push({
          table: tableName,
          exists: tableExists[0].exists,
        })
      } catch (error) {
        verificationResults.push({
          table: tableName,
          exists: false,
          error: error.message,
        })
      }
    }

    results.push({
      step: "verification",
      status: "success",
      message: "Table verification completed",
      tables: verificationResults,
    })

    console.log("🔧 [DEBUG INIT] Database initialization completed")

    return NextResponse.json({
      success: true,
      message: "Database initialization completed",
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("🔧 [DEBUG INIT] Error initializing database:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize database",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
