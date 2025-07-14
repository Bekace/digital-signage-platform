import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("🔧 [DB INIT] Starting database initialization...")

    const results = {
      tablesCreated: [],
      columnsAdded: [],
      indexesCreated: [],
      triggersCreated: [],
      errors: [],
      success: true,
      operations: [],
      timestamp: new Date().toISOString(),
    }

    // Check if playlists table exists and has all required columns
    try {
      const tableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'playlists'
        )
      `

      if (tableExists[0].exists) {
        // Get current columns
        const currentColumns = await sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'playlists'
          AND table_schema = 'public'
        `

        const columnNames = currentColumns.map((col) => col.column_name)
        console.log("🔧 [DB INIT] Current playlist columns:", columnNames)

        // Define required columns that might be missing
        const requiredColumns = [
          { name: "scale_image", type: "VARCHAR(20)", default: "'fit'" },
          { name: "scale_video", type: "VARCHAR(20)", default: "'fit'" },
          { name: "scale_document", type: "VARCHAR(20)", default: "'fit'" },
          { name: "shuffle", type: "BOOLEAN", default: "false" },
          { name: "default_transition", type: "VARCHAR(50)", default: "'fade'" },
          { name: "transition_speed", type: "VARCHAR(20)", default: "'normal'" },
          { name: "auto_advance", type: "BOOLEAN", default: "true" },
          { name: "background_color", type: "VARCHAR(7)", default: "'#000000'" },
          { name: "text_overlay", type: "BOOLEAN", default: "false" },
        ]

        // Add missing columns
        for (const column of requiredColumns) {
          if (!columnNames.includes(column.name)) {
            try {
              await sql.unsafe(`
                ALTER TABLE playlists 
                ADD COLUMN ${column.name} ${column.type} DEFAULT ${column.default}
              `)
              results.columnsAdded.push(`playlists.${column.name}`)
              results.operations.push(`Added column: ${column.name}`)
              console.log(`🔧 [DB INIT] Added column: ${column.name}`)
            } catch (error) {
              const errorMsg = `Failed to add column ${column.name}: ${error.message}`
              results.errors.push(errorMsg)
              results.operations.push(errorMsg)
              console.error(`🔧 [DB INIT] ${errorMsg}`)
            }
          } else {
            results.operations.push(`Column already exists: ${column.name}`)
          }
        }
      } else {
        results.errors.push("Playlists table does not exist")
        results.success = false
        results.operations.push("Playlists table does not exist")
      }
    } catch (error) {
      const errorMsg = `Database initialization failed: ${error.message}`
      results.errors.push(errorMsg)
      results.success = false
      results.operations.push(errorMsg)
      console.error("🔧 [DB INIT]", errorMsg)
    }

    // Create users table if it doesn't exist
    try {
      await sql`
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
        )
      `
      results.tablesCreated.push("users")
      results.operations.push("Created table: users")
    } catch (error) {
      results.errors.push({ table: "users", error: error.message })
      results.operations.push(`Failed to create table users: ${error.message}`)
    }

    // Create media_files table if it doesn't exist
    try {
      await sql`
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
        )
      `
      results.tablesCreated.push("media_files")
      results.operations.push("Created table: media_files")
    } catch (error) {
      results.errors.push({ table: "media_files", error: error.message })
      results.operations.push(`Failed to create table media_files: ${error.message}`)
    }

    // Create playlist_items table if it doesn't exist
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS playlist_items (
          id SERIAL PRIMARY KEY,
          playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
          media_id UUID REFERENCES media_files(id) ON DELETE CASCADE,
          position INTEGER NOT NULL,
          duration INTEGER DEFAULT 10,
          transition VARCHAR(50) DEFAULT 'fade',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
      results.tablesCreated.push("playlist_items")
      results.operations.push("Created table: playlist_items")
    } catch (error) {
      results.errors.push({ table: "playlist_items", error: error.message })
      results.operations.push(`Failed to create table playlist_items: ${error.message}`)
    }

    // Create devices table if it doesn't exist
    try {
      await sql`
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
        )
      `
      results.tablesCreated.push("devices")
      results.operations.push("Created table: devices")
    } catch (error) {
      results.errors.push({ table: "devices", error: error.message })
      results.operations.push(`Failed to create table devices: ${error.message}`)
    }

    // Create device_pairing_codes table if it doesn't exist
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS device_pairing_codes (
          id SERIAL PRIMARY KEY,
          code VARCHAR(10) UNIQUE NOT NULL,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          device_name VARCHAR(255),
          expires_at TIMESTAMP NOT NULL,
          used_at TIMESTAMP,
          device_id INTEGER REFERENCES devices(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
      results.tablesCreated.push("device_pairing_codes")
      results.operations.push("Created table: device_pairing_codes")
    } catch (error) {
      results.errors.push({ table: "device_pairing_codes", error: error.message })
      results.operations.push(`Failed to create table device_pairing_codes: ${error.message}`)
    }

    // Create indexes for better performance
    const indexes = [
      "CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_playlists_status ON playlists(status)",
      "CREATE INDEX IF NOT EXISTS idx_playlists_deleted_at ON playlists(deleted_at)",
      "CREATE INDEX IF NOT EXISTS idx_media_files_user_id ON media_files(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_media_files_file_type ON media_files(file_type)",
      "CREATE INDEX IF NOT EXISTS idx_media_files_deleted_at ON media_files(deleted_at)",
      "CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist_id ON playlist_items(playlist_id)",
      "CREATE INDEX IF NOT EXISTS idx_playlist_items_position ON playlist_items(position)",
      "CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id)",
      "CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status)",
      "CREATE INDEX IF NOT EXISTS idx_device_pairing_codes_code ON device_pairing_codes(code)",
      "CREATE INDEX IF NOT EXISTS idx_device_pairing_codes_user_id ON device_pairing_codes(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_device_pairing_codes_expires_at ON device_pairing_codes(expires_at)",
    ]

    for (const indexQuery of indexes) {
      try {
        await sql.unsafe(indexQuery)
        results.indexesCreated.push(indexQuery.split(" ON ")[1])
        results.operations.push(`Created index: ${indexQuery.split(" ON ")[1]}`)
      } catch (error) {
        results.errors.push({ index: indexQuery, error: error.message })
        results.operations.push(`Failed to create index ${indexQuery.split(" ON ")[1]}: ${error.message}`)
      }
    }

    // Create triggers for updated_at timestamps
    try {
      await sql`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql'
      `

      const triggers = [
        "DROP TRIGGER IF EXISTS update_users_updated_at ON users; CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()",
        "DROP TRIGGER IF EXISTS update_playlists_updated_at ON playlists; CREATE TRIGGER update_playlists_updated_at BEFORE UPDATE ON playlists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()",
        "DROP TRIGGER IF EXISTS update_media_files_updated_at ON media_files; CREATE TRIGGER update_media_files_updated_at BEFORE UPDATE ON media_files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()",
        "DROP TRIGGER IF EXISTS update_playlist_items_updated_at ON playlist_items; CREATE TRIGGER update_playlist_items_updated_at BEFORE UPDATE ON playlist_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()",
        "DROP TRIGGER IF EXISTS update_devices_updated_at ON devices; CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()",
      ]

      for (const triggerQuery of triggers) {
        try {
          await sql.unsafe(triggerQuery)
          const tableName = triggerQuery.match(/ON (\w+)/)?.[1]
          if (tableName) {
            results.triggersCreated.push(`${tableName}_updated_at`)
            results.operations.push(`Created trigger: ${tableName}_updated_at`)
          }
        } catch (error) {
          results.errors.push({ trigger: triggerQuery, error: error.message })
          results.operations.push(`Failed to create trigger ${triggerQuery}: ${error.message}`)
        }
      }
    } catch (error) {
      results.errors.push({ function: "update_updated_at_column", error: error.message })
      results.operations.push(`Failed to create function update_updated_at_column: ${error.message}`)
    }

    console.log("🔧 [DB INIT] Database initialization completed")
    console.log("🔧 [DB INIT] Results:", results)

    return NextResponse.json(results)
  } catch (error) {
    console.error("🔧 [DB INIT] Database initialization failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Database initialization failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
