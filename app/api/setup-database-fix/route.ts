import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function POST() {
  try {
    console.log("Setting up database schema fixes...")
    const sql = getDb()

    // Add missing columns to devices table
    await sql`
      ALTER TABLE devices 
      ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'monitor'
    `

    await sql`
      ALTER TABLE devices 
      ADD COLUMN IF NOT EXISTS location VARCHAR(255)
    `

    await sql`
      ALTER TABLE devices 
      ADD COLUMN IF NOT EXISTS resolution VARCHAR(20) DEFAULT '1920x1080'
    `

    await sql`
      ALTER TABLE devices 
      ADD COLUMN IF NOT EXISTS code VARCHAR(10)
    `

    await sql`
      ALTER TABLE devices 
      ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `

    // Update existing devices to have proper values
    await sql`
      UPDATE devices 
      SET 
        type = COALESCE(type, 'monitor'),
        location = COALESCE(location, 'Office'),
        resolution = COALESCE(resolution, '1920x1080'),
        last_seen = COALESCE(last_seen, last_heartbeat, created_at)
      WHERE type IS NULL OR type = ''
    `

    // Create indexes for better performance
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_devices_code ON devices(code)`
    } catch (indexError) {
      console.log("Index creation skipped (may already exist)")
    }

    console.log("Database schema fixes completed successfully")

    return NextResponse.json({
      success: true,
      message: "Database schema updated successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Database setup error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to setup database",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 },
    )
  }
}
