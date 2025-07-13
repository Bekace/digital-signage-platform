import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  console.log("🔍 [DEBUG COMPREHENSIVE] Starting comprehensive playlist debug")

  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()
    const debug: any = {
      user_id: user.id,
      timestamp: new Date().toISOString(),
      tables: {},
      test_query: {},
      summary: {},
    }

    // Check playlists table
    try {
      const playlistsColumns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'playlists' 
        ORDER BY ordinal_position
      `

      const playlistsSample = await sql`
        SELECT * FROM playlists WHERE user_id = ${user.id} LIMIT 3
      `

      debug.tables.playlists = {
        exists: true,
        columns: playlistsColumns,
        missing_columns: [],
        sample_data: playlistsSample,
        column_count: playlistsColumns.length,
      }
    } catch (error) {
      debug.tables.playlists = {
        exists: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    // Check playlist_items table
    try {
      const itemsColumns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'playlist_items' 
        ORDER BY ordinal_position
      `

      const itemsSample = await sql`
        SELECT pi.*, p.name as playlist_name
        FROM playlist_items pi
        LEFT JOIN playlists p ON pi.playlist_id = p.id
        WHERE p.user_id = ${user.id}
        LIMIT 5
      `

      debug.tables.playlist_items = {
        exists: true,
        columns: itemsColumns,
        missing_columns: [],
        sample_data: itemsSample,
        column_count: itemsColumns.length,
      }
    } catch (error) {
      debug.tables.playlist_items = {
        exists: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    // Test query
    try {
      const testResult = await sql`
        SELECT p.id, p.name, p.status, COUNT(pi.id) as item_count
        FROM playlists p
        LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
        WHERE p.user_id = ${user.id}
        GROUP BY p.id, p.name, p.status
        LIMIT 5
      `

      debug.test_query = {
        success: true,
        result: testResult,
        error: null,
      }
    } catch (error) {
      debug.test_query = {
        success: false,
        result: null,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    // Summary
    debug.summary = {
      playlists_table_ready: debug.tables.playlists?.exists || false,
      playlist_items_table_ready: debug.tables.playlist_items?.exists || false,
      total_playlists: debug.test_query.success ? debug.test_query.result.length : 0,
      total_playlist_items: debug.tables.playlist_items?.sample_data?.length || 0,
      all_systems_ready:
        debug.tables.playlists?.exists && debug.tables.playlist_items?.exists && debug.test_query.success,
    }

    return NextResponse.json({
      success: true,
      debug,
    })
  } catch (error) {
    console.error("❌ [DEBUG COMPREHENSIVE] Error:", error)
    return NextResponse.json(
      {
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
