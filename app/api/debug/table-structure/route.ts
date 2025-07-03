import { NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

export async function GET() {
  try {
    // Get structure for key tables
    const tables: Record<string, any[]> = {}

    // List of important tables to check
    const tableNames = ["users", "devices", "device_codes", "media_files", "playlists", "playlist_items"]

    // Get column information for each table
    for (const tableName of tableNames) {
      try {
        const result = await sql`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = ${tableName}
          ORDER BY ordinal_position
        `
        tables[tableName] = result.rows
      } catch (err) {
        console.error(`Error getting structure for ${tableName}:`, err)
        tables[tableName] = [{ error: `Failed to get structure for ${tableName}` }]
      }
    }

    return NextResponse.json({
      success: true,
      tables,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Table structure error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    })
  }
}
