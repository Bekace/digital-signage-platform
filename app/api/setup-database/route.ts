import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function POST() {
  try {
    const sql = getDb()

    console.log("Starting comprehensive database setup...")

    // Test database connection first
    await sql`SELECT 1 as test`
    console.log("Database connection successful")

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          company VARCHAR(255),
          plan VARCHAR(50) DEFAULT 'monthly',
          is_admin BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log("Users table created/verified")

    // Create password reset tokens table
    await sql`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          token VARCHAR(255) UNIQUE NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          used BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log("Password reset tokens table created/verified")

    // Create device pairing codes table
    await sql`
      CREATE TABLE IF NOT EXISTS device_pairing_codes (
          id SERIAL PRIMARY KEY,
          code VARCHAR(6) UNIQUE NOT NULL,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          screen_name VARCHAR(255) NOT NULL,
          device_type VARCHAR(50) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          used BOOLEAN DEFAULT FALSE,
          used_at TIMESTAMP,
          device_id VARCHAR(255),
          completed_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log("Device pairing codes table created/verified")

    // Create devices table
    await sql`
      CREATE TABLE IF NOT EXISTS devices (
          id SERIAL PRIMARY KEY,
          device_id VARCHAR(255) UNIQUE NOT NULL,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          screen_name VARCHAR(255) NOT NULL,
          device_type VARCHAR(50) NOT NULL,
          platform VARCHAR(50) NOT NULL,
          api_key VARCHAR(255) UNIQUE NOT NULL,
          status VARCHAR(20) DEFAULT 'offline',
          location VARCHAR(255),
          resolution VARCHAR(20) DEFAULT '1920x1080',
          current_playlist_id INTEGER,
          last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log("Devices table created/verified")

    // Create device heartbeats table
    await sql`
      CREATE TABLE IF NOT EXISTS device_heartbeats (
          id SERIAL PRIMARY KEY,
          device_id VARCHAR(255) NOT NULL,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          status VARCHAR(20) NOT NULL,
          last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          ip_address VARCHAR(45),
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log("Device heartbeats table created/verified")

    // Create media files table
    await sql`
      CREATE TABLE IF NOT EXISTS media_files (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          filename VARCHAR(255) NOT NULL,
          original_name VARCHAR(255) NOT NULL,
          file_type VARCHAR(100) NOT NULL,
          file_size BIGINT NOT NULL,
          url TEXT NOT NULL,
          thumbnail_url TEXT,
          duration INTEGER,
          width INTEGER,
          height INTEGER,
          is_google_slides BOOLEAN DEFAULT FALSE,
          google_slides_id VARCHAR(255),
          is_deleted BOOLEAN DEFAULT FALSE,
          deleted_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log("Media files table created/verified")

    // Create playlists table
    await sql`
      CREATE TABLE IF NOT EXISTS playlists (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          is_default BOOLEAN DEFAULT FALSE,
          loop_playlist BOOLEAN DEFAULT TRUE,
          shuffle_items BOOLEAN DEFAULT FALSE,
          transition_type VARCHAR(50) DEFAULT 'fade',
          transition_duration INTEGER DEFAULT 1000,
          is_deleted BOOLEAN DEFAULT FALSE,
          deleted_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log("Playlists table created/verified")

    // Create playlist items table
    await sql`
      CREATE TABLE IF NOT EXISTS playlist_items (
          id SERIAL PRIMARY KEY,
          playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
          media_id INTEGER REFERENCES media_files(id) ON DELETE CASCADE,
          duration INTEGER NOT NULL DEFAULT 10,
          order_index INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log("Playlist items table created/verified")

    // Create plans table
    await sql`
      CREATE TABLE IF NOT EXISTS plans (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          type VARCHAR(50) NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          billing_cycle VARCHAR(20) NOT NULL,
          features JSONB NOT NULL,
          limits JSONB NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log("Plans table created/verified")

    // Create plan features table
    await sql`
      CREATE TABLE IF NOT EXISTS plan_features (
          id SERIAL PRIMARY KEY,
          plan_id INTEGER REFERENCES plans(id) ON DELETE CASCADE,
          feature_name VARCHAR(100) NOT NULL,
          feature_value VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log("Plan features table created/verified")

    // Create user plans table
    await sql`
      CREATE TABLE IF NOT EXISTS user_plans (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          plan_id INTEGER REFERENCES plans(id) ON DELETE CASCADE,
          status VARCHAR(50) DEFAULT 'active',
          started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log("User plans table created/verified")

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_device_pairing_codes_code ON device_pairing_codes(code)`
    await sql`CREATE INDEX IF NOT EXISTS idx_device_pairing_codes_user_id ON device_pairing_codes(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_media_files_user_id ON media_files(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist_id ON playlist_items(playlist_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_device_heartbeats_device_id ON device_heartbeats(device_id)`
    console.log("Database indexes created/verified")

    // Clean up any existing demo/sample data
    console.log("Cleaning up demo/sample data...")

    // Remove demo devices
    await sql`DELETE FROM devices WHERE device_id LIKE 'device_demo%' OR screen_name LIKE 'Sample Screen%'`

    // Remove test pairing codes
    await sql`DELETE FROM device_pairing_codes WHERE code IN ('TEST01', 'TEST02', 'DEMO01')`

    // Remove demo user if exists
    await sql`DELETE FROM users WHERE email = 'demo@signagecloud.com'`

    console.log("Demo/sample data cleaned up")

    // Verify table creation
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `

    console.log(
      "Created tables:",
      tables.map((t) => t.table_name),
    )

    return NextResponse.json({
      success: true,
      message: "Comprehensive database setup completed successfully",
      tables_created: tables.map((t) => t.table_name),
      demo_data_removed: true,
    })
  } catch (error) {
    console.error("Database setup error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Database setup failed",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
