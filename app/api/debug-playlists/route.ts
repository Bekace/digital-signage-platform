import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  console.log("🔍 [DEBUG PLAYLISTS API] Starting debug request")

  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [DEBUG PLAYLISTS API] No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()

    // Check if playlists table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'playlists'
      )
    `

    if (!tableExists[0].exists) {
      return NextResponse.json({
        error: "Playlists table does not exist",
        user_id: user.id,
        table_exists: false,
      })
    }

    // Get table structure
    const tableStructure = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'playlists'
      ORDER BY ordinal_position
    `

    // Get all playlists for debugging
    const playlists = await sql`
      SELECT * FROM playlists 
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `

    // Get playlist items table structure
    const itemsTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'playlist_items'
      )
    `

    let itemsTableStructure = []
    let playlistItems = []

    if (itemsTableExists[0].exists) {
      itemsTableStructure = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'playlist_items'
        ORDER BY ordinal_position
      `

      playlistItems = await sql`
        SELECT pi.*, p.name as playlist_name
        FROM playlist_items pi
        LEFT JOIN playlists p ON pi.playlist_id = p.id
        WHERE p.user_id = ${user.id}
        ORDER BY pi.playlist_id, pi.position
      `
    }

    console.log(`✅ [DEBUG PLAYLISTS API] Found ${playlists.length} playlists and ${playlistItems.length} items`)

    return NextResponse.json({
      success: true,
      user_id: user.id,
      user_email: user.email,
      playlists_table_exists: tableExists[0].exists,
      playlists_table_structure: tableStructure,
      playlists_count: playlists.length,
      playlists: playlists,
      items_table_exists: itemsTableExists[0].exists,
      items_table_structure: itemsTableStructure,
      playlist_items_count: playlistItems.length,
      playlist_items: playlistItems,
    })
  } catch (error) {
    console.error("❌ [DEBUG PLAYLISTS API] Error:", error)
    return NextResponse.json(
      {
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
