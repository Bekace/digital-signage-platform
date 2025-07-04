import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function POST() {
  try {
    console.log("Starting database schema fix...")
    const sql = getDb()

    // Check current table structure
    console.log("Checking current devices table structure...")
    const currentColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'devices' 
      ORDER BY ordinal_position
    `
    console.log("Current columns:", currentColumns)

    // Add missing columns one by one with error handling
    const columnsToAdd = [
      { name: "type", definition: "VARCHAR(50) DEFAULT 'monitor'" },
      { name: "location", definition: "VARCHAR(255)" },
      { name: "resolution", definition: "VARCHAR(20) DEFAULT '1920x1080'" },
      { name: "code", definition: "VARCHAR(10)" },
      { name: "last_seen", definition: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP" },
    ]

    for (const column of columnsToAdd) {
      try {
        console.log(`Adding column: ${column.name}`)
        await sql.unsafe(`ALTER TABLE devices ADD COLUMN IF NOT EXISTS ${column.name} ${column.definition}`)
        console.log(`✓ Added column: ${column.name}`)
      } catch (error) {
        console.log(`Column ${column.name} may already exist:`, error)
      }
    }

    // Update existing records
    console.log("Updating existing records...")
    await sql`
      UPDATE devices 
      SET 
        type = COALESCE(type, 'monitor'),
        location = COALESCE(location, 'Office'),
        resolution = COALESCE(resolution, '1920x1080'),
        last_seen = COALESCE(last_seen, created_at)
      WHERE id IS NOT NULL
    `

    // Create indexes
    const indexes = [
      "CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_devices_code ON devices(code)",
      "CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status)",
    ]

    for (const indexQuery of indexes) {
      try {
        await sql.unsafe(indexQuery)
        console.log(`✓ Created index`)
      } catch (error) {
        console.log(`Index may already exist:`, error)
      }
    }

    // Verify final structure
    const finalColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'devices' 
      ORDER BY ordinal_position
    `

    console.log("Database schema fix completed successfully")

    return NextResponse.json({
      success: true,
      message: "Database schema updated successfully",
      currentColumns: currentColumns,
      finalColumns: finalColumns,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Database schema fix error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fix database schema",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const sql = getDb()

    // Just check the current table structure
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'devices' 
      ORDER BY ordinal_position
    `

    return NextResponse.json({
      success: true,
      columns: columns,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Database check error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to check database",
      },
      { status: 500 },
    )
  }
}
