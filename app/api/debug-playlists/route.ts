import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  console.log("🐛 [DEBUG PLAYLISTS] Starting debug check")

  try {
    const user = await getCurrentUser()
    const sql = getDb()

    // Check if tables exist
    const tableCheck = await sql`
      SELECT 
        table_name,
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = table_name) as exists
      FROM (VALUES 
        ('playlists'),
        ('playlist_items'),
        ('playlist_assignments')
      ) AS t(table_name)
    `

    // Check table structures
    const tableStructures = {}
    for (const table of tableCheck) {
      if (table.exists) {
        const columns = await sql`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = ${table.table_name}
          ORDER BY ordinal_position
        `
        tableStructures[table.table_name] = columns
      }
    }

    // Get sample data if user exists
    let sampleData = {}
    if (user) {
      try {
        const playlists = await sql`
          SELECT COUNT(*) as count FROM playlists WHERE user_id = ${user.id}
        `
        const items = await sql`
          SELECT COUNT(*) as count FROM playlist_items 
          WHERE playlist_id IN (SELECT id FROM playlists WHERE user_id = ${user.id})
        `
        const assignments = await sql`
          SELECT COUNT(*) as count FROM playlist_assignments 
          WHERE playlist_id IN (SELECT id FROM playlists WHERE user_id = ${user.id})
        `

        sampleData = {
          user_playlists: Number(playlists[0].count),
          user_playlist_items: Number(items[0].count),
          user_assignments: Number(assignments[0].count),
        }
      } catch (error) {
        sampleData = { error: error.message }
      }
    }

    return NextResponse.json({
      success: true,
      debug_info: {
        timestamp: new Date().toISOString(),
        user: user
          ? {
              id: user.id,
              email: user.email,
              is_admin: user.is_admin,
            }
          : null,
        tables: tableCheck,
        table_structures: tableStructures,
        sample_data: sampleData,
      },
    })
  } catch (error) {
    console.error("❌ [DEBUG PLAYLISTS] Error:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
      debug_info: {
        timestamp: new Date().toISOString(),
        error_details: error instanceof Error ? error.stack : "Unknown error",
      },
    })
  }
}
